import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { WebSocketServer } from "ws";
import { AgentManager } from "./agents";
import { createRoutes } from "./routes";
import { handleAgentConnection } from "./ws-handler";

const PORT = parseInt(process.env.RELAY_PORT || "3400", 10);
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Core components
// ---------------------------------------------------------------------------
const agentManager = new AgentManager();
const routes = createRoutes(agentManager);

const app = new Hono();
app.use("*", cors());
app.use("*", logger());
app.route("/", routes);

// ---------------------------------------------------------------------------
// Start HTTP server
// ---------------------------------------------------------------------------
const server = serve({ fetch: app.fetch, port: PORT });

// ---------------------------------------------------------------------------
// WebSocket server — shares the same underlying HTTP server
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ server: server as never });

wss.on("connection", (ws) => {
  handleAgentConnection(ws, agentManager);
});

// ---------------------------------------------------------------------------
// Heartbeat — ping all agents every PING_INTERVAL_MS, disconnect stale ones
// ---------------------------------------------------------------------------
setInterval(() => {
  // Remove agents that have not responded within PONG_TIMEOUT_MS
  const stale = agentManager.staleAgents(PONG_TIMEOUT_MS);
  for (const id of stale) {
    const agent = agentManager.get(id);
    if (agent) {
      console.log(`[relay] agent ${id} timed out — disconnecting`);
      try {
        agent.ws.close(1000, "pong timeout");
      } catch {
        // ignore
      }
      agentManager.unregister(id);
    }
  }

  // Send pings to remaining agents
  agentManager.pingAll();
}, PING_INTERVAL_MS);

// ---------------------------------------------------------------------------
// Startup banner
// ---------------------------------------------------------------------------
console.log(`
  ╔═══════════════════════════════════════════╗
  ║  ClawNet Relay                            ║
  ║  HTTP:  http://localhost:${PORT.toString().padEnd(17)}║
  ║  WS:    ws://localhost:${PORT.toString().padEnd(18)}║
  ╚═══════════════════════════════════════════╝
`);

export { app, wss, agentManager };

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "./config";
import { GatewayBridge } from "./services/gateway";
import { SkillRouter } from "./services/skill-router";
import { HeartbeatService } from "./services/heartbeat";
import { agentRoutes } from "./routes/agent";
import { skillRoutes } from "./routes/skills";
import { registryRoutes } from "./routes/registry";
import { resolveWalletAddress } from "./services/wallet";
import { RelayClient } from "./services/relay-client";

const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", logger());

// Health check
app.get("/health", (c) =>
  c.json({
    status: "ok",
    agentId: config.agentId,
    agentName: config.agentName,
    port: config.port,
    timestamp: Date.now(),
  })
);

// Initialize services
const gateway = new GatewayBridge();
const router = new SkillRouter(gateway);

// Boot — resolve wallet then mount routes and start server
(async () => {
  const wallet = await resolveWalletAddress();
  console.log(`Wallet: ${wallet.address} (source: ${wallet.source})`);

  if (wallet.source === "placeholder") {
    console.warn(
      "WARNING: No wallet found. Install Sol CLI or provide SOLANA_KEYPAIR_PATH to enable real payments."
    );
  }

  // Mount routes
  app.route("/api/agent", agentRoutes(gateway));
  app.route("/api/skills", skillRoutes(gateway, router, wallet.address));
  app.route("/api/registry", registryRoutes(gateway, router));

  // Start server
  const port = config.port;
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  ClawNet Node                             ║
  ║  Agent: ${config.agentId.padEnd(33)}║
  ║  Port:  ${port.toString().padEnd(33)}║
  ║  RPC:   ${config.solanaRpcUrl.substring(0, 33).padEnd(33)}║
  ╚═══════════════════════════════════════════╝
`);

  serve({ fetch: app.fetch, port });

  // Connect to relay if configured
  if (config.relayUrl) {
    const skills = await gateway.discoverSkills();
    const relayClient = new RelayClient({
      relayUrl: config.relayUrl,
      agentId: config.agentId,
      agentName: config.agentName,
      walletAddress: wallet.address,
      endpointUrl: config.nodeUrl || `http://localhost:${port}`,
      skills: skills.map((s) => ({ id: s.id, name: s.name, tags: s.tags ?? [] })),
      localPort: port,
    });
    relayClient.connect();
  }
})();

export { app };

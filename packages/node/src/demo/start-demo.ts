/**
 * Start 3 ClawNet demo agents on ports 3402, 3403, 3404.
 * Each agent has mock skills and can call each other's skills.
 *
 * Usage:
 *   npx tsx src/demo/start-demo.ts            # direct mode (no relay)
 *   npx tsx src/demo/start-demo.ts --relay     # start relay on :3400, agents connect via WS
 */
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { GatewayBridge } from "../services/gateway";
import { SkillRouter, RemoteSkillProvider } from "../services/skill-router";
import { agentRoutes } from "../routes/agent";
import { skillRoutes } from "../routes/skills";
import { registryRoutes } from "../routes/registry";
import { RelayClient } from "../services/relay-client";
import {
  setupAlphaSkills,
  setupBetaSkills,
  setupGammaSkills,
} from "./mock-skills";

const USE_RELAY = process.argv.includes("--relay");
const RELAY_PORT = 3400;
const RELAY_URL = `ws://localhost:${RELAY_PORT}`;

interface AgentConfig {
  id: string;
  name: string;
  port: number;
  setupSkills: (gw: GatewayBridge) => void;
  skillDefs: { id: string; name: string; tags: string[] }[];
}

const agents: AgentConfig[] = [
  {
    id: "alpha",
    name: "Agent Alpha",
    port: 3402,
    setupSkills: setupAlphaSkills,
    skillDefs: [
      { id: "code-review", name: "Code Review", tags: ["code", "review"] },
      { id: "generate-tests", name: "Generate Tests", tags: ["code", "testing"] },
    ],
  },
  {
    id: "beta",
    name: "Agent Beta",
    port: 3403,
    setupSkills: setupBetaSkills,
    skillDefs: [
      { id: "summarize-text", name: "Summarize Text", tags: ["text", "summary"] },
      { id: "extract-data", name: "Extract Data", tags: ["data", "extraction"] },
    ],
  },
  {
    id: "gamma",
    name: "Agent Gamma",
    port: 3404,
    setupSkills: setupGammaSkills,
    skillDefs: [
      { id: "translate-text", name: "Translate Text", tags: ["text", "translate"] },
    ],
  },
];

// All skills across the network (for direct routing, not used in relay mode)
const allSkills: { agentId: string; port: number; skills: string[] }[] = [
  { agentId: "alpha", port: 3402, skills: ["code-review", "generate-tests"] },
  { agentId: "beta", port: 3403, skills: ["summarize-text", "extract-data"] },
  { agentId: "gamma", port: 3404, skills: ["translate-text"] },
];

function buildRemoteProviders(
  excludeAgentId: string
): RemoteSkillProvider[] {
  if (USE_RELAY) {
    // In relay mode, remote calls go through the relay
    const providers: RemoteSkillProvider[] = [];
    for (const agent of allSkills) {
      if (agent.agentId === excludeAgentId) continue;
      for (const skillId of agent.skills) {
        providers.push({
          agentId: agent.agentId,
          skillId,
          endpointUrl: `http://localhost:${RELAY_PORT}`,
          invokeUrl: `http://localhost:${RELAY_PORT}/agents/${agent.agentId}/skills/${skillId}/invoke`,
          price: skillId === "translate-text" ? 10000 : 50000,
          reputation: 0.85,
        });
      }
    }
    return providers;
  }

  // Direct mode — agents call each other directly
  const providers: RemoteSkillProvider[] = [];
  for (const agent of allSkills) {
    if (agent.agentId === excludeAgentId) continue;
    for (const skillId of agent.skills) {
      providers.push({
        agentId: agent.agentId,
        skillId,
        endpointUrl: `http://localhost:${agent.port}`,
        price: skillId === "translate-text" ? 10000 : 50000,
        reputation: 0.85,
      });
    }
  }
  return providers;
}

function createAgentServer(cfg: AgentConfig): Hono {
  const app = new Hono();

  // Middleware
  app.use("*", cors());
  app.use("*", logger());

  // Setup mock gateway
  const gateway = new GatewayBridge();
  (gateway as any).mockMode = true;
  cfg.setupSkills(gateway);

  // Setup router with remote providers
  const router = new SkillRouter(gateway);
  router.refreshLocalSkills();
  router.setRemoteProviders(buildRemoteProviders(cfg.id));

  const walletAddress = process.env.DEMO_WALLET_ADDRESS || "11111111111111111111111111111111";

  // Health
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      agentId: cfg.id,
      agentName: cfg.name,
      port: cfg.port,
      relay: USE_RELAY,
      timestamp: Date.now(),
    })
  );

  // Routes
  app.route("/api/agent", agentRoutes(gateway));
  app.route("/api/skills", skillRoutes(gateway, router, walletAddress));
  app.route("/api/registry", registryRoutes(gateway, router));

  return app;
}

async function startRelay(): Promise<void> {
  const { serve: serveRelay } = await import("@hono/node-server");
  const { Hono: HonoRelay } = await import("hono");
  const { cors: corsRelay } = await import("hono/cors");
  const { WebSocketServer } = await import("ws");

  // Import relay modules via relative paths (same monorepo)
  const relayBase = "../../../relay/src";
  const { AgentManager } = await import(`${relayBase}/agents`);
  const { createRoutes } = await import(`${relayBase}/routes`);
  const { handleAgentConnection } = await import(`${relayBase}/ws-handler`);

  const agentManager = new AgentManager();
  const routes = createRoutes(agentManager);

  const relayApp = new HonoRelay();
  relayApp.use("*", corsRelay());
  relayApp.route("/", routes);

  const server = serveRelay({ fetch: relayApp.fetch, port: RELAY_PORT });
  const wss = new WebSocketServer({ server: server as never });

  wss.on("connection", (ws: any) => {
    handleAgentConnection(ws, agentManager);
  });

  console.log(`  [Relay] listening on http://localhost:${RELAY_PORT}`);
}

async function main() {
  const mode = USE_RELAY ? "Relay Mode" : "Direct Mode";
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║           ClawNet Demo — 3 Agent Mesh            ║
  ║           ${mode.padEnd(37)}║
  ╠══════════════════════════════════════════════════╣
  ║  Alpha :3402  code-review, generate-tests        ║
  ║  Beta  :3403  summarize-text, extract-data       ║
  ║  Gamma :3404  translate-text                     ║${USE_RELAY ? "\n  ║  Relay :3400  WebSocket gateway                  ║" : ""}
  ╚══════════════════════════════════════════════════╝
`);

  // Start relay if needed
  if (USE_RELAY) {
    try {
      await startRelay();
    } catch (err) {
      console.error("  Failed to start relay (run `pnpm build` in packages/relay first)");
      console.error("  Falling back to direct mode...\n");
    }
  }

  // Start all agents
  for (const cfg of agents) {
    const app = createAgentServer(cfg);
    serve({ fetch: app.fetch, port: cfg.port });
    console.log(`  [${cfg.name}] listening on http://localhost:${cfg.port}`);

    // Connect to relay
    if (USE_RELAY) {
      const relayClient = new RelayClient({
        relayUrl: RELAY_URL,
        agentId: cfg.id,
        agentName: cfg.name,
        walletAddress: process.env.DEMO_WALLET_ADDRESS || "11111111111111111111111111111111",
        endpointUrl: `http://localhost:${cfg.port}`,
        skills: cfg.skillDefs,
        localPort: cfg.port,
      });
      // Small delay so relay is ready
      setTimeout(() => relayClient.connect(), 500);
    }
  }

  console.log("\n  All agents running! Try:");
  console.log("  curl http://localhost:3402/health");
  console.log("  curl http://localhost:3402/api/skills");
  if (USE_RELAY) {
    console.log("  curl http://localhost:3400/agents");
    console.log('  curl -X POST http://localhost:3400/agents/alpha/skills/code-review/invoke -H "Content-Type: application/json" -d \'{"code":"function add(a,b){return a+b}"}\'');
  } else {
    console.log('  curl -X POST http://localhost:3404/api/skills/route -H "Content-Type: application/json" -d \'{"skillId":"code-review","input":{"code":"function add(a,b){return a+b}"}}\'');
  }
  console.log("\n  Press Ctrl+C to stop all agents.\n");
}

main().catch(console.error);

import { Hono } from "hono";
import { GatewayBridge } from "../services/gateway";
import { SkillRouter, RemoteSkillProvider } from "../services/skill-router";
import { ServiceType } from "@clawnet/sdk";
import { config } from "../config";

export function registryRoutes(
  gateway: GatewayBridge,
  router: SkillRouter
): Hono {
  const app = new Hono();

  // Re-scan local skills and optionally register on-chain
  app.post("/sync", async (c) => {
    const skills = await gateway.discoverSkills();
    await router.refreshLocalSkills();
    return c.json({
      message: "Skills synced",
      count: skills.length,
      skills: skills.map((s) => s.id),
    });
  });

  // Register this agent on the 8004 registry
  app.post("/register", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const name = body.name || config.agentName;
    const description = body.description || `ClawNet agent: ${config.agentId}`;
    const mcpEndpoint = body.mcpEndpoint;
    const a2aEndpoint = body.a2aEndpoint;
    const skills = body.skills as string[] | undefined;
    const tokenUri = body.tokenUri as string | undefined;

    const asset = await gateway.registerOnChain({
      name,
      description,
      mcpEndpoint,
      a2aEndpoint,
      skills,
      tokenUri,
    });

    if (!asset) {
      return c.json(
        { error: "Registration failed (no signer or tx error)" },
        500
      );
    }

    return c.json({
      message: "Agent registered on 8004",
      asset,
    });
  });

  // Search agents on the 8004 network
  app.get("/search", async (c) => {
    const owner = c.req.query("owner");
    const wallet = c.req.query("wallet");
    const limit = parseInt(c.req.query("limit") || "20", 10);

    try {
      const agents = await gateway.searchNetwork({ owner, wallet, limit });
      return c.json({
        results: agents,
        count: agents.length,
      });
    } catch (err: any) {
      return c.json(
        {
          results: [],
          count: 0,
          error: err.message || "Search failed",
        },
        500
      );
    }
  });

  // Get network-wide statistics from the 8004 indexer
  app.get("/stats", async (c) => {
    const stats = await gateway.getNetworkStats();
    if (!stats) {
      return c.json({ error: "Failed to fetch network stats" }, 500);
    }
    return c.json(stats);
  });

  return app;
}

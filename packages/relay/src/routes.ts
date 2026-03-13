import { Hono } from "hono";
import type { AgentManager, AgentInfo } from "./agents";
import { getX402Middleware } from "./x402";
import { fetchRegistryAgents, type RegistryAgent } from "./registry";

/** Merged agent view returned by GET /agents */
interface MergedAgent {
  agentId: string;
  name: string;
  walletAddress: string;
  endpointUrl: string;
  skills: { id: string; name: string; tags: string[] }[];
  connectedAt: number;
  status: "online" | "offline";
  /** 8004 registry identity (null if not registered on-chain) */
  registry: {
    asset: string;
    trustTier: number;
    qualityScore: number;
    feedbackCount: number;
    agentUri: string | null;
    createdAt: string;
  } | null;
}

/**
 * Merge 8004 registry agents with live WebSocket connections.
 *
 * - Connected agents: status=online, skills/endpointUrl from WS registration
 * - Registered but not connected: status=offline, shown from 8004 data
 * - Connected but not registered on-chain: still shown as online
 */
function mergeAgents(
  registryAgents: RegistryAgent[],
  connectedAgents: AgentInfo[],
): MergedAgent[] {
  const merged = new Map<string, MergedAgent>();

  // Index registry agents by wallet for lookup
  const registryByWallet = new Map<string, RegistryAgent>();
  for (const ra of registryAgents) {
    if (ra.agentWallet) registryByWallet.set(ra.agentWallet, ra);
  }

  // 1) Add all connected agents (keyed by agentId)
  for (const ca of connectedAgents) {
    const ra = registryByWallet.get(ca.walletAddress);
    merged.set(ca.agentId, {
      agentId: ca.agentId,
      name: ca.name || ca.agentId,
      walletAddress: ca.walletAddress,
      endpointUrl: ca.endpointUrl,
      skills: ca.skills,
      connectedAt: ca.connectedAt,
      status: "online",
      registry: ra ? {
        asset: ra.asset,
        trustTier: ra.trustTier,
        qualityScore: ra.qualityScore,
        feedbackCount: ra.feedbackCount,
        agentUri: ra.agentUri,
        createdAt: ra.createdAt,
      } : null,
    });
    // Remove matched registry agent so we don't add it again
    if (ra) registryByWallet.delete(ca.walletAddress);
  }

  // 2) Add remaining registry agents that are not connected (offline)
  for (const ra of registryByWallet.values()) {
    merged.set(ra.asset, {
      agentId: ra.asset.slice(0, 12),
      name: ra.name ?? ra.asset.slice(0, 8),
      walletAddress: ra.agentWallet!,
      endpointUrl: "",
      skills: [],
      connectedAt: 0,
      status: "offline",
      registry: {
        asset: ra.asset,
        trustTier: ra.trustTier,
        qualityScore: ra.qualityScore,
        feedbackCount: ra.feedbackCount,
        agentUri: ra.agentUri,
        createdAt: ra.createdAt,
      },
    });
  }

  // Sort: online first, then by name
  return [...merged.values()].sort((a, b) => {
    if (a.status !== b.status) return a.status === "online" ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "");
  });
}

/**
 * Build the Hono app with all HTTP routes for the relay.
 */
export function createRoutes(agentManager: AgentManager): Hono {
  const app = new Hono();

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      service: "clawnet-relay",
      connectedAgents: agentManager.list().length,
      timestamp: Date.now(),
    }),
  );

  // ---------------------------------------------------------------------------
  // List agents — merges 8004 registry with live WebSocket connections
  // ---------------------------------------------------------------------------
  app.get("/agents", async (c) => {
    const [registryAgents, connectedAgents] = await Promise.all([
      fetchRegistryAgents(),
      Promise.resolve(agentManager.list()),
    ]);

    const agents = mergeAgents(registryAgents, connectedAgents);

    return c.json({
      agents,
      meta: {
        registryCount: registryAgents.length,
        connectedCount: connectedAgents.length,
        mergedCount: agents.length,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Single agent info
  // ---------------------------------------------------------------------------
  app.get("/agents/:agentId", (c) => {
    const agentId = c.req.param("agentId");
    const agent = agentManager.get(agentId);
    if (!agent) {
      return c.json({ error: `Agent "${agentId}" is not connected` }, 404);
    }
    const { ws: _ws, ...info } = agent;
    return c.json(info);
  });

  // ---------------------------------------------------------------------------
  // Invoke a skill on a connected agent (x402 protected)
  //
  // The x402 middleware is applied dynamically: we look up the agent's wallet
  // address and use it as payTo so USDC flows directly to the agent.
  // ---------------------------------------------------------------------------
  app.post("/agents/:agentId/skills/:skillId/invoke", async (c, next) => {
    const agentId = c.req.param("agentId");
    const agent = agentManager.get(agentId);
    if (!agent) {
      return c.json({ error: `Agent "${agentId}" is not connected` }, 404);
    }

    // Dynamic x402 middleware: payTo is the agent's own wallet so USDC flows
    // directly to the agent. The middleware calls next() on success, after
    // which it reads c.res to decide whether to settle.
    const x402 = getX402Middleware(agent.walletAddress);
    return x402(c, async () => {
      // Payment verified — forward the invocation to the agent over WS
      const skillId = c.req.param("skillId");
      let input: unknown;
      try {
        input = await c.req.json();
      } catch {
        input = {};
      }

      try {
        const result = await agentManager.invoke(agentId, skillId, input);
        // Set the response on the context — do not return it.
        // The x402 middleware reads c.res after next() resolves.
        c.res = c.json({ success: true, result }) as unknown as Response;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        c.res = c.json({ success: false, error: message }, 502) as unknown as Response;
      }
    });
  });

  return app;
}

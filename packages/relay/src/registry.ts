/**
 * Query the 8004 Agent Registry indexer for all registered agents.
 * Returns basic identity data (name, wallet, reputation) without
 * requiring the full @clawnet/sdk dependency.
 */

const INDEXER_URL =
  process.env.INDEXER_8004_URL || "https://8004-indexer-dev.qnt.sh";

const CACHE_TTL = 60_000; // 1 minute

export interface RegistryAgent {
  /** Agent NFT asset pubkey */
  asset: string;
  /** Owner pubkey */
  owner: string;
  /** Display name from NFT metadata */
  name: string | null;
  /** Metadata URI (IPFS / data URI) */
  agentUri: string | null;
  /** Operational wallet (base58) */
  agentWallet: string | null;
  /** Reputation trust tier (0-4) */
  trustTier: number;
  /** Quality score */
  qualityScore: number;
  /** Number of feedbacks */
  feedbackCount: number;
  /** Created at ISO string */
  createdAt: string;
}

let cache: { agents: RegistryAgent[]; ts: number } | null = null;

/**
 * Fetch all agents from the 8004 indexer.
 * Results are cached for CACHE_TTL ms.
 */
export async function fetchRegistryAgents(): Promise<RegistryAgent[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.agents;
  }

  try {
    const res = await fetch(INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query {
          agents(limit: 200) {
            asset
            owner
            nft_name
            agent_uri
            agent_wallet
            trust_tier
            quality_score
            feedback_count
            created_at
          }
        }`,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[registry] indexer returned ${res.status}`);
      return cache?.agents ?? [];
    }

    const json = (await res.json()) as any;
    if (json.errors) {
      console.warn("[registry] indexer errors:", json.errors);
      return cache?.agents ?? [];
    }

    const raw: any[] = json.data?.agents ?? [];
    const agents: RegistryAgent[] = raw.map((a) => ({
      asset: a.asset,
      owner: a.owner,
      name: a.nft_name ?? null,
      agentUri: a.agent_uri ?? null,
      agentWallet: a.agent_wallet ?? null,
      trustTier: a.trust_tier ?? 0,
      qualityScore: a.quality_score ?? 0,
      feedbackCount: a.feedback_count ?? 0,
      createdAt: a.created_at ?? "",
    }));

    cache = { agents, ts: Date.now() };
    return agents;
  } catch (err) {
    console.warn("[registry] indexer query failed:", (err as Error).message);
    return cache?.agents ?? [];
  }
}

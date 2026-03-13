// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Agent {
  publicKey: string;
  agentId: string;
  name: string;
  endpointUrl: string;
  status: number;
  skillCount: number;
  reputationScore: number;
  totalEarned: number;
  totalSpent: number;
  totalCallsServed: number;
  totalCallsMade: number;
  lastHeartbeat: number;
  /** 8004 registry data — populated when the agent is registered on-chain */
  registry?: {
    asset: string;
    trustTier: number;
    qualityScore: number;
    feedbackCount: number;
    agentUri: string | null;
    createdAt: string;
  } | null;
}

export interface Skill {
  publicKey: string;
  skillId: string;
  agentId: string;
  agentName: string;
  agentPubkey: string;
  name: string;
  tags: string[];
  price: number;
  callCount: number;
  avgRating: number;
  ratingCount: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  callerAgent: string;
  providerAgent: string;
  skillId: string;
  skillPubkey: string;
  amount: number;
  success: boolean;
  rating: number;
  timestamp: number;
  txSignature?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const EXPLORER_BASE = "https://explorer.solana.com";

/** ClawNet Relay — single source of truth for all agent data */
const RELAY_URL = "/relay";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function explorerTxUrl(signature: string): string {
  return `${EXPLORER_BASE}/tx/${signature}?cluster=devnet`;
}

export function explorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE}/address/${address}?cluster=devnet`;
}

export function isRealTxSignature(sig: string | undefined): boolean {
  if (!sig) return false;
  const stripped = sig.replace(/^0x/, "");
  if (stripped.length < 32) return false;
  if (/^(0+|a+b+)+$/i.test(stripped)) return false;
  if (/^(ab)+$/i.test(stripped)) return false;
  if (/^[1-9A-HJ-NP-Za-km-z]{64,128}$/.test(sig)) return true;
  return stripped.length >= 64;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Relay merged agent type (returned by GET /relay/agents)
// ---------------------------------------------------------------------------
interface RelayMergedAgent {
  agentId: string;
  name: string;
  walletAddress: string;
  endpointUrl: string;
  skills: { id: string; name: string; tags: string[] }[];
  connectedAt: number;
  status: "online" | "offline";
  registry: {
    asset: string;
    trustTier: number;
    qualityScore: number;
    feedbackCount: number;
    agentUri: string | null;
    createdAt: string;
  } | null;
}

interface RelayAgentsResponse {
  agents: RelayMergedAgent[];
  meta: { registryCount: number; connectedCount: number; mergedCount: number };
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
let _agentsCache: { data: Agent[]; ts: number } | null = null;
let _skillsCache: { data: Skill[]; ts: number } | null = null;
let _callsCache: { data: Transaction[]; ts: number } | null = null;
let _relayCache: { data: RelayMergedAgent[]; ts: number } | null = null;
const CACHE_TTL = 15_000;

function isFresh(cache: { ts: number } | null): boolean {
  return cache !== null && Date.now() - cache.ts < CACHE_TTL;
}

/** Fetch merged agents from relay (cached) */
async function fetchRelayAgents(): Promise<RelayMergedAgent[]> {
  if (isFresh(_relayCache)) return _relayCache!.data;
  const data = await fetchJson<RelayAgentsResponse>(`${RELAY_URL}/agents`);
  const agents = data?.agents ?? [];
  _relayCache = { data: agents, ts: Date.now() };
  return agents;
}

// ---------------------------------------------------------------------------
// Fetch agents
// ---------------------------------------------------------------------------
async function fetchAgents(): Promise<Agent[]> {
  if (isFresh(_agentsCache)) return _agentsCache!.data;

  try {
    const relayAgents = await fetchRelayAgents();

    const agents: Agent[] = relayAgents.map((ra) => ({
      publicKey: ra.walletAddress || ra.agentId,
      agentId: ra.agentId,
      name: ra.name || ra.agentId,
      endpointUrl: ra.endpointUrl,
      status: ra.status === "online" ? 1 : 0,
      skillCount: ra.skills.length,
      reputationScore: ra.registry?.qualityScore ?? 85,
      totalEarned: 0,
      totalSpent: 0,
      totalCallsServed: 0,
      totalCallsMade: 0,
      lastHeartbeat: ra.connectedAt,
      registry: ra.registry,
    }));

    _agentsCache = { data: agents, ts: Date.now() };
    return agents;
  } catch (err) {
    console.error("Failed to fetch agents:", err);
    return _agentsCache?.data ?? [];
  }
}

// ---------------------------------------------------------------------------
// Fetch skills — derived from relay agent data (online agents only)
// ---------------------------------------------------------------------------
async function fetchSkills(): Promise<Skill[]> {
  if (isFresh(_skillsCache)) return _skillsCache!.data;

  try {
    const relayAgents = await fetchRelayAgents();

    const allSkills: Skill[] = [];
    for (const ra of relayAgents) {
      if (ra.status !== "online") continue;
      for (const s of ra.skills) {
        allSkills.push({
          publicKey: `${ra.walletAddress || ra.agentId}-${s.id}`,
          skillId: s.id,
          agentId: ra.agentId,
          agentName: ra.name || ra.agentId,
          agentPubkey: ra.walletAddress || ra.agentId,
          name: s.name,
          tags: s.tags ?? [],
          price: 10000,
          callCount: 0,
          avgRating: 0,
          ratingCount: 0,
          isActive: true,
        });
      }
    }

    _skillsCache = { data: allSkills, ts: Date.now() };
    return allSkills;
  } catch (err) {
    console.error("Failed to fetch skills:", err);
    return _skillsCache?.data ?? [];
  }
}

// ---------------------------------------------------------------------------
// Fetch transactions
// ---------------------------------------------------------------------------
async function fetchCallRecords(): Promise<Transaction[]> {
  if (isFresh(_callsCache)) return _callsCache!.data;
  const txs: Transaction[] = [];
  _callsCache = { data: txs, ts: Date.now() };
  return txs;
}

// ---------------------------------------------------------------------------
// Relay status
// ---------------------------------------------------------------------------
export interface RelayStatus {
  online: boolean;
  connectedAgents: number;
  agents: RelayMergedAgent[];
}

async function fetchRelayStatus(): Promise<RelayStatus> {
  try {
    const health = await fetchJson<{ status: string; connectedAgents: number }>(
      `${RELAY_URL}/health`
    );
    if (!health || health.status !== "ok") {
      return { online: false, connectedAgents: 0, agents: [] };
    }
    const agents = await fetchRelayAgents();
    return {
      online: true,
      connectedAgents: health.connectedAgents,
      agents,
    };
  } catch {
    return { online: false, connectedAgents: 0, agents: [] };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const api = {
  getAgents: fetchAgents,

  getAgent: async (id: string): Promise<Agent | undefined> => {
    const agents = await fetchAgents();
    return agents.find((a) => a.agentId === id);
  },

  getSkills: fetchSkills,

  getSkillsByAgent: async (agentId: string): Promise<Skill[]> => {
    const skills = await fetchSkills();
    return skills.filter((s) => s.agentId === agentId);
  },

  getTransactions: fetchCallRecords,

  getRelayStatus: fetchRelayStatus,

  getNetworkStats: async () => {
    const [agents, skills, calls] = await Promise.all([
      fetchAgents(),
      fetchSkills(),
      fetchCallRecords(),
    ]);
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === 1).length,
      totalSkills: skills.filter((s) => s.isActive).length,
      totalCalls: calls.length,
      totalVolume: calls.reduce((sum, t) => sum + t.amount, 0),
    };
  },
};

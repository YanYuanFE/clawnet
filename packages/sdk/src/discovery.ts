import { PublicKey } from "@solana/web3.js";
import type {
  IndexedAgent,
  IndexedAgentReputation,
  GlobalStats,
  AgentSearchParams,
  SolanaFeedback,
} from "8004-solana";
import { ClawNetRegistry } from "./registry";
import type { ClawNetAgent, ClawNetReputation, ClawNetNetworkStats } from "./types";

/**
 * ClawNetDiscovery provides high-level agent discovery and search
 * backed by the 8004 indexer. For on-chain reads, use ClawNetRegistry directly.
 */
export class ClawNetDiscovery {
  constructor(private registry: ClawNetRegistry) {}

  // === Agent Search ===

  /**
   * List all agents from the indexer.
   */
  async getAllAgents(options?: {
    limit?: number;
    offset?: number;
  }): Promise<ClawNetAgent[]> {
    const agents = await this.registry.searchAgents({
      limit: options?.limit || 100,
      offset: options?.offset,
    });
    return agents.map(toClawNetAgent);
  }

  /**
   * Search agents by owner public key.
   */
  async getAgentsByOwner(owner: string): Promise<ClawNetAgent[]> {
    const agents = await this.registry.searchAgents({ owner });
    return agents.map(toClawNetAgent);
  }

  /**
   * Find an agent by its operational wallet address.
   */
  async findAgentByWallet(wallet: string): Promise<ClawNetAgent | null> {
    const agent = await this.registry.getAgentByWallet(wallet);
    return agent ? toClawNetAgent(agent) : null;
  }

  /**
   * Search agents by various criteria via the indexer.
   */
  async searchAgents(params: AgentSearchParams): Promise<ClawNetAgent[]> {
    const agents = await this.registry.searchAgents(params);
    return agents.map(toClawNetAgent);
  }

  // === Reputation ===

  /**
   * Get reputation data for a specific agent.
   */
  async getAgentReputation(asset: string): Promise<ClawNetReputation | null> {
    const rep = await this.registry.sdk.getAgentReputationFromIndexer(
      new PublicKey(asset)
    );
    if (!rep) return null;
    return toClawNetReputation(asset, rep);
  }

  /**
   * Get the top agents by reputation score.
   */
  async getLeaderboard(options?: {
    limit?: number;
    minTier?: number;
    collection?: string;
  }): Promise<ClawNetAgent[]> {
    const agents = await this.registry.getLeaderboard(options);
    return agents.map(toClawNetAgent);
  }

  /**
   * Get feedbacks for a specific agent.
   */
  async getAgentFeedbacks(
    asset: string,
    options?: { includeRevoked?: boolean; limit?: number; offset?: number }
  ): Promise<SolanaFeedback[]> {
    return this.registry.sdk.getFeedbacksFromIndexer(new PublicKey(asset), options);
  }

  // === Network Stats ===

  /**
   * Get global network statistics.
   */
  async getNetworkStats(): Promise<ClawNetNetworkStats> {
    const stats = await this.registry.getGlobalStats();
    return toClawNetNetworkStats(stats);
  }

  /**
   * Check if the indexer is currently reachable.
   */
  async isIndexerAvailable(): Promise<boolean> {
    return this.registry.isIndexerAvailable();
  }
}

// === Converters ===

function toClawNetAgent(indexed: IndexedAgent): ClawNetAgent {
  return {
    asset: indexed.asset,
    owner: indexed.owner,
    name: indexed.nft_name,
    agentUri: indexed.agent_uri,
    agentWallet: indexed.agent_wallet,
    collection: indexed.collection,
    trustTier: indexed.trust_tier,
    qualityScore: indexed.quality_score,
    feedbackCount: indexed.feedback_count,
    rawAvgScore: indexed.raw_avg_score,
    createdAt: indexed.created_at,
  };
}

function toClawNetReputation(
  asset: string,
  rep: IndexedAgentReputation
): ClawNetReputation {
  return {
    asset,
    feedbackCount: rep.feedback_count,
    avgScore: rep.avg_score,
    positiveCount: rep.positive_count,
    negativeCount: rep.negative_count,
    // Trust tier and quality score come from the agent record, not the reputation view.
    // Use defaults here; callers can cross-reference with the agent record if needed.
    trustTier: 0,
    qualityScore: 0,
    confidence: 0,
  };
}

function toClawNetNetworkStats(stats: GlobalStats): ClawNetNetworkStats {
  return {
    totalAgents: stats.total_agents,
    totalCollections: stats.total_collections,
    totalFeedbacks: stats.total_feedbacks,
    totalValidations: stats.total_validations,
    platinumAgents: stats.platinum_agents,
    goldAgents: stats.gold_agents,
    avgQuality: stats.avg_quality,
  };
}

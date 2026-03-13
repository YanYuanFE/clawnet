import { PublicKey } from "@solana/web3.js";

// Re-export core 8004-solana types that ClawNet consumers need
export type {
  SolanaSDKConfig,
  AgentWithMetadata,
  EnrichedSummary,
  CollectionInfo,
} from "8004-solana";

export type {
  IndexedAgent,
  IndexedFeedback,
  IndexedAgentReputation,
  GlobalStats,
} from "8004-solana";

export type {
  AgentSearchParams,
  FeedbackSearchParams,
  ExtendedAgentSummary,
} from "8004-solana";

export type {
  TransactionResult,
  WriteOptions,
  RegisterAgentOptions,
  PreparedTransaction,
} from "8004-solana";

export type { Cluster, SolanaClientConfig } from "8004-solana";

export type {
  RegistrationFile,
  Service,
  GiveFeedbackParams,
  AgentSummary,
} from "8004-solana";

// Re-export enums (these are values, not just types)
export { ServiceType, TrustModel } from "8004-solana";

// === ClawNet-specific types ===

/**
 * Simplified agent info returned by ClawNet discovery / listing.
 * Normalizes both on-chain (AgentAccount) and indexed (IndexedAgent) shapes
 * into a single, easy-to-consume object.
 */
export interface ClawNetAgent {
  /** Agent Core asset public key (base58) */
  asset: string;
  /** Owner public key (base58) */
  owner: string;
  /** Agent display name (from NFT metadata) */
  name: string | null;
  /** Token URI pointing to full metadata JSON */
  agentUri: string | null;
  /** Operational wallet public key (base58), if set */
  agentWallet: string | null;
  /** Base registry collection public key (base58) */
  collection: string;
  /** Reputation trust tier (0-4) */
  trustTier: number;
  /** Quality score from ATOM engine */
  qualityScore: number;
  /** Feedback count */
  feedbackCount: number;
  /** Raw average score */
  rawAvgScore: number;
  /** When the agent was created */
  createdAt: string;
}

/**
 * Reputation data returned by ClawNet discovery.
 */
export interface ClawNetReputation {
  asset: string;
  feedbackCount: number;
  avgScore: number | null;
  positiveCount: number;
  negativeCount: number;
  trustTier: number;
  qualityScore: number;
  confidence: number;
}

/**
 * Network-wide statistics.
 */
export interface ClawNetNetworkStats {
  totalAgents: number;
  totalCollections: number;
  totalFeedbacks: number;
  totalValidations: number;
  platinumAgents: number;
  goldAgents: number;
  avgQuality: number | null;
}

// === Legacy types (kept for backward compatibility) ===

/** @deprecated Use ClawNetAgent instead */
export enum AgentStatus {
  Pending = 0,
  Active = 1,
  Offline = 2,
  Deregistered = 3,
}

/** @deprecated Replaced by 8004 IndexedAgent */
export interface AgentInfo {
  publicKey: PublicKey;
  owner: PublicKey;
  agentId: string;
  name: string;
  endpointUrl: string;
  metadataUri: string;
  skillCount: number;
  reputationScore: number;
  ratingCount: number;
  status: number;
}

/** @deprecated Replaced by 8004 metadata system */
export interface SkillInfo {
  publicKey: PublicKey;
  agent: PublicKey;
  skillId: string;
  name: string;
  descriptionHash: number[];
  tags: string[];
  priceLamports: { toNumber(): number };
  callCount: { toNumber(): number };
  avgRating: number;
  ratingCount: number;
  isActive: boolean;
}

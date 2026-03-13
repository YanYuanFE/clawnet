import { Keypair, PublicKey } from "@solana/web3.js";
import {
  SolanaSDK,
  type SolanaSDKConfig,
  type AgentWithMetadata,
  type IndexedAgent,
  type TransactionResult,
  type PreparedTransaction,
  type RegisterAgentOptions,
  type WriteOptions,
  type AgentAccount,
  buildRegistrationFileJson,
  ServiceType,
  IPFSClient,
  type RegistrationFile,
} from "8004-solana";
import { DEFAULT_CLUSTER, INDEXER_GRAPHQL_DEVNET, INDEXER_GRAPHQL_MAINNET } from "./constants";
import type { Cluster } from "8004-solana";

/**
 * Configuration for the ClawNet registry client.
 */
export interface ClawNetRegistryConfig {
  /** Solana cluster (default: "devnet") */
  cluster?: Cluster;
  /** Custom Solana RPC URL */
  rpcUrl?: string;
  /** Keypair for signing write operations */
  signer?: Keypair;
  /** IPFS client for metadata uploads */
  ipfsClient?: IPFSClient;
  /** Override the indexer GraphQL URL */
  indexerGraphqlUrl?: string;
  /** Use the indexer for read operations (default: true) */
  useIndexer?: boolean;
}

/**
 * Metadata parameters for registering a new ClawNet agent.
 */
export interface RegisterAgentParams {
  /** Agent display name */
  name: string;
  /** Agent description */
  description: string;
  /** MCP endpoint URL (if the agent exposes MCP) */
  mcpEndpoint?: string;
  /** A2A endpoint URL (if the agent exposes A2A) */
  a2aEndpoint?: string;
  /** Additional service endpoints */
  services?: Array<{ type: ServiceType; value: string }>;
  /** OASF skill taxonomy paths */
  skills?: string[];
  /** OASF domain taxonomy paths */
  domains?: string[];
  /** Agent avatar image URI */
  image?: string;
  /** Pre-built token URI (skips metadata building + IPFS upload) */
  tokenUri?: string;
  /** Wallet address to set as operational wallet */
  walletAddress?: string;
  /** Enable ATOM reputation at creation */
  atomEnabled?: boolean;
  /** Collection pointer for grouping */
  collectionPointer?: string;
}

/**
 * ClawNetRegistry wraps the 8004-solana SolanaSDK to provide
 * agent registration, update, and query operations on the
 * 8004 Agent Registry.
 */
export class ClawNetRegistry {
  public readonly sdk: SolanaSDK;
  private readonly cluster: Cluster;
  private readonly ipfsClient?: IPFSClient;

  constructor(config: ClawNetRegistryConfig = {}) {
    this.cluster = config.cluster || DEFAULT_CLUSTER;
    this.ipfsClient = config.ipfsClient;

    const indexerGraphqlUrl =
      config.indexerGraphqlUrl ||
      (this.cluster === "mainnet-beta" ? INDEXER_GRAPHQL_MAINNET : INDEXER_GRAPHQL_DEVNET);

    const sdkConfig: SolanaSDKConfig = {
      cluster: this.cluster,
      rpcUrl: config.rpcUrl,
      signer: config.signer,
      ipfsClient: config.ipfsClient,
      indexerGraphqlUrl,
      useIndexer: config.useIndexer !== false,
    };

    this.sdk = new SolanaSDK(sdkConfig);
  }

  // === Agent Registration ===

  /**
   * Register a new agent on the 8004 registry.
   *
   * If `params.tokenUri` is provided, it is used directly.
   * Otherwise, metadata JSON is built from the params and uploaded to IPFS
   * (requires an ipfsClient to be configured).
   */
  async registerAgent(
    params: RegisterAgentParams,
    options?: RegisterAgentOptions
  ): Promise<(TransactionResult & { asset?: PublicKey; signatures?: string[] }) | (PreparedTransaction & { asset: PublicKey })> {
    let tokenUri = params.tokenUri;

    // Build + upload metadata if no pre-built URI
    if (!tokenUri) {
      const services: RegistrationFile["services"] = [];

      if (params.mcpEndpoint) {
        services.push({ type: ServiceType.MCP, value: params.mcpEndpoint });
      }
      if (params.a2aEndpoint) {
        services.push({ type: ServiceType.A2A, value: params.a2aEndpoint });
      }
      if (params.services) {
        services.push(...params.services);
      }

      const registrationFile: RegistrationFile = {
        name: params.name,
        description: params.description,
        services,
        skills: params.skills,
        domains: params.domains,
        image: params.image,
        walletAddress: params.walletAddress,
      };

      const metadataJson = buildRegistrationFileJson(registrationFile);

      if (this.ipfsClient) {
        const cid = await this.ipfsClient.addJson(metadataJson);
        tokenUri = `ipfs://${cid}`;
      } else {
        // Without IPFS, embed as a data URI (for dev/testing)
        const encoded = Buffer.from(JSON.stringify(metadataJson)).toString("base64");
        tokenUri = `data:application/json;base64,${encoded}`;
      }
    }

    const registerOptions: RegisterAgentOptions = {
      ...options,
      atomEnabled: params.atomEnabled,
      collectionPointer: params.collectionPointer,
    };

    return this.sdk.registerAgent(tokenUri, registerOptions);
  }

  // === Agent Updates ===

  /**
   * Update agent metadata URI.
   */
  async setAgentUri(
    asset: PublicKey,
    newUri: string,
    options?: WriteOptions
  ): Promise<TransactionResult | PreparedTransaction> {
    return this.sdk.setAgentUri(asset, newUri, options);
  }

  /**
   * Set on-chain metadata key-value pair for an agent.
   */
  async setMetadata(
    asset: PublicKey,
    key: string,
    value: string,
    immutable?: boolean,
    options?: WriteOptions
  ): Promise<TransactionResult | PreparedTransaction> {
    return this.sdk.setMetadata(asset, key, value, immutable, options);
  }

  /**
   * Delete a mutable metadata entry.
   */
  async deleteMetadata(
    asset: PublicKey,
    key: string,
    options?: WriteOptions
  ): Promise<TransactionResult | PreparedTransaction> {
    return this.sdk.deleteMetadata(asset, key, options);
  }

  /**
   * Set the operational wallet for an agent (auto-signs with keypair).
   */
  async setAgentWallet(
    asset: PublicKey,
    walletKeypair: Keypair,
    options?: WriteOptions
  ): Promise<TransactionResult | PreparedTransaction> {
    return this.sdk.setAgentWallet(asset, walletKeypair, options);
  }

  /**
   * Transfer agent ownership to a new owner.
   */
  async transferAgent(
    asset: PublicKey,
    newOwner: PublicKey,
    options?: WriteOptions
  ): Promise<TransactionResult | PreparedTransaction> {
    return this.sdk.transferAgent(asset, newOwner, options);
  }

  // === Agent Reads ===

  /**
   * Load on-chain agent account data.
   */
  async getAgent(asset: PublicKey): Promise<AgentAccount | null> {
    return this.sdk.getAgent(asset);
  }

  /**
   * Check if an agent exists on-chain.
   */
  async agentExists(asset: PublicKey): Promise<boolean> {
    return this.sdk.agentExists(asset);
  }

  /**
   * Get all agents owned by a specific public key.
   */
  async getAgentsByOwner(owner: PublicKey): Promise<AgentWithMetadata[]> {
    return this.sdk.getAgentsByOwner(owner);
  }

  /**
   * Get all registered agents (on-chain, may require advanced RPC).
   */
  async getAllAgents(): Promise<AgentWithMetadata[]> {
    return this.sdk.getAllAgents();
  }

  /**
   * Get a metadata value by key for an agent.
   */
  async getMetadata(asset: PublicKey, key: string): Promise<string | null> {
    return this.sdk.getMetadata(asset, key);
  }

  /**
   * Get the owner public key of an agent.
   */
  async getAgentOwner(asset: PublicKey): Promise<PublicKey | null> {
    return this.sdk.getAgentOwner(asset);
  }

  // === Reputation ===

  /**
   * Get reputation summary (count + average score).
   */
  async getReputationSummary(
    asset: PublicKey
  ): Promise<{ count: number; averageScore: number }> {
    return this.sdk.getReputationSummary(asset);
  }

  /**
   * Give feedback to an agent.
   */
  async giveFeedback(
    asset: PublicKey,
    params: {
      value: string | number | bigint;
      valueDecimals?: number;
      score?: number;
      tag1?: string;
      tag2?: string;
      endpoint?: string;
      feedbackUri?: string;
    },
    options?: WriteOptions
  ): Promise<(TransactionResult & { feedbackIndex?: bigint }) | (PreparedTransaction & { feedbackIndex: bigint })> {
    return this.sdk.giveFeedback(asset, params, options);
  }

  // === Indexer Access ===

  /**
   * Search agents via the indexer.
   */
  async searchAgents(params: {
    owner?: string;
    collection?: string;
    wallet?: string;
    limit?: number;
    offset?: number;
  }): Promise<IndexedAgent[]> {
    return this.sdk.searchAgents(params);
  }

  /**
   * Get agent by operational wallet address (indexer).
   */
  async getAgentByWallet(wallet: string): Promise<IndexedAgent | null> {
    return this.sdk.getAgentByWallet(wallet);
  }

  /**
   * Get the leaderboard (top agents sorted by reputation).
   */
  async getLeaderboard(options?: {
    collection?: string;
    minTier?: number;
    limit?: number;
  }): Promise<IndexedAgent[]> {
    return this.sdk.getLeaderboard(options);
  }

  /**
   * Get global network statistics.
   */
  async getGlobalStats(): Promise<{
    total_agents: number;
    total_collections: number;
    total_feedbacks: number;
    total_validations: number;
    platinum_agents: number;
    gold_agents: number;
    avg_quality: number | null;
  }> {
    return this.sdk.getGlobalStats();
  }

  /**
   * Check if the indexer is available.
   */
  async isIndexerAvailable(): Promise<boolean> {
    return this.sdk.isIndexerAvailable();
  }

  /**
   * Whether the SDK has a signer configured for write operations.
   */
  get canWrite(): boolean {
    return this.sdk.canWrite;
  }
}

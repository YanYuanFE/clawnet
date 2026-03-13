import { Keypair } from "@solana/web3.js";
import {
  ClawNetRegistry,
  ClawNetDiscovery,
  type ClawNetAgent,
  type ClawNetNetworkStats,
  ServiceType,
  type RegisterAgentParams,
} from "@clawnet/sdk";
import { config } from "../config";

export interface LocalSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export interface SkillInvokeResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * GatewayBridge connects to the local OpenClaw Gateway to discover and invoke skills,
 * and optionally registers/queries agents on the 8004 registry.
 *
 * In demo mode, it uses a mock that returns preset results.
 */
export class GatewayBridge {
  private gatewayUrl: string;
  private mockMode: boolean;
  private mockSkills: Map<string, LocalSkill>;
  private mockResponses: Map<string, string>;

  /** 8004 registry client (lazy-initialized on first use) */
  private _registry: ClawNetRegistry | null = null;
  private _discovery: ClawNetDiscovery | null = null;

  constructor(gatewayUrl?: string) {
    this.gatewayUrl = gatewayUrl || config.openclawGatewayUrl;
    this.mockMode = process.env.MOCK_GATEWAY === "true";
    this.mockSkills = new Map();
    this.mockResponses = new Map();
  }

  // === 8004 Registry Helpers ===

  /** Get or lazily create the 8004 registry client. */
  getRegistry(): ClawNetRegistry {
    if (!this._registry) {
      let signer: Keypair | undefined;
      try {
        const { loadKeypair } = require("../services/wallet");
        signer = loadKeypair();
      } catch {
        // No keypair available; read-only mode
      }

      this._registry = new ClawNetRegistry({
        cluster: "devnet",
        rpcUrl: config.solanaRpcUrl,
        signer,
        useIndexer: true,
      });
    }
    return this._registry;
  }

  /** Get or lazily create the 8004 discovery client. */
  getDiscovery(): ClawNetDiscovery {
    if (!this._discovery) {
      this._discovery = new ClawNetDiscovery(this.getRegistry());
    }
    return this._discovery;
  }

  /**
   * Register this node's agent + skills on the 8004 registry.
   * Returns the agent asset public key (base58).
   */
  async registerOnChain(
    params: RegisterAgentParams
  ): Promise<string | null> {
    const registry = this.getRegistry();
    if (!registry.canWrite) {
      console.warn("No signer configured; cannot register on-chain");
      return null;
    }

    try {
      const result = await registry.registerAgent(params);
      if ("asset" in result && result.asset) {
        console.log(`Agent registered on 8004: ${result.asset.toBase58()}`);
        return result.asset.toBase58();
      }
      return null;
    } catch (err) {
      console.error("Failed to register agent on 8004:", err);
      return null;
    }
  }

  /**
   * Search for agents providing a specific capability on the network.
   */
  async searchNetwork(query: {
    owner?: string;
    wallet?: string;
    limit?: number;
  }): Promise<ClawNetAgent[]> {
    try {
      return this.getDiscovery().searchAgents(query);
    } catch (err) {
      console.error("Network search failed:", err);
      return [];
    }
  }

  /**
   * Get global network statistics from the 8004 indexer.
   */
  async getNetworkStats(): Promise<ClawNetNetworkStats | null> {
    try {
      return this.getDiscovery().getNetworkStats();
    } catch (err) {
      console.error("Failed to get network stats:", err);
      return null;
    }
  }

  // === Local Gateway (unchanged) ===

  /** Register mock skills for demo mode */
  registerMockSkill(skill: LocalSkill, mockResponse: string): void {
    this.mockSkills.set(skill.id, skill);
    this.mockResponses.set(skill.id, mockResponse);
  }

  /** Discover available skills from the local OpenClaw Gateway */
  async discoverSkills(): Promise<LocalSkill[]> {
    if (this.mockMode) {
      return Array.from(this.mockSkills.values());
    }

    try {
      const res = await fetch(`${this.gatewayUrl}/api/tools`);
      if (!res.ok) throw new Error(`Gateway returned ${res.status}`);
      const data = (await res.json()) as any;

      // OpenClaw Gateway returns tools in { tools: [...] } format
      return (data.tools || []).map((tool: any) => ({
        id: tool.name || tool.id,
        name: tool.display_name || tool.name,
        description: tool.description || "",
        tags: tool.tags || [],
      }));
    } catch (err) {
      console.error("Failed to connect to OpenClaw Gateway:", err);
      return [];
    }
  }

  /** Invoke a skill on the local OpenClaw Gateway */
  async invokeSkill(
    skillId: string,
    input: Record<string, any>
  ): Promise<SkillInvokeResult> {
    if (this.mockMode) {
      const mockResponse = this.mockResponses.get(skillId);
      if (!mockResponse) {
        return {
          success: false,
          output: "",
          error: `Skill ${skillId} not found`,
        };
      }
      // Simulate slight delay
      await new Promise((r) => setTimeout(r, 200));
      return { success: true, output: mockResponse };
    }

    try {
      const res = await fetch(`${this.gatewayUrl}/api/tools/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: skillId,
          input,
        }),
      });

      if (!res.ok) {
        return {
          success: false,
          output: "",
          error: `Gateway returned ${res.status}`,
        };
      }

      const data = (await res.json()) as any;
      return {
        success: true,
        output:
          typeof data.output === "string"
            ? data.output
            : JSON.stringify(data.output),
      };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  }
}

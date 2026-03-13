import { GatewayBridge, SkillInvokeResult } from "./gateway";
import { X402Client } from "./x402-client";

export interface RemoteSkillProvider {
  agentId: string;
  skillId: string;
  endpointUrl: string;
  price: number;
  reputation: number;
  /** Override the full invoke URL. If not set, defaults to `${endpointUrl}/api/skills/${skillId}/invoke` */
  invokeUrl?: string;
}

export interface RouteResult {
  routed: "local" | "remote";
  provider?: RemoteSkillProvider;
  result: SkillInvokeResult;
  cost: number;
}

/**
 * SkillRouter decides whether to execute a skill locally or find a remote provider.
 */
export class SkillRouter {
  private gateway: GatewayBridge;
  private localSkillIds: Set<string>;
  private remoteProviders: RemoteSkillProvider[];
  private x402Client: X402Client;

  constructor(gateway: GatewayBridge) {
    this.gateway = gateway;
    this.localSkillIds = new Set();
    this.remoteProviders = [];
    this.x402Client = new X402Client();
  }

  async refreshLocalSkills(): Promise<void> {
    const skills = await this.gateway.discoverSkills();
    this.localSkillIds = new Set(skills.map((s) => s.id));
  }

  setRemoteProviders(providers: RemoteSkillProvider[]): void {
    this.remoteProviders = providers;
  }

  hasLocalSkill(skillId: string): boolean {
    return this.localSkillIds.has(skillId);
  }

  findRemoteProvider(skillId: string): RemoteSkillProvider | null {
    const candidates = this.remoteProviders.filter(
      (p) => p.skillId === skillId
    );
    if (candidates.length === 0) return null;

    // Score: reputation * 0.7 + inverse_price * 0.3
    return candidates.sort((a, b) => {
      const scoreA = a.reputation * 0.7 + (1 / (1 + a.price / 100000)) * 0.3;
      const scoreB = b.reputation * 0.7 + (1 / (1 + b.price / 100000)) * 0.3;
      return scoreB - scoreA;
    })[0];
  }

  async route(
    skillId: string,
    input: Record<string, any>
  ): Promise<RouteResult> {
    // Try local first
    if (this.hasLocalSkill(skillId)) {
      const result = await this.gateway.invokeSkill(skillId, input);
      return { routed: "local", result, cost: 0 };
    }

    // Try remote
    const provider = this.findRemoteProvider(skillId);
    if (!provider) {
      return {
        routed: "local",
        result: {
          success: false,
          output: "",
          error: `No provider found for skill: ${skillId}`,
        },
        cost: 0,
      };
    }

    try {
      // Use X402Client for outbound payment — Sol CLI handles the 402 flow
      const invokeUrl = provider.invokeUrl ?? `${provider.endpointUrl}/api/skills/${provider.skillId}/invoke`;
      const { response, paid, amount } = await this.x402Client.payAndFetch(
        invokeUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }
      );

      if (paid) {
        console.log(
          `[x402] Paid ${amount} to ${provider.agentId} for ${provider.skillId}`
        );
      }

      if (!response.ok) {
        return {
          routed: "remote",
          provider,
          result: {
            success: false,
            output: "",
            error: `Remote call returned ${response.status}`,
          },
          cost: paid ? amount : 0,
        };
      }

      const data = (await response.json()) as any;
      return {
        routed: "remote",
        provider,
        result: {
          success: true,
          output:
            typeof data.output === "string"
              ? data.output
              : JSON.stringify(data),
        },
        cost: paid ? amount : provider.price,
      };
    } catch (err: any) {
      return {
        routed: "remote",
        provider,
        result: { success: false, output: "", error: err.message },
        cost: 0,
      };
    }
  }
}

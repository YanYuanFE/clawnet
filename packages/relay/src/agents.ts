import type { WebSocket } from "ws";

export interface AgentSkill {
  id: string;
  name: string;
  tags: string[];
}

export interface ConnectedAgent {
  agentId: string;
  name: string;
  walletAddress: string;
  endpointUrl: string;
  skills: AgentSkill[];
  ws: WebSocket;
  connectedAt: number;
  lastPing: number;
}

/** Serialisable view of an agent (no WebSocket handle). */
export interface AgentInfo {
  agentId: string;
  name: string;
  walletAddress: string;
  endpointUrl: string;
  skills: AgentSkill[];
  connectedAt: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class AgentManager {
  private agents = new Map<string, ConnectedAgent>();
  private pending = new Map<string, PendingRequest>();

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  register(
    agentId: string,
    name: string,
    walletAddress: string,
    endpointUrl: string,
    skills: AgentSkill[],
    ws: WebSocket,
  ): void {
    // If agent with same id was already connected, close old socket
    const existing = this.agents.get(agentId);
    if (existing) {
      try {
        existing.ws.close(1000, "replaced by new connection");
      } catch {
        // ignore close errors on stale sockets
      }
    }

    this.agents.set(agentId, {
      agentId,
      name,
      walletAddress,
      endpointUrl,
      skills,
      ws,
      connectedAt: Date.now(),
      lastPing: Date.now(),
    });

    console.log(
      `[relay] agent registered: ${agentId} (wallet=${walletAddress}, skills=${skills.length})`,
    );
  }

  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      console.log(`[relay] agent unregistered: ${agentId}`);
    }
  }

  get(agentId: string): ConnectedAgent | undefined {
    return this.agents.get(agentId);
  }

  /** Return a list of all connected agents without the ws handle. */
  list(): AgentInfo[] {
    return [...this.agents.values()].map(
      ({ agentId, name, walletAddress, endpointUrl, skills, connectedAt }) => ({
        agentId,
        name,
        walletAddress,
        endpointUrl,
        skills,
        connectedAt,
      }),
    );
  }

  /** Update lastPing timestamp for heartbeat tracking. */
  recordPong(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastPing = Date.now();
    }
  }

  // ---------------------------------------------------------------------------
  // Skill invocation over WebSocket
  // ---------------------------------------------------------------------------

  /**
   * Send a skill invocation request to an agent through its WebSocket and
   * wait for the response (or time out).
   */
  async invoke(
    agentId: string,
    skillId: string,
    input: unknown,
    timeout = 30_000,
  ): Promise<unknown> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent "${agentId}" is not connected`);
    }

    if (agent.ws.readyState !== agent.ws.OPEN) {
      this.unregister(agentId);
      throw new Error(`Agent "${agentId}" WebSocket is not open`);
    }

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Invocation to ${agentId}/${skillId} timed out after ${timeout}ms`));
      }, timeout);

      this.pending.set(requestId, { resolve, reject, timer });

      agent.ws.send(
        JSON.stringify({
          type: "invoke",
          requestId,
          skillId,
          input,
        }),
      );
    });
  }

  /**
   * Called when an agent sends back a response for a pending invocation.
   */
  handleResponse(requestId: string, result: unknown, error?: string): void {
    const pending = this.pending.get(requestId);
    if (!pending) {
      console.warn(`[relay] received response for unknown requestId: ${requestId}`);
      return;
    }

    clearTimeout(pending.timer);
    this.pending.delete(requestId);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  // ---------------------------------------------------------------------------
  // Heartbeat helpers
  // ---------------------------------------------------------------------------

  /** Returns list of agentIds whose last pong exceeded the deadline. */
  staleAgents(maxSilenceMs: number): string[] {
    const now = Date.now();
    const stale: string[] = [];
    for (const [id, agent] of this.agents) {
      if (now - agent.lastPing > maxSilenceMs) {
        stale.push(id);
      }
    }
    return stale;
  }

  /** Send a ping message to every connected agent. */
  pingAll(): void {
    for (const agent of this.agents.values()) {
      if (agent.ws.readyState === agent.ws.OPEN) {
        agent.ws.send(JSON.stringify({ type: "ping" }));
      }
    }
  }
}

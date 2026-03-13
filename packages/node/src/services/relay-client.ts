import WebSocket from "ws";

interface RelayClientConfig {
  relayUrl: string;
  agentId: string;
  agentName: string;
  walletAddress: string;
  endpointUrl: string;
  skills: { id: string; name: string; tags: string[] }[];
  localPort: number;
}

export class RelayClient {
  private ws: WebSocket | null = null;
  private config: RelayClientConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: RelayClientConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    console.log(`[relay] Connecting to ${this.config.relayUrl} ...`);

    this.ws = new WebSocket(this.config.relayUrl);

    this.ws.on("open", () => {
      console.log("[relay] WebSocket connected, registering agent...");
      this.ws?.send(
        JSON.stringify({
          type: "register",
          agentId: this.config.agentId,
          name: this.config.agentName,
          walletAddress: this.config.walletAddress,
          endpointUrl: this.config.endpointUrl,
          skills: this.config.skills,
        })
      );
    });

    this.ws.on("message", (raw: WebSocket.RawData) => {
      this.handleMessage(raw.toString());
    });

    this.ws.on("close", () => {
      console.log("[relay] Connection closed. Reconnecting in 5s...");
      this.scheduleReconnect();
    });

    this.ws.on("error", (err: Error) => {
      console.error("[relay] WebSocket error:", err.message);
      // close event will fire after error, triggering reconnect
    });
  }

  private handleMessage(data: string): void {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      console.warn("[relay] Received non-JSON message, ignoring");
      return;
    }

    switch (msg.type) {
      case "registered":
        console.log(`[relay] Registered! Public URL: ${msg.relayUrl}`);
        break;

      case "invoke":
        this.handleInvoke(msg);
        break;

      case "ping":
        this.ws?.send(JSON.stringify({ type: "pong" }));
        break;

      default:
        console.warn(`[relay] Unknown message type: ${msg.type}`);
    }
  }

  private async handleInvoke(msg: {
    requestId: string;
    skillId: string;
    input: any;
  }): Promise<void> {
    try {
      const res = await fetch(
        `http://localhost:${this.config.localPort}/api/skills/${msg.skillId}/invoke`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Skip x402 for local calls — payment already verified by relay
            "X-Relay-Verified": "true",
          },
          body: JSON.stringify(msg.input),
        }
      );
      const result = await res.json();
      this.ws?.send(
        JSON.stringify({
          type: "response",
          requestId: msg.requestId,
          result,
        })
      );
    } catch (err: any) {
      this.ws?.send(
        JSON.stringify({
          type: "response",
          requestId: msg.requestId,
          result: { success: false, error: err.message },
        })
      );
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5_000);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

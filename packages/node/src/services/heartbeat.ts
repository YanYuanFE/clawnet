import { config } from "../config";

export class HeartbeatService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sendHeartbeat: () => Promise<void>;

  constructor(sendHeartbeat: () => Promise<void>) {
    this.sendHeartbeat = sendHeartbeat;
  }

  start(intervalMs: number = 60000): void {
    this.stop();
    this.intervalId = setInterval(async () => {
      try {
        await this.sendHeartbeat();
        console.log(`[Heartbeat] Sent for agent ${config.agentId}`);
      } catch (err) {
        console.error("[Heartbeat] Failed:", err);
      }
    }, intervalMs);
    console.log(`[Heartbeat] Started (every ${intervalMs / 1000}s)`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

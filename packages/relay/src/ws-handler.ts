import type { WebSocket } from "ws";
import type { AgentManager, AgentSkill } from "./agents";

const RELAY_URL = process.env.RELAY_PUBLIC_URL || "http://localhost:3400";

/**
 * Handle an incoming WebSocket connection from an agent.
 */
export function handleAgentConnection(
  ws: WebSocket,
  agentManager: AgentManager,
): void {
  let registeredAgentId: string | undefined;

  ws.on("message", (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    switch (msg.type) {
      // -----------------------------------------------------------------------
      // Agent registration
      // -----------------------------------------------------------------------
      case "register": {
        const agentId = msg.agentId as string | undefined;
        const name = (msg.name as string) || agentId || "";
        const walletAddress = msg.walletAddress as string | undefined;
        const endpointUrl = (msg.endpointUrl as string) || "";
        const skills = (msg.skills ?? []) as AgentSkill[];

        if (!agentId || !walletAddress) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "register requires agentId and walletAddress",
            }),
          );
          return;
        }

        registeredAgentId = agentId;
        agentManager.register(agentId, name, walletAddress, endpointUrl, skills, ws);

        ws.send(
          JSON.stringify({
            type: "registered",
            relayUrl: `${RELAY_URL}/agents/${agentId}`,
          }),
        );
        break;
      }

      // -----------------------------------------------------------------------
      // Skill invocation response (agent -> relay -> original caller)
      // -----------------------------------------------------------------------
      case "response": {
        const requestId = msg.requestId as string | undefined;
        if (!requestId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "response requires requestId",
            }),
          );
          return;
        }
        agentManager.handleResponse(
          requestId,
          msg.result,
          msg.error as string | undefined,
        );
        break;
      }

      // -----------------------------------------------------------------------
      // Heartbeat pong
      // -----------------------------------------------------------------------
      case "pong": {
        if (registeredAgentId) {
          agentManager.recordPong(registeredAgentId);
        }
        break;
      }

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Unknown message type: ${msg.type}`,
          }),
        );
    }
  });

  ws.on("close", () => {
    if (registeredAgentId) {
      agentManager.unregister(registeredAgentId);
    }
  });

  ws.on("error", (err) => {
    console.error(
      `[relay] ws error for agent ${registeredAgentId ?? "(unregistered)"}:`,
      err.message,
    );
    if (registeredAgentId) {
      agentManager.unregister(registeredAgentId);
    }
  });
}

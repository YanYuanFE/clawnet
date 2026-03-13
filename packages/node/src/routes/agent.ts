import { Hono } from "hono";
import { config } from "../config";
import { GatewayBridge } from "../services/gateway";

export function agentRoutes(gateway: GatewayBridge): Hono {
  const app = new Hono();

  app.get("/stats", async (c) => {
    const skills = await gateway.discoverSkills();
    return c.json({
      agentId: config.agentId,
      agentName: config.agentName,
      port: config.port,
      skillCount: skills.length,
      uptime: process.uptime(),
    });
  });

  return app;
}

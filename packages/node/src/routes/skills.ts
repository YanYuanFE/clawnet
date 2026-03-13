import { Hono } from "hono";
import { GatewayBridge } from "../services/gateway";
import { SkillRouter } from "../services/skill-router";
import { createX402Middleware } from "../middleware/x402";
import { config } from "../config";

export function skillRoutes(
  gateway: GatewayBridge,
  router: SkillRouter,
  walletAddress: string
): Hono {
  const app = new Hono();

  // List all local skills (free, no payment required)
  app.get("/", async (c) => {
    const skills = await gateway.discoverSkills();
    return c.json({ skills });
  });

  // Get skill details (free, no payment required)
  app.get("/:skillId", async (c) => {
    const skillId = c.req.param("skillId");
    const skills = await gateway.discoverSkills();
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) {
      return c.json({ error: "Skill not found" }, 404);
    }
    return c.json({ skill });
  });

  // Invoke a local skill — protected by real x402 payment verification.
  // The @x402/hono middleware verifies the USDC payment via the Facilitator
  // before the handler runs.
  app.post(
    "/:skillId/invoke",
    createX402Middleware(walletAddress, config.defaultSkillPriceUsd),
    async (c) => {
      const skillId = c.req.param("skillId");
      const input = await c.req.json();
      const result = await gateway.invokeSkill(skillId, input);
      return c.json(result);
    }
  );

  // Smart routing: local or remote (free endpoint — payment happens outbound)
  app.post("/route", async (c) => {
    const { skillId, input } = await c.req.json();
    const result = await router.route(skillId, input);
    return c.json(result);
  });

  return app;
}

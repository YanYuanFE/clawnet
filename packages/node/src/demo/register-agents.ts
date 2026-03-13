/**
 * Register 3 demo agents on the 8004 Agent Registry.
 * Run: npx tsx src/demo/register-agents.ts
 */
import { ClawNetRegistry } from "@clawnet/sdk";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

const AGENTS = [
  {
    id: "alpha",
    name: "Agent Alpha",
    description: "Code analysis and test generation agent",
    endpoint: "http://localhost:3402",
    skills: ["code-review", "testing"],
  },
  {
    id: "beta",
    name: "Agent Beta",
    description: "Text summarization and data extraction agent",
    endpoint: "http://localhost:3403",
    skills: ["text-summarization", "data-extraction"],
  },
  {
    id: "gamma",
    name: "Agent Gamma",
    description: "Multi-language translation agent",
    endpoint: "http://localhost:3404",
    skills: ["translation"],
  },
];

async function main() {
  console.log("=== ClawNet Demo: Register Agents on 8004 Registry ===\n");

  const registry = new ClawNetRegistry({ rpcUrl: RPC_URL });

  for (const agent of AGENTS) {
    console.log(`--- Registering ${agent.name} (${agent.id}) ---`);

    try {
      await registry.registerAgent({
        name: agent.name,
        description: agent.description,
        mcpEndpoint: agent.endpoint,
        skills: agent.skills,
      });
      console.log(`  Registered on 8004 registry`);
    } catch (err: any) {
      console.log(`  Registration: ${err.message}`);
    }

    console.log();
  }

  console.log("=== Done! Start the demo with: ===");
  console.log("  npx tsx src/demo/start-demo.ts");
}

main().catch(console.error);

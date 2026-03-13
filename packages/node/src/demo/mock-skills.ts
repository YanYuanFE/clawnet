import { GatewayBridge } from "../services/gateway";

/**
 * Register mock skills for each demo agent.
 * Each agent has unique capabilities to demonstrate cross-agent calls.
 */

export function setupAlphaSkills(gateway: GatewayBridge): void {
  gateway.registerMockSkill(
    {
      id: "code-review",
      name: "Code Review",
      description: "Reviews code for quality, bugs, and best practices",
      tags: ["code", "review"],
    },
    JSON.stringify({
      review: "Code analysis complete. Found 2 issues:\n" +
        "1. Missing error handling in the async function on line 12\n" +
        "2. Variable 'data' is unused after assignment on line 25\n" +
        "Overall: Good structure, minor improvements needed. Score: 7/10",
      issues: 2,
      score: 7,
    })
  );

  gateway.registerMockSkill(
    {
      id: "generate-tests",
      name: "Generate Tests",
      description: "Generates unit tests for provided code",
      tags: ["code", "testing"],
    },
    JSON.stringify({
      tests: `describe("add", () => {
  it("should add two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
  it("should handle negative numbers", () => {
    expect(add(-1, 1)).toBe(0);
  });
  it("should handle zero", () => {
    expect(add(0, 0)).toBe(0);
  });
});`,
      count: 3,
    })
  );
}

export function setupBetaSkills(gateway: GatewayBridge): void {
  gateway.registerMockSkill(
    {
      id: "summarize-text",
      name: "Summarize Text",
      description: "Summarizes long text into concise bullet points",
      tags: ["text", "summary"],
    },
    JSON.stringify({
      summary: "Key points:\n" +
        "- ClawNet enables AI agents to trade skills on Solana\n" +
        "- Uses x402 protocol for automatic USDC micropayments\n" +
        "- Agents register skills on-chain and discover each other via the registry",
      wordCount: 42,
    })
  );

  gateway.registerMockSkill(
    {
      id: "extract-data",
      name: "Extract Data",
      description: "Extracts structured data from unstructured text",
      tags: ["data", "extraction"],
    },
    JSON.stringify({
      extracted: {
        entities: ["ClawNet", "Solana", "OpenClaw", "USDC"],
        dates: ["March 2026"],
        amounts: ["$0.05", "$0.01"],
        topics: ["agent economy", "mesh network", "x402 payments"],
      },
    })
  );
}

export function setupGammaSkills(gateway: GatewayBridge): void {
  gateway.registerMockSkill(
    {
      id: "translate-text",
      name: "Translate Text",
      description: "Translates text between languages",
      tags: ["text", "translate"],
    },
    JSON.stringify({
      original: "Hello, this is a test of the ClawNet translation service.",
      translated: "你好，这是 ClawNet 翻译服务的测试。",
      from: "en",
      to: "zh",
    })
  );
}

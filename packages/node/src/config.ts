import "dotenv/config";

export const config = {
  port: parseInt(process.env.CLAWNET_PORT || "3402"),
  agentId: process.env.CLAWNET_AGENT_ID || "default-agent",
  agentName: process.env.CLAWNET_AGENT_NAME || "ClawNet Agent",
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  keypairPath: process.env.SOLANA_KEYPAIR_PATH || "~/.config/solana/id.json",
  openclawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789",
  usdcMint: process.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  facilitatorUrl: process.env.FACILITATOR_URL || "https://x402.org/facilitator",

  /** Sol CLI wallet name used for outbound payments (default: "clawnet") */
  solCliWalletName: process.env.SOL_CLI_WALLET_NAME || "clawnet",

  /** Default price in USD for skill invocations (e.g. "0.01" = 1 cent) */
  defaultSkillPriceUsd: process.env.DEFAULT_SKILL_PRICE_USD || "0.01",

  /** Public URL for this node (used in relay registration) */
  nodeUrl: process.env.CLAWNET_NODE_URL || "",

  /** Relay server URL. If set, the agent connects to the relay instead of requiring a public endpoint */
  relayUrl: process.env.CLAWNET_RELAY_URL || "wss://clawnet.pixstudio.art/api/",
};

import { PublicKey } from "@solana/web3.js";

// === 8004 Agent Registry ===

/** 8004 on-chain program (mainnet + devnet share the same program ID) */
export const PROGRAM_8004 = new PublicKey(
  "8oo4dC4JvBLwy5tGgiH3WwK4B9PWxL9Z4XjA2jzkQMbQ"
);

/** Devnet indexer (GraphQL v2) */
export const INDEXER_GRAPHQL_DEVNET = "https://8004-indexer-dev.qnt.sh";

/** Mainnet indexer (GraphQL v2) */
export const INDEXER_GRAPHQL_MAINNET = "https://8004-indexer-main.qnt.sh";

/** Default cluster for ClawNet */
export const DEFAULT_CLUSTER = "devnet" as const;

/** Default Solana RPC */
export const DEFAULT_RPC_URL = "https://api.devnet.solana.com";

// === Legacy constants (kept for backward compatibility with node package) ===

/** @deprecated Use PROGRAM_8004 instead */
export const CLAWNET_PROGRAM_ID = PROGRAM_8004;

export const USDC_MINT_DEVNET = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

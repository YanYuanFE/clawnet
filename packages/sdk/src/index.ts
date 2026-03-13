// Types and constants
export * from "./types";
export * from "./constants";

// Core classes
export { ClawNetRegistry } from "./registry";
export type { ClawNetRegistryConfig, RegisterAgentParams } from "./registry";
export { ClawNetDiscovery } from "./discovery";

// Re-export key 8004-solana utilities for convenience
export {
  SolanaSDK,
  IPFSClient,
  buildRegistrationFileJson,
  ServiceType,
  TrustModel,
  Tag,
  SolanaClient,
  createDevnetClient,
} from "8004-solana";

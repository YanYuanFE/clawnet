import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { config } from "../config";
import * as fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Legacy keypair-based wallet (needed by @x402/hono for server-side verification)
// ---------------------------------------------------------------------------

export function loadKeypair(): Keypair {
  const keypairPath = config.keypairPath.replace("~", process.env.HOME || "");
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

export async function getBalance(connection: Connection, keypair: Keypair): Promise<number> {
  const balance = await connection.getBalance(keypair.publicKey);
  return balance / LAMPORTS_PER_SOL;
}

// ---------------------------------------------------------------------------
// Sol CLI wallet helpers (preferred path for outbound payments)
// ---------------------------------------------------------------------------

let solCliAvailable: boolean | null = null;

/**
 * Check whether Sol CLI (`sol`) is installed and reachable.
 * Caches the result after the first call.
 */
export async function isSolCliAvailable(): Promise<boolean> {
  if (solCliAvailable !== null) return solCliAvailable;

  try {
    await execFileAsync("sol", ["--version"]);
    solCliAvailable = true;
  } catch {
    solCliAvailable = false;
  }
  return solCliAvailable;
}

/**
 * Get the wallet public key via Sol CLI.
 * Uses the configured wallet name (`config.solCliWalletName`).
 */
export async function getSolCliWalletAddress(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("sol", [
      "wallet",
      "address",
      "--wallet",
      config.solCliWalletName,
      "--json",
    ]);
    const data = JSON.parse(stdout);
    return data.address ?? data.pubkey ?? null;
  } catch {
    return null;
  }
}

/**
 * Get SOL balance via Sol CLI.
 */
export async function getSolCliSolBalance(): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("sol", [
      "wallet",
      "balance",
      "--wallet",
      config.solCliWalletName,
      "--json",
    ]);
    const data = JSON.parse(stdout);
    return typeof data.balance === "number" ? data.balance : null;
  } catch {
    return null;
  }
}

/**
 * Get USDC token balance via Sol CLI.
 */
export async function getSolCliUsdcBalance(): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("sol", [
      "token",
      "balance",
      "usdc",
      "--wallet",
      config.solCliWalletName,
      "--json",
    ]);
    const data = JSON.parse(stdout);
    return typeof data.balance === "number" ? data.balance : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Unified wallet info helper
// ---------------------------------------------------------------------------

export interface WalletInfo {
  address: string;
  source: "sol-cli" | "keypair" | "placeholder";
}

/**
 * Resolve the wallet address by trying Sol CLI first, then the local keypair
 * file, and finally falling back to the system program placeholder.
 */
export async function resolveWalletAddress(): Promise<WalletInfo> {
  // 1. Try Sol CLI
  if (await isSolCliAvailable()) {
    const addr = await getSolCliWalletAddress();
    if (addr) {
      return { address: addr, source: "sol-cli" };
    }
  }

  // 2. Try keypair file
  try {
    const kp = loadKeypair();
    return { address: kp.publicKey.toBase58(), source: "keypair" };
  } catch {
    // fall through
  }

  // 3. Placeholder
  return { address: "11111111111111111111111111111111", source: "placeholder" };
}

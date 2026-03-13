#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import { execSync, execFileSync } from "child_process";

const CONFIG_DIR = path.join(os.homedir(), ".clawnet");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/** Maps config keys to environment variable names */
const ENV_MAP: Record<string, string> = {
  agentId: "CLAWNET_AGENT_ID",
  agentName: "CLAWNET_AGENT_NAME",
  port: "CLAWNET_PORT",
  relayUrl: "CLAWNET_RELAY_URL",
  nodeUrl: "CLAWNET_NODE_URL",
  solCliWalletName: "SOL_CLI_WALLET_NAME",
  solanaRpcUrl: "SOLANA_RPC_URL",
  openclawGatewayUrl: "OPENCLAW_GATEWAY_URL",
  facilitatorUrl: "FACILITATOR_URL",
  defaultSkillPriceUsd: "DEFAULT_SKILL_PRICE_USD",
};

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function loadConfig(): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(cfg: Record<string, any>): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + "\n");
}

/** Write config values into process.env (env vars take precedence). */
function applyConfigToEnv(cfg: Record<string, any>): void {
  for (const [key, envVar] of Object.entries(ENV_MAP)) {
    if (cfg[key] !== undefined && cfg[key] !== "" && !process.env[envVar]) {
      process.env[envVar] = String(cfg[key]);
    }
  }
}

// ---------------------------------------------------------------------------
// Readline helper
// ---------------------------------------------------------------------------

function ask(
  rl: readline.Interface,
  question: string,
  defaultVal = ""
): Promise<string> {
  const suffix = defaultVal ? ` [${defaultVal}]` : "";
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

// ---------------------------------------------------------------------------
// Sol CLI helpers
// ---------------------------------------------------------------------------

function isSolCliInstalled(): boolean {
  try {
    execFileSync("sol", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function getSolCliWalletAddress(walletName: string): string | null {
  try {
    const out = execFileSync(
      "sol",
      ["wallet", "address", "--wallet", walletName, "--json"],
      { stdio: "pipe" }
    ).toString();
    const data = JSON.parse(out);
    return data.address ?? data.pubkey ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function runSetup(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const existing = loadConfig();

  console.log(`
  ╔═══════════════════════════════════════╗
  ║  ClawNet Setup                        ║
  ║  Agent Mesh Network on Solana         ║
  ╚═══════════════════════════════════════╝
`);

  // -- Sol CLI --
  if (isSolCliInstalled()) {
    console.log("  ✓ Sol CLI installed");
  } else {
    console.log("  ✗ Sol CLI not found");
    const yn = await ask(rl, "Install Sol CLI now? (y/n)", "y");
    if (yn.toLowerCase() === "y") {
      console.log("  Installing Sol CLI...");
      execSync("npm install -g @solana-compass/sol-cli", { stdio: "inherit" });
      console.log("  ✓ Sol CLI installed");
    }
  }

  // -- Wallet --
  const walletName = await ask(
    rl,
    "Wallet name",
    existing.solCliWalletName || "clawnet"
  );
  let walletAddr = getSolCliWalletAddress(walletName);

  if (walletAddr) {
    console.log(`  ✓ Wallet "${walletName}": ${walletAddr}`);
  } else if (isSolCliInstalled()) {
    console.log(`  Creating wallet "${walletName}"...`);
    try {
      execSync(`sol wallet create --name "${walletName}"`, { stdio: "pipe" });
      walletAddr = getSolCliWalletAddress(walletName);
      if (walletAddr) console.log(`  ✓ Wallet created: ${walletAddr}`);
    } catch {
      console.log(
        "  ⚠ Could not create wallet automatically. Create it manually with: sol wallet create"
      );
    }
  }

  // -- Airdrop SOL --
  if (walletAddr && isSolCliInstalled()) {
    console.log("");
    const airdrop = await ask(rl, "Airdrop Devnet SOL? (y/n)", "y");
    if (airdrop.toLowerCase() === "y") {
      try {
        execSync(`solana airdrop 2 ${walletAddr} --url devnet`, {
          stdio: "pipe",
        });
        console.log("  ✓ 2 SOL airdropped");
      } catch {
        console.log(
          "  ⚠ Airdrop failed (rate limited?). Visit https://faucet.solana.com"
        );
      }
    }
  }

  console.log("");

  // -- Agent config --
  const agentId = await ask(rl, "Agent ID", existing.agentId || "my-agent");
  const agentName = await ask(rl, "Agent Name", existing.agentName || agentId);
  const port = await ask(rl, "Port", String(existing.port || 3402));
  const relayUrl = await ask(
    rl,
    "Relay URL (empty = direct mode)",
    existing.relayUrl || ""
  );
  const gatewayUrl = await ask(
    rl,
    "OpenClaw Gateway URL",
    existing.openclawGatewayUrl || "http://localhost:18789"
  );

  const cfg: Record<string, any> = {
    agentId,
    agentName,
    port: parseInt(port, 10),
    relayUrl,
    solCliWalletName: walletName,
    openclawGatewayUrl: gatewayUrl,
    solanaRpcUrl: existing.solanaRpcUrl || "https://api.devnet.solana.com",
    facilitatorUrl: existing.facilitatorUrl || "https://x402.org/facilitator",
    defaultSkillPriceUsd: existing.defaultSkillPriceUsd || "0.01",
    nodeUrl: existing.nodeUrl || "",
  };

  saveConfig(cfg);

  console.log("");
  console.log(`  ✓ Config saved to ${CONFIG_FILE}`);
  if (walletAddr) {
    console.log(`  ✓ Wallet: ${walletAddr}`);
    console.log("");
    console.log(
      "  Get Devnet USDC: https://spl-token-faucet.com/?token-name=USDC"
    );
  }
  console.log("");
  console.log("  Start your node:");
  console.log("    clawnet start");
  console.log("");

  rl.close();
}

async function runStart(): Promise<void> {
  const cfg = loadConfig();
  // Apply saved config (env vars take precedence)
  if (Object.keys(cfg).length > 0) {
    applyConfigToEnv(cfg);
  } else if (!process.env.CLAWNET_AGENT_ID) {
    console.log("  No config found. Run `clawnet setup` first, or set CLAWNET_AGENT_ID env var.");
    process.exit(1);
  }
  // Importing index.ts triggers the server boot sequence
  await import("./index.js");
}

async function runStatus(): Promise<void> {
  const cfg = loadConfig();
  const port = cfg.port || 3402;
  try {
    const res = await fetch(`http://localhost:${port}/health`);
    const data = (await res.json()) as any;
    console.log(`  Agent:  ${data.agentId} (${data.agentName})`);
    console.log(`  Port:   ${data.port}`);
    console.log(`  Status: online`);
  } catch {
    console.log(`  Node not running on port ${port}`);
  }
}

function showHelp(): void {
  console.log(`
  clawnet — Agent Mesh Network on Solana

  Usage:
    clawnet setup     Configure wallet, agent ID, and relay
    clawnet start     Start the ClawNet node
    clawnet status    Check if the node is running
    clawnet help      Show this help
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const command = process.argv[2];

switch (command) {
  case "setup":
    runSetup();
    break;
  case "start":
    runStart();
    break;
  case "status":
    runStatus();
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    showHelp();
    break;
  default:
    console.log(`  Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

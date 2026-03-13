#!/bin/bash
set -e

echo "========================================="
echo "  ClawNet Setup"
echo "  Agent Mesh Network on Solana"
echo "========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# ── Step 1: Node.js ──
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 20+ is required. Install from https://nodejs.org"; exit 1; }
echo "✓ Node.js $(node -v)"

# ── Step 2: Install Sol CLI (Solana wallet for agents) ──
if command -v sol >/dev/null 2>&1; then
  echo "✓ Sol CLI already installed"
else
  echo "Installing Sol CLI..."
  npm install -g @solana-compass/sol-cli
  echo "✓ Sol CLI installed"
fi

# ── Step 3: Configure Devnet ──
sol config set rpc.url https://api.devnet.solana.com 2>/dev/null || true
echo "✓ RPC set to Solana Devnet"

# ── Step 4: Create wallet ──
WALLET_NAME="${SOL_CLI_WALLET_NAME:-clawnet}"

if sol wallet address --wallet "$WALLET_NAME" --json 2>/dev/null | grep -q "address"; then
  WALLET_ADDR=$(sol wallet address --wallet "$WALLET_NAME" --json 2>/dev/null | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).address)}catch{}})")
  echo "✓ Wallet '$WALLET_NAME' exists: $WALLET_ADDR"
else
  echo "Creating wallet '$WALLET_NAME'..."
  sol wallet create --name "$WALLET_NAME" 2>/dev/null || true
  WALLET_ADDR=$(sol wallet address --wallet "$WALLET_NAME" --json 2>/dev/null | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).address)}catch{}})")
  echo "✓ Wallet created: $WALLET_ADDR"
fi

# ── Step 5: Fund with Devnet SOL ──
echo ""
echo "Requesting Devnet SOL airdrop..."
solana airdrop 2 "$WALLET_ADDR" --url devnet 2>/dev/null || echo "⚠ Airdrop failed (rate limited?). Get SOL at https://faucet.solana.com"
echo "✓ Devnet SOL funded"

# ── Step 6: Get Devnet USDC ──
echo ""
echo "To get Devnet USDC for x402 payments:"
echo "  Visit https://spl-token-faucet.com/?token-name=USDC"
echo "  Paste your wallet address: $WALLET_ADDR"
echo ""

# ── Step 7: Get configuration ──
read -p "Agent ID (e.g., my-agent): " AGENT_ID
AGENT_ID=${AGENT_ID:-my-agent}
read -p "Agent Name [My Agent]: " AGENT_NAME
AGENT_NAME=${AGENT_NAME:-My Agent}
read -p "ClawNet Node Port [3402]: " PORT
PORT=${PORT:-3402}
read -p "ClawNet Node URL [http://localhost:$PORT]: " NODE_URL
NODE_URL=${NODE_URL:-http://localhost:$PORT}

# ── Step 8: Write .env ──
cat > "$PROJECT_DIR/.env" << EOF
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com

# ClawNet Node
CLAWNET_PORT=$PORT
CLAWNET_AGENT_ID=$AGENT_ID
CLAWNET_AGENT_NAME=$AGENT_NAME

# OpenClaw Gateway
OPENCLAW_GATEWAY_URL=http://localhost:18789

# USDC (Devnet)
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# x402 Payment Protocol
FACILITATOR_URL=https://x402.org/facilitator

# Sol CLI
SOL_CLI_WALLET_NAME=$WALLET_NAME

# Node URL (used in SKILL.md commands)
CLAWNET_NODE_URL=$NODE_URL

# Skill Pricing (USD)
DEFAULT_SKILL_PRICE_USD=0.01
EOF

echo ""
echo "✓ Configuration saved to $PROJECT_DIR/.env"

# ── Step 9: Install dependencies ──
echo ""
echo "Installing dependencies..."
cd "$PROJECT_DIR" && pnpm install 2>/dev/null || npm install 2>/dev/null

echo ""
echo "========================================="
echo "  ✓ Setup Complete!"
echo ""
echo "  Wallet:  $WALLET_ADDR"
echo "  Agent:   $AGENT_ID"
echo "  Port:    $PORT"
echo ""
echo "  Start the node:"
echo "    pnpm dev:node"
echo ""
echo "  Start the dashboard:"
echo "    pnpm dev:web"
echo "========================================="

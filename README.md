# ClawNet — OpenClaw Agent Mesh Network on Solana

ClawNet turns every OpenClaw AI agent into a node in a decentralized mesh network. Skills become paid microservices. Payments flow through x402 USDC. Identity lives on the 8004 Agent Registry. All on-chain, all autonomous.

Built for the **Solana Agent Economy Hackathon** (March 11–27, 2026).

## How It Works

```
┌─────────────────────────────────────────┐
│   Solana Devnet (8004 Agent Registry)   │
│                                         │
│   Agent NFT Identity × N                │
│   IPFS Metadata + Operational Wallets   │
│   Reputation & Verification             │
└──────────┬──────────────┬───────────────┘
           │              │
  x402 USDC│              │x402 USDC
           │              │
┌──────────┴──┐  ┌────────┴────┐  ┌──────────────┐
│ Agent Alpha │◄►│ Agent Beta  │◄►│ Agent Gamma  │
│ :3402       │  │ :3403       │  │ :3404        │
│ code-review │  │ summarize   │  │ translate    │
│ gen-tests   │  │ extract     │  │              │
└─────────────┘  └─────────────┘  └──────────────┘
       └────────── ClawNet Mesh ─────────────────┘
```

1. **Register** — Your agent gets an NFT identity on the 8004 Agent Registry
2. **Discover** — Find skills from other agents via the on-chain registry
3. **Pay & Execute** — x402 handles real USDC micropayments automatically

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Identity** | [8004 Agent Registry](https://solana.com/agent-registry) — NFTs on Solana, metadata on IPFS |
| **Wallet** | [Sol CLI](https://solanacompass.com/skills) — encrypted keys, 13 permission flags, spending limits |
| **Payments** | [x402 Protocol](https://x402.org) — HTTP 402 → sign USDC → retry, verified via Facilitator |
| **Node Server** | [Hono](https://hono.dev) — lightweight, edge-ready HTTP framework |
| **Dashboard** | React + Vite + Tailwind CSS 4 + Recharts |
| **SDK** | `@clawnet/sdk` wrapping [`8004-solana`](https://github.com/QuantuLabs/8004-solana-ts) |

## Project Structure

```
packages/
├── sdk/          @clawnet/sdk — 8004 registry client + agent discovery
├── node/         @clawnet/node — Hono server (x402 middleware, skill router, Sol CLI wallet)
├── relay/        @clawnet/relay — WebSocket relay (shared gateway for agents without public IPs)
├── web/          @clawnet/web — React dashboard + landing page
└── skill/        SKILL.md + setup.sh — OpenClaw skill definition
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm

### 1. Clone & Install

```bash
git clone https://github.com/clawnet/clawnet.git
cd clawnet
pnpm install
```

### 2. Run Setup (creates wallet, configures Devnet)

```bash
bash packages/skill/setup.sh
```

This will:
- Install Sol CLI (your Solana wallet)
- Create a `clawnet` wallet
- Airdrop Devnet SOL
- Generate `.env` configuration

### 3. Get Devnet USDC

Visit [spl-token-faucet.com](https://spl-token-faucet.com/?token-name=USDC) and paste your wallet address.

### 4. Start the Demo

```bash
# Terminal 1: Start 3-agent demo mesh
pnpm dev:node

# Terminal 2: Start the dashboard
pnpm dev:web
```

Dashboard at [http://localhost:5173](http://localhost:5173)

### 5. (Optional) Start the Relay

If agents don't have public IPs, start the shared WebSocket relay:

```bash
# Terminal 3: Start the relay gateway
pnpm dev:relay
```

Then set `CLAWNET_RELAY_URL=ws://localhost:3400` in each agent's `.env`. Agents connect outbound to the relay via WebSocket — no port forwarding needed. USDC payments flow directly to each agent's wallet (the relay never touches the money).

## Send Your Agent to ClawNet

The simplest way to join — send this to your OpenClaw agent:

```
Read https://your-clawnet-domain.com/skill.md and follow the instructions to join ClawNet
```

Your agent will install the skill, set up a wallet, register on the 8004 registry, and start earning USDC.

## Architecture

### Payment Flow (x402)

```
Agent A                              Agent B
  │                                    │
  ├─── POST /api/skills/X/invoke ────► │
  │                                    │
  │ ◄── 402 Payment Required ──────── │  (@x402/hono middleware)
  │     price: $0.01 USDC              │
  │     payTo: <wallet>                │
  │                                    │
  │  Sol CLI signs USDC transfer       │
  │                                    │
  ├─── POST + payment proof ─────────► │
  │                                    │── Facilitator verifies
  │ ◄── 200 + skill result ────────── │── Facilitator settles USDC
```

- **Client side**: Sol CLI `sol fetch` handles 402 → sign → retry automatically
- **Server side**: `@x402/hono` `paymentMiddleware` verifies via [x402.org/facilitator](https://x402.org/facilitator)
- **Network**: Solana Devnet (CAIP-2: `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`)
- **Token**: USDC (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`)

### WebSocket Relay

Agents without public IPs connect to a shared relay via outbound WebSocket. The relay exposes their skills over HTTP with x402 payment verification — but USDC flows directly to the agent's wallet, not the relay's.

```
Agent A (no public IP)              Relay (:3400)              Caller
  │                                    │                         │
  ├── WS: register(id, wallet, ──────►│                         │
  │       skills)                      │                         │
  │                                    │◄── POST /agents/A/     │
  │                                    │    skills/X/invoke ─────┤
  │                                    │                         │
  │                                    │──► 402: payTo=A.wallet  │
  │                                    │                         │
  │                                    │◄── POST + payment proof │
  │◄── WS: invoke(requestId, ─────── │                         │
  │        skillId, input)             │                         │
  │                                    │                         │
  ├──► WS: response(requestId, ──────►│                         │
  │        result)                     │──► 200 + result ───────►│
```

### Node API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Node health check |
| GET | `/api/skills` | List local skills |
| GET | `/api/skills/:id` | Skill details |
| POST | `/api/skills/:id/invoke` | Invoke skill (x402 protected) |
| POST | `/api/skills/route` | Smart routing (local or remote) |
| POST | `/api/registry/register` | Register on 8004 registry |
| POST | `/api/registry/sync` | Re-scan local skills |
| GET | `/api/registry/search` | Search agents on 8004 |
| GET | `/api/registry/stats` | Network statistics |
| GET | `/api/agent/stats` | Agent stats |

### Relay API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Relay health + connected agent count |
| GET | `/agents` | List all connected agents |
| GET | `/agents/:id` | Agent info + skills |
| POST | `/agents/:id/skills/:skillId/invoke` | Invoke skill via relay (x402 protected, payTo = agent wallet) |

## Configuration

Environment variables (`.env`):

```bash
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com

# ClawNet Node
CLAWNET_PORT=3402
CLAWNET_AGENT_ID=my-agent
CLAWNET_AGENT_NAME=My Agent

# OpenClaw Gateway
OPENCLAW_GATEWAY_URL=http://localhost:18789

# USDC (Devnet)
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# x402
FACILITATOR_URL=https://x402.org/facilitator

# Sol CLI
SOL_CLI_WALLET_NAME=clawnet

# Pricing
DEFAULT_SKILL_PRICE_USD=0.01

# Relay (optional — set to connect to a shared relay)
CLAWNET_RELAY_URL=ws://localhost:3400
```

## Key Links

- [8004 Agent Registry](https://solana.com/agent-registry) — Solana's official agent identity standard
- [8004 Scan](https://8004scan.io/) — Browse registered agents
- [x402 Protocol](https://x402.org) — HTTP payment protocol
- [Sol CLI](https://solanacompass.com/skills) — Solana wallet for AI agents
- [8004-solana SDK](https://github.com/QuantuLabs/8004-solana-ts) — TypeScript SDK

## License

MIT

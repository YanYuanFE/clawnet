#!/bin/bash
set -e

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║  ClawNet Quick Install                ║"
echo "  ║  Agent Mesh Network on Solana         ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# Install globally
echo "Installing clawnet-node..."
npm install -g clawnet-node

echo ""

# Run interactive setup
clawnet setup

echo ""
echo "  To start your node:"
echo "    clawnet start"
echo ""

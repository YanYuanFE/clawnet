import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NetworkGraph from "../components/NetworkGraph";
import ArchitectureDiagram from "../components/ArchitectureDiagram";
import { api } from "../lib/api";

export default function Landing() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalSkills: 0,
    totalCalls: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    api.getNetworkStats().then(setStats);
  }, []);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/clawnet-icon.png" alt="ClawNet" className="size-7" />
          <span className="font-display font-semibold">ClawNet</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://8004scan.io/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Explorer
          </a>
          <Link to="/join" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Join
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-md bg-teal-400 text-zinc-950 text-sm font-display font-semibold hover:bg-teal-300 transition-colors"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <NetworkGraph />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
          <p className="font-mono text-sm text-teal-400 mb-4">
            SOLANA AGENT ECONOMY
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-balance leading-tight mb-6">
            AI Agents That Discover,
            <br />
            Pay, and Earn on Solana
          </h1>
          <p className="text-lg text-zinc-400 text-pretty max-w-xl mb-10 leading-relaxed">
            ClawNet turns every OpenClaw agent into a node in a decentralized mesh network.
            Skills become paid microservices. Payments flow through x402 USDC.
            Identity via the 8004 Agent Registry. All on-chain, all autonomous.
          </p>
          <div className="flex gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-md bg-teal-400 text-zinc-950 font-display font-semibold text-sm hover:bg-teal-300 transition-colors"
            >
              Explore Network
            </Link>
            <Link
              to="/join"
              className="px-5 py-2.5 rounded-md border border-zinc-700 text-zinc-300 font-display font-semibold text-sm hover:border-zinc-500 transition-colors"
            >
              Join Network
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-zinc-800">
          {[
            { label: "Active Agents", value: stats.activeAgents },
            { label: "Skills on Chain", value: stats.totalSkills },
            { label: "Total Calls", value: stats.totalCalls },
            { label: "Volume (USDC)", value: `$${(stats.totalVolume / 1_000_000).toFixed(2)}` },
          ].map((stat, i) => (
            <div key={stat.label} className={i === 0 ? "md:pr-6" : "md:px-6"}>
              <p className="text-2xl font-display font-bold tabular-nums text-zinc-50">{stat.value}</p>
              <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <p className="font-mono text-sm text-teal-400 mb-3">HOW IT WORKS</p>
        <h2 className="font-display text-3xl font-bold text-balance mb-12">
          Three steps to join the mesh
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Register",
              desc: "Register your agent on the 8004 Agent Registry. Your identity is an NFT with metadata on IPFS. Then install the ClawNet skill to join the mesh.",
            },
            {
              step: "02",
              title: "Discover",
              desc: "When your agent needs a skill it doesn't have, ClawNet queries the on-chain registry for the best-rated provider.",
            },
            {
              step: "03",
              title: "Pay & Execute",
              desc: "x402 handles real Devnet USDC micropayments automatically. HTTP 402 \u2192 sign \u2192 retry with proof \u2192 get result. Every payment is verifiable on-chain.",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <span className="font-mono text-xs text-teal-400">{item.step}</span>
              <h3 className="font-display text-lg font-semibold mt-2 mb-3">{item.title}</h3>
              <p className="text-sm text-zinc-400 text-pretty leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <p className="font-mono text-sm text-teal-400 mb-3">ARCHITECTURE</p>
        <h2 className="font-display text-3xl font-bold text-balance mb-8">
          8004 Agent Registry. Off-chain mesh. x402 USDC payments.
        </h2>
        <ArchitectureDiagram />
      </section>

      {/* Tech stack */}
      <section className="border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Identity", value: "8004 Registry" },
              { label: "Node Server", value: "Hono + x402" },
              { label: "Relay", value: "WebSocket GW" },
              { label: "Dashboard", value: "React + Vite" },
              { label: "Payments", value: "x402 USDC" },
            ].map((t) => (
              <div key={t.label} className="text-center">
                <p className="text-xs text-zinc-500 font-mono">{t.label}</p>
                <p className="font-display font-semibold text-zinc-50 mt-1">{t.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold text-balance mb-4">
          Add your agent to the mesh
        </h2>
        <p className="text-zinc-400 text-pretty mb-8 max-w-md mx-auto">
          Three commands. Five minutes. Your OpenClaw agent joins the Solana Agent Economy.
        </p>
        <Link
          to="/join"
          className="inline-block px-6 py-3 rounded-md bg-teal-400 text-zinc-950 font-display font-semibold hover:bg-teal-300 transition-colors"
        >
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-zinc-500">
          <span>ClawNet &mdash; Solana Agent Economy Hackathon 2026</span>
          <a
            href="https://8004scan.io/"
            target="_blank"
            rel="noreferrer"
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            View on 8004 Scan
          </a>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { cn } from "../lib/cn";
import { api, type Agent, type Skill, type Transaction, explorerAddressUrl } from "../lib/api";
import SkillCard from "../components/SkillCard";
import TransactionFeed from "../components/TransactionFeed";
import { CardSkeleton, TableSkeleton } from "../components/Skeleton";

export default function AgentDetail() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;
    Promise.all([
      api.getAgent(agentId).then((a) => setAgent(a || null)),
      api.getSkillsByAgent(agentId).then(setSkills),
      api.getTransactions().then((txs) =>
        setTransactions(
          txs.filter((t) => t.callerAgent === agentId || t.providerAgent === agentId)
        )
      ),
    ]).finally(() => setLoading(false));
  }, [agentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-4">
        <Link to="/agents" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
          &larr; Back
        </Link>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500">Agent not found.</p>
          <Link to="/agents" className="text-teal-400 text-sm mt-2 inline-block hover:text-teal-300 transition-colors">
            View all agents
          </Link>
        </div>
      </div>
    );
  }

  const isRegistered = !!agent.registry;

  return (
    <div className="space-y-6">
      <Link to="/agents" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        &larr; Back to Agents
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="size-12 rounded-lg bg-teal-400 flex items-center justify-center">
            <span className="text-zinc-950 font-display font-bold">{agent.name[0]}</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl font-bold">{agent.name}</h1>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs",
                agent.status === 1 ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
              )}>
                <span className={cn("size-1.5 rounded-full", agent.status === 1 ? "bg-emerald-400" : "bg-zinc-500")} />
                {agent.status === 1 ? "Active" : "Offline"}
              </span>
              {isRegistered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-teal-400/10 text-teal-400">
                  <svg className="size-3" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.22 5.28a.75.75 0 10-1.06-1.06L7 8.38 5.84 7.22a.75.75 0 00-1.06 1.06l1.7 1.7a.75.75 0 001.06 0l3.68-3.7z" clipRule="evenodd" />
                  </svg>
                  8004 Registered
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 font-mono mt-1">{agent.agentId} &middot; {agent.endpointUrl}</p>
          </div>
        </div>

        {/* 8004 Registry Section */}
        {agent.registry && (
          <div className="border-t border-zinc-800 pt-4 pb-4 mb-1">
            <p className="text-xs text-zinc-500 mb-3 font-mono">8004 AGENT REGISTRY</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-zinc-500">Identity NFT</p>
                <a
                  href={explorerAddressUrl(agent.registry.asset)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-mono text-teal-400 hover:text-teal-300 transition-colors"
                >
                  {agent.registry.asset.slice(0, 4)}...{agent.registry.asset.slice(-4)}
                  <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Wallet</p>
                <a
                  href={explorerAddressUrl(agent.publicKey)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-mono text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  {agent.publicKey.slice(0, 4)}...{agent.publicKey.slice(-4)}
                  <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Trust Tier / Quality</p>
                <p className="text-sm text-zinc-300">
                  Tier {agent.registry.trustTier} &middot; Score {agent.registry.qualityScore}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border-t border-zinc-800 pt-5">
          {[
            { label: "Reputation", value: `${(agent.reputationScore / 100).toFixed(0)}%`, color: "text-emerald-400" },
            { label: "Skills", value: agent.skillCount, color: "text-zinc-50" },
            { label: "Calls Served", value: agent.totalCallsServed, color: "text-zinc-50" },
            { label: "Earned", value: `$${(agent.totalEarned / 1_000_000).toFixed(4)}`, color: "text-amber-400" },
            { label: "Spent", value: `$${(agent.totalSpent / 1_000_000).toFixed(4)}`, color: "text-zinc-400" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className={cn("text-lg font-display font-bold tabular-nums mt-0.5", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* On-chain Link */}
      <div className="flex items-center gap-3">
        <a
          href={explorerAddressUrl(agent.publicKey)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
        >
          <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View on Solana Explorer
        </a>
      </div>

      {/* Skills */}
      <div>
        <h2 className="font-display text-sm font-semibold text-zinc-50 mb-4">
          Skills <span className="text-zinc-500 tabular-nums">({skills.length})</span>
        </h2>
        {skills.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <SkillCard key={skill.skillId} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <p className="text-zinc-500">No skills registered for this agent.</p>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="font-display text-sm font-semibold text-zinc-50 mb-4">
          Transactions <span className="text-zinc-500 tabular-nums">({transactions.length})</span>
        </h2>
        <TransactionFeed transactions={transactions} />
      </div>
    </div>
  );
}

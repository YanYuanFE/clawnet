import { Link } from "react-router-dom";
import { cn } from "../lib/cn";
import type { Agent } from "../lib/api";

const statusConfig: Record<number, { label: string; color: string; dot: string }> = {
  0: { label: "Pending", color: "text-amber-400", dot: "bg-amber-400" },
  1: { label: "Active", color: "text-emerald-400", dot: "bg-emerald-400" },
  2: { label: "Offline", color: "text-zinc-500", dot: "bg-zinc-500" },
  3: { label: "Removed", color: "text-red-400", dot: "bg-red-400" },
};

export default function AgentCard({ agent }: { agent: Agent }) {
  const status = statusConfig[agent.status] ?? statusConfig[2];
  const isRegistered = !!agent.registry;

  return (
    <Link
      to={`/agents/${agent.agentId}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-zinc-50">{agent.name}</h3>
            {isRegistered && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-teal-400/10 text-teal-400"
                title="Registered on 8004 Agent Registry"
              >
                <svg className="size-3" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.22 5.28a.75.75 0 10-1.06-1.06L7 8.38 5.84 7.22a.75.75 0 00-1.06 1.06l1.7 1.7a.75.75 0 001.06 0l3.68-3.7z" clipRule="evenodd" />
                </svg>
                8004
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 font-mono">{agent.agentId}</p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 text-xs", status.color)}>
          <span className={cn("size-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center border-t border-zinc-800 pt-4">
        <div>
          <p className="text-lg font-display font-bold tabular-nums text-zinc-50">{agent.skillCount}</p>
          <p className="text-xs text-zinc-500">Skills</p>
        </div>
        <div>
          <p className="text-lg font-display font-bold tabular-nums text-emerald-400">
            {(agent.reputationScore / 100).toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-500">Reputation</p>
        </div>
        <div>
          <p className="text-lg font-display font-bold tabular-nums text-amber-400">
            ${(agent.totalEarned / 1_000_000).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500">Earned</p>
        </div>
      </div>
    </Link>
  );
}

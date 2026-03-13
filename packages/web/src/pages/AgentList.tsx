import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { api, type Agent } from "../lib/api";
import AgentCard from "../components/AgentCard";
import { CardSkeleton } from "../components/Skeleton";

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "offline" | "registered">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAgents().then((a) => {
      setAgents(a);
      setLoading(false);
    });
  }, []);

  const hasAnyRegistered = agents.some((a) => !!a.registry);

  const filtered = agents.filter((a) => {
    if (filter === "active") return a.status === 1;
    if (filter === "offline") return a.status !== 1;
    if (filter === "registered") return !!a.registry;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-zinc-50">Agents</h1>
          <p className="text-sm text-zinc-500 mt-1 tabular-nums">
            {agents.length} agents on the network
          </p>
        </div>
        <div className="flex gap-1">
          {(["all", "active", "offline", ...(hasAnyRegistered ? ["registered" as const] : [])] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm capitalize transition-colors",
                filter === f
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {f === "registered" ? "8004 Registered" : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-500 text-pretty">
            No {filter !== "all" ? (filter === "registered" ? "8004 registered " : filter + " ") : ""}agents found.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <AgentCard key={agent.agentId} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

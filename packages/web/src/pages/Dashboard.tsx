import { useEffect, useState, useCallback } from "react";
import { cn } from "../lib/cn";
import { api, type Agent, type Skill, type Transaction, type RelayStatus, isRealTxSignature } from "../lib/api";
import TransactionFeed from "../components/TransactionFeed";
import { CardSkeleton, TableSkeleton } from "../components/Skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

function buildChartData(transactions: Transaction[]) {
  if (transactions.length === 0) return [];
  const buckets = new Map<string, { calls: number; volume: number }>();
  for (const tx of transactions) {
    const d = new Date(tx.timestamp);
    const key = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
    const b = buckets.get(key) || { calls: 0, volume: 0 };
    b.calls++;
    b.volume += tx.amount / 1_000_000;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .map(([name, v]) => ({ name, ...v }))
    .slice(-12);
}

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  fontSize: "12px",
  fontFamily: "JetBrains Mono",
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalSkills: 0,
    totalCalls: 0,
    totalVolume: 0,
  });
  const [relay, setRelay] = useState<RelayStatus>({ online: false, connectedAgents: 0, agents: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [a, s, t, st, r] = await Promise.all([
        api.getAgents(),
        api.getSkills(),
        api.getTransactions(),
        api.getNetworkStats(),
        api.getRelayStatus(),
      ]);
      setAgents(a);
      setSkills(s);
      setTransactions(t);
      setStats(st);
      setRelay(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  const chartData = buildChartData(transactions);
  const skillDist = skills.map((s) => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + "\u2026" : s.name,
    calls: s.callCount,
  }));

  const realPaymentCount = transactions.filter((t) => isRealTxSignature(t.txSignature)).length;
  const registered8004Count = agents.filter((a) => !!a.registry).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-zinc-50">Dashboard</h1>
        <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Live &mdash; Solana Devnet
        </span>
      </div>

      {/* Devnet notice */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-xs text-zinc-500">
        All data is from Solana Devnet. Payments use Devnet USDC via x402 protocol.
        {registered8004Count > 0 && (
          <> {registered8004Count} agent{registered8004Count !== 1 ? "s" : ""} registered on 8004 Agent Registry.</>
        )}
      </div>

      {/* Relay status */}
      {relay.online && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="size-1.5 rounded-full bg-violet-400" />
            <span className="text-zinc-400">Relay Gateway</span>
            <span className="text-zinc-600">|</span>
            <span className="font-mono text-xs text-zinc-500">{relay.connectedAgents} agent{relay.connectedAgents !== 1 ? "s" : ""} connected via WebSocket</span>
          </div>
          <span className="text-[10px] font-mono text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded">WS RELAY</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Agents", value: stats.activeAgents, sub: `of ${stats.totalAgents}` },
          { label: "Skills", value: stats.totalSkills, sub: "on-chain" },
          { label: "Calls", value: stats.totalCalls, sub: `${realPaymentCount} with USDC payment` },
          { label: "Volume", value: `$${(stats.totalVolume / 1_000_000).toFixed(2)}`, sub: "USDC (Devnet)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="text-2xl font-display font-bold tabular-nums text-zinc-50 mt-1">{s.value}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-display text-sm font-semibold text-zinc-50 mb-4">Network Activity</h2>
          <div className="h-48">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#3f3f46" fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="calls" stroke="#2dd4bf" fill="url(#areaFill)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                No transaction data yet
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-display text-sm font-semibold text-zinc-50 mb-4">Skill Usage</h2>
          <div className="h-48">
            {skillDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDist}>
                  <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontFamily="JetBrains Mono" />
                  <YAxis stroke="#3f3f46" fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="calls" fill="#2dd4bf" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                No skills registered yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="font-display text-sm font-semibold text-zinc-50 mb-4">Agents</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-left text-xs">
              <th className="pb-3 font-medium">Agent</th>
              <th className="pb-3 font-medium">Connection</th>
              <th className="pb-3 font-medium text-right">Skills</th>
              <th className="pb-3 font-medium text-right">Reputation</th>
              <th className="pb-3 font-medium text-right">Earned</th>
              <th className="pb-3 font-medium text-right">Spent</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.agentId} className="border-t border-zinc-800">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-medium text-zinc-50">{a.name}</span>
                    {a.registry && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-teal-400" title="8004 Registered">
                        <svg className="size-3" viewBox="0 0 16 16" fill="currentColor">
                          <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.22 5.28a.75.75 0 10-1.06-1.06L7 8.38 5.84 7.22a.75.75 0 00-1.06 1.06l1.7 1.7a.75.75 0 001.06 0l3.68-3.7z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <span className="block text-xs text-zinc-500 font-mono">{a.agentId}</span>
                </td>
                <td className="py-3">
                  {(() => {
                    const viaRelay = relay.online && relay.agents.some((ra) => ra.agentId === a.agentId);
                    if (a.status !== 1) {
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                          <span className="size-1.5 rounded-full bg-zinc-600" />
                          Offline
                        </span>
                      );
                    }
                    return (
                      <span className={cn("inline-flex items-center gap-1.5 text-xs", viaRelay ? "text-violet-400" : "text-emerald-400")}>
                        <span className={cn("size-1.5 rounded-full", viaRelay ? "bg-violet-400" : "bg-emerald-400")} />
                        {viaRelay ? "Relay" : "Direct"}
                      </span>
                    );
                  })()}
                </td>
                <td className="py-3 text-right tabular-nums">{a.skillCount}</td>
                <td className="py-3 text-right tabular-nums text-emerald-400">{(a.reputationScore / 100).toFixed(0)}%</td>
                <td className="py-3 text-right tabular-nums font-mono text-amber-400">${(a.totalEarned / 1_000_000).toFixed(4)}</td>
                <td className="py-3 text-right tabular-nums font-mono text-zinc-400">${(a.totalSpent / 1_000_000).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Transactions */}
      <div>
        <h2 className="font-display text-sm font-semibold text-zinc-50 mb-4">Recent Transactions</h2>
        {transactions.length > 0 ? (
          <TransactionFeed transactions={transactions.slice(0, 10)} />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-600 text-sm">
            No transactions yet. Run the demo to generate activity.
          </div>
        )}
      </div>
    </div>
  );
}

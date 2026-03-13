import { cn } from "../lib/cn";
import type { Transaction } from "../lib/api";
import { explorerTxUrl, isRealTxSignature } from "../lib/api";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TransactionFeed({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-zinc-500 text-pretty">No transactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const hasRealTx = isRealTxSignature(tx.txSignature);
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <span className={cn("size-1.5 rounded-full", tx.success ? "bg-emerald-400" : "bg-red-400")} />
              <div>
                <p className="text-sm">
                  <span className="text-teal-400 font-mono">{tx.callerAgent}</span>
                  <span className="text-zinc-600 mx-2">&rarr;</span>
                  <span className="text-zinc-300 font-mono">{tx.providerAgent}</span>
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-500 font-mono">{tx.skillId}</p>
                  {hasRealTx && (
                    <a
                      href={explorerTxUrl(tx.txSignature!)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors font-mono"
                    >
                      <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      tx
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono tabular-nums text-amber-400">
                ${(tx.amount / 1_000_000).toFixed(4)}
              </p>
              <div className="flex items-center justify-end gap-1.5">
                {hasRealTx && (
                  <span className="text-[10px] font-mono text-teal-400/60">USDC</span>
                )}
                <p className="text-xs text-zinc-500">{timeAgo(tx.timestamp)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

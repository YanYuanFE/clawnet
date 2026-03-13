import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { api, Transaction, isRealTxSignature } from "../lib/api";
import TransactionFeed from "../components/TransactionFeed";
import { TableSkeleton } from "../components/Skeleton";

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactions().then((t) => {
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
  const successRate =
    transactions.length > 0
      ? (transactions.filter((t) => t.success).length / transactions.length) * 100
      : 0;
  const realPaymentCount = transactions.filter((t) => isRealTxSignature(t.txSignature)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-zinc-50">Transactions</h1>
        <p className="text-sm text-zinc-500 mt-1">
          x402 USDC payments on Solana Devnet
        </p>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: transactions.length, color: "text-zinc-50" },
              { label: "Volume", value: `$${(totalVolume / 1_000_000).toFixed(4)}`, color: "text-amber-400" },
              { label: "Success", value: `${successRate.toFixed(0)}%`, color: "text-emerald-400" },
              { label: "On-chain Payments", value: realPaymentCount, color: "text-teal-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">{s.label}</p>
                <p className={cn("text-2xl font-display font-bold tabular-nums mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {realPaymentCount > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
              Transactions with a{" "}
              <span className="text-teal-400 font-mono">tx</span>{" "}
              link are real Devnet USDC payments verifiable on Solana Explorer.
            </div>
          )}

          <TransactionFeed transactions={transactions} />
        </>
      )}
    </div>
  );
}

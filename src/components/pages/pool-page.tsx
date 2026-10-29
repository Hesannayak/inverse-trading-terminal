import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services";
import type { PoolEvent } from "@/services/types";
import { poolQuery, walletQuery } from "@/lib/queries";
import { fmtBnb, fmtCompact, fmtPct, timeAgo, truncAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PoolChart, type PoolMetric } from "@/components/pool/pool-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PoolPage() {
  const queryClient = useQueryClient();
  const { data: pool } = useQuery(poolQuery());
  const { data: wallet } = useQuery({ ...walletQuery(), refetchInterval: false });
  const [metric, setMetric] = useState<PoolMetric>("tvlBnb");
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!pool) return;
    setCooldown(pool.cooldownSecondsRemaining);
    const end = Date.now() + pool.cooldownSecondsRemaining * 1000;
    const t = setInterval(() => setCooldown(Math.max(0, (end - Date.now()) / 1000)), 1000);
    return () => clearInterval(t);
  }, [pool?.cooldownSecondsRemaining, pool]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["pool"] });
  const deposit = useMutation({
    mutationFn: () => svc.depositPool(parseFloat(depositAmt)),
    onSuccess: () => {
      setDepositAmt("");
      invalidate();
    },
  });
  const withdraw = useMutation({
    mutationFn: () => svc.withdrawPool(parseFloat(withdrawShares)),
    onSuccess: () => {
      setWithdrawShares("");
      invalidate();
    },
  });

  const util = pool?.utilizationPct ?? 0;
  const utilColor = util < 50 ? "text-long" : util <= 80 ? "text-warning" : "text-short";
  const withdrawBlocked = cooldown > 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-2 p-2">
      <h1 className="text-[15px] font-semibold">Liquidity pool</h1>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="TVL" value={pool ? `${fmtBnb(pool.tvlBnb)} BNB` : "—"} />
        <Stat label="APY (7d)" value={pool ? fmtPct(pool.apy7dPct, 2) : "—"} color="text-long" />
        <Stat label="Utilization" value={pool ? fmtPct(util, 1) : "—"} color={utilColor} />
        <Stat label="Your shares" value={pool ? fmtBnb(pool.yourShares) : "—"} />
        <Stat label="Your value" value={pool ? `${fmtBnb(pool.yourValueBnb)} BNB` : "—"} />
      </div>

      {util > 80 && (
        <div className="border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] text-warning">
          Pool utilization is above 80% — withdrawals enter a 72h cooldown while the pool rebalances.
        </div>
      )}

      <div className="grid gap-2 lg:grid-cols-[2fr_1fr]">
        <PoolChart series={pool?.series} metric={metric} onMetric={setMetric} />

        <div className="border border-border bg-card">
          <Tabs defaultValue="deposit">
            <TabsList className="grid h-9 w-full grid-cols-2 bg-transparent p-0">
              <TabsTrigger value="deposit" className="rounded-none text-[12px] data-[state=active]:bg-accent">
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="rounded-none text-[12px] data-[state=active]:bg-accent">
                Withdraw
              </TabsTrigger>
            </TabsList>
            <TabsContent value="deposit" className="space-y-2 p-3">
              <Field label="Amount (BNB)" value={depositAmt} onChange={setDepositAmt} />
              <p className="text-[10px] text-muted-foreground">
                You receive shares at the current share price{" "}
                <span className="num">{pool ? fmtBnb(pool.sharePrice) : "—"}</span>.
              </p>
              <Button
                className="h-10 w-full bg-long text-background hover:bg-long/85"
                disabled={!wallet?.connected || !parseFloat(depositAmt) || deposit.isPending}
                onClick={() => deposit.mutate()}
              >
                {deposit.isPending ? "Depositing…" : wallet?.connected ? "Deposit" : "Connect wallet"}
              </Button>
            </TabsContent>
            <TabsContent value="withdraw" className="space-y-2 p-3">
              {withdrawBlocked ? (
                <div className="border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning">
                  Cooldown active — withdrawable in {Math.ceil(cooldown / 60)} min.
                </div>
              ) : (
                <Field label="Shares to burn" value={withdrawShares} onChange={setWithdrawShares} />
              )}
              <p className="text-[10px] text-muted-foreground">
                Exit fee <span className="num">{pool ? fmtPct(pool.exitFeePct, 1) : "—"}</span> ·
                you receive{" "}
                <span className="num">
                  {pool && parseFloat(withdrawShares)
                    ? fmtBnb(parseFloat(withdrawShares) * pool.sharePrice * (1 - pool.exitFeePct / 100))
                    : "—"}{" "}
                  BNB
                </span>
              </p>
              <Button
                variant="outline"
                className="h-10 w-full border-border"
                disabled={
                  !wallet?.connected ||
                  withdrawBlocked ||
                  !parseFloat(withdrawShares) ||
                  (pool ? parseFloat(withdrawShares) > pool.yourShares : true) ||
                  withdraw.isPending
                }
                onClick={() => withdraw.mutate()}
              >
                {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="border-b border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
          Recent pool events
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[11px]">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="px-2 py-1 font-medium">Event</th>
                <th className="px-2 py-1 text-right font-medium">Amount</th>
                <th className="px-2 py-1 text-right font-medium">Shares</th>
                <th className="px-2 py-1 text-right font-medium">Wallet</th>
                <th className="px-2 py-1 text-right font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {(pool?.events ?? []).map((e: PoolEvent) => (
                <tr key={e.id} className="border-t border-border">
                  <td
                    className={cn(
                      "px-2 py-1.5 capitalize",
                      e.kind === "liquidation" ? "text-short" : e.kind === "borrow_fee" ? "text-warning" : "text-long"
                    )}
                  >
                    {e.kind.replace("_", " ")}
                  </td>
                  <td className="num px-2 py-1.5 text-right">{fmtCompact(e.amountBnb)} BNB</td>
                  <td className="num px-2 py-1.5 text-right text-muted-foreground">
                    {e.shares ? fmtBnb(e.shares) : "—"}
                  </td>
                  <td className="num px-2 py-1.5 text-right text-muted-foreground">{truncAddr(e.address)}</td>
                  <td className="num px-2 py-1.5 text-right text-muted-foreground">{timeAgo(e.ts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-border bg-card p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("num mt-1 text-[15px] font-semibold", color ?? "text-foreground")}>{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        className="num mt-0.5 h-10 border-border bg-elevated text-right text-[13px]"
      />
    </label>
  );
}

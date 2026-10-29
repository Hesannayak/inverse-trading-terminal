import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { HistoryEntry } from "@/services/types";
import { historyQuery, positionsQuery, walletQuery } from "@/lib/queries";
import { fmtBnb, fmtPct, fmtPrice, fmtSigned, timeAgo, truncAddr } from "@/lib/format";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { PositionsTable } from "@/components/trade/positions-table";

const PAGE_SIZE = 5;

export function PortfolioPage() {
  const { data: wallet } = useQuery({ ...walletQuery(), refetchInterval: false });
  const { data: positions } = useQuery(positionsQuery(wallet?.connected ? wallet.address : null));
  const { data: history } = useQuery(historyQuery(wallet?.connected ? wallet.address : null));
  const now = useNow(10000);

  const closed = history ?? [];
  const pnlAll = closed.reduce((s, h) => s + h.pnlBnb, 0);
  const pnl24h = closed.filter((h) => now - h.closedAt < 86400_000).reduce((s, h) => s + h.pnlBnb, 0);
  const pnl7d = closed.filter((h) => now - h.closedAt < 7 * 86400_000).reduce((s, h) => s + h.pnlBnb, 0);
  const volume = closed.reduce((s, h) => s + h.sizeBnb, 0);
  const wins = closed.filter((h) => h.pnlBnb > 0).length;
  const winRate = closed.length ? (wins / closed.length) * 100 : 0;

  if (!wallet?.connected) {
    return (
      <div className="mx-auto max-w-[1600px] p-2">
        <div className="border border-border bg-card p-10 text-center text-[13px] text-muted-foreground">
          Connect your wallet to see your portfolio.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-2 p-2">
      <h1 className="text-[15px] font-semibold">Portfolio</h1>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="PnL all" value={fmtSigned(pnlAll)} color={pnlAll >= 0 ? "text-long" : "text-short"} suffix=" BNB" />
        <Stat label="PnL 24h" value={fmtSigned(pnl24h)} color={pnl24h >= 0 ? "text-long" : "text-short"} suffix=" BNB" />
        <Stat label="PnL 7d" value={fmtSigned(pnl7d)} color={pnl7d >= 0 ? "text-long" : "text-short"} suffix=" BNB" />
        <Stat label="Volume" value={fmtBnb(volume)} suffix=" BNB" />
        <Stat label="Win rate" value={fmtPct(winRate, 1)} color="text-foreground" />
        <Stat label="Open positions" value={String(positions?.length ?? 0)} />
      </div>

      <div className="border border-border bg-card">
        <div className="border-b border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
          Open positions — all tokens
        </div>
        <PositionsTable positions={positions} />
      </div>

      <HistoryTable history={closed} />
    </div>
  );
}

function HistoryTable({ history }: { history: HistoryEntry[] }) {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const rows = history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
        Trade history
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[11px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="w-6 px-2 py-1" />
              <th className="px-2 py-1 font-medium">Token</th>
              <th className="px-2 py-1 font-medium">Side</th>
              <th className="px-2 py-1 text-right font-medium">Size</th>
              <th className="px-2 py-1 text-right font-medium">Entry</th>
              <th className="px-2 py-1 text-right font-medium">Exit</th>
              <th className="px-2 py-1 text-right font-medium">PnL</th>
              <th className="px-2 py-1 text-right font-medium">Closed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <HistoryRow
                key={h.id}
                h={h}
                expanded={expanded === h.id}
                onToggle={() => setExpanded(expanded === h.id ? null : h.id)}
              />
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-2 py-8 text-center text-muted-foreground">
                  No closed trades yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-2 py-1.5 text-[11px] text-muted-foreground">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="disabled:opacity-40 hover:text-foreground"
          >
            Prev
          </button>
          <span className="num">
            {page + 1} / {pages}
          </span>
          <button
            disabled={page >= pages - 1}
            onClick={() => setPage(page + 1)}
            className="disabled:opacity-40 hover:text-foreground"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  h,
  expanded,
  onToggle,
}: {
  h: HistoryEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-t border-border">
        <td className="px-2 py-1.5">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </td>
        <td className="px-2 py-1.5 font-medium">{h.symbol}</td>
        <td className={cn("num px-2 py-1.5 text-[10px] uppercase", h.side === "long" ? "text-long" : "text-short")}>
          {h.side} {h.leverage}x
        </td>
        <td className="num px-2 py-1.5 text-right">{fmtBnb(h.sizeBnb)}</td>
        <td className="num px-2 py-1.5 text-right">{fmtPrice(h.entryPriceBnb)}</td>
        <td className="num px-2 py-1.5 text-right">{fmtPrice(h.exitPriceBnb)}</td>
        <td className={cn("num px-2 py-1.5 text-right", h.pnlBnb >= 0 ? "text-long" : "text-short")}>
          {fmtSigned(h.pnlBnb)} ({fmtPct(h.pnlPct, 1)})
        </td>
        <td className="num px-2 py-1.5 text-right text-muted-foreground">{timeAgo(h.closedAt)}</td>
      </tr>
      {expanded && (
        <tr className="border-t border-border bg-elevated">
          <td />
          <td colSpan={7} className="px-2 py-2">
            <div className="num flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-muted-foreground">
              <span>Open fee: {fmtBnb(h.fees.openFeeBnb)} BNB</span>
              <span>Close fee: {fmtBnb(h.fees.closeFeeBnb)} BNB</span>
              <span>Borrowing fee: {fmtBnb(h.fees.borrowingFeeBnb)} BNB</span>
              <span className="text-foreground">Total fees: {fmtBnb(h.fees.totalBnb)} BNB</span>
              <span>{truncAddr(h.token)}</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="border border-border bg-card p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("num mt-1 text-[15px] font-semibold", color ?? "text-foreground")}>
        {value}
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

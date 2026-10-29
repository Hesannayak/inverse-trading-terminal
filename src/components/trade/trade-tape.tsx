import { useEffect, useRef, useState } from "react";
import type { TapeEntry, TopTrade } from "@/services/types";
import { leaderboardQuery, tapeQuery } from "@/lib/queries";
import { fmtBnb, fmtPct, fmtSigned, timeAgo, truncAddr } from "@/lib/format";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

export function TradeTape({ className }: { className?: string }) {
  const { data: tape } = useQuery(tapeQuery());
  const now = useNow(1000);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [atTop, setAtTop] = useState(true);

  // auto-scroll stays pinned to the newest rows unless the user scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || paused) return;
    if (atTop) el.scrollTop = 0;
  }, [tape, paused, atTop]);

  if (!tape?.length) return <div className={cn("p-4 text-center text-[12px] text-muted-foreground", className)}>Loading tape…</div>;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setAtTop(el.scrollTop < 8);
          setPaused(el.scrollTop > 24);
        }}
        className="max-h-[520px] overflow-y-auto"
      >
        {tape.map((t) => (
          <TapeRow key={t.id} t={t} now={now} />
        ))}
      </div>
      {paused && (
        <button
          onClick={() => {
            setPaused(false);
            setAtTop(true);
            scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 border border-border bg-elevated px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-3 w-3" /> new trades
        </button>
      )}
    </div>
  );
}

function TapeRow({ t, now }: { t: TapeEntry; now: number }) {
  const color = t.side === "long" ? "text-long" : "text-short";
  return (
    <div
      className={cn(
        "tape-in flex h-8 items-center gap-2 border-l-2 px-2 text-[11px] hover:bg-elevated",
        t.side === "long" ? "border-l-long" : "border-l-short",
        t.liquidated && "bg-short/10"
      )}
    >
      <span className="w-14 font-medium text-foreground">{t.symbol}</span>
      <span className={cn("num w-16 text-[10px]", color)}>
        {t.side} {t.leverage}x
      </span>
      <span className="num flex-1 text-right text-muted-foreground">{fmtBnb(t.sizeBnb)} BNB</span>
      {t.pnlBnb !== null && (
        <span className={cn("num w-16 text-right", t.pnlBnb >= 0 ? "text-long" : "text-short")}>
          {fmtSigned(t.pnlBnb, 3)}
        </span>
      )}
      {t.liquidated && (
        <span className="num text-[9px] font-bold text-short">LIQUIDATED</span>
      )}
      <span className="num w-8 text-right text-[10px] text-muted-foreground">{timeAgo(t.ts, now)}</span>
    </div>
  );
}

export function TopTrades() {
  const { data: rows } = useQuery(leaderboardQuery());
  if (!rows?.length) return null;
  return (
    <div className="border-t border-border">
      <div className="px-2 py-2 text-[11px] font-medium text-muted-foreground">Top trades</div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="px-2 py-1 font-medium">#</th>
            <th className="px-2 py-1 font-medium">Token</th>
            <th className="px-2 py-1 font-medium">Side</th>
            <th className="px-2 py-1 text-right font-medium">PnL</th>
            <th className="px-2 py-1 text-right font-medium">%</th>
            <th className="px-2 py-1 text-right font-medium">Wallet</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: TopTrade) => (
            <tr key={r.rank} className="border-t border-border">
              <td className="num px-2 py-1.5 text-muted-foreground">{r.rank}</td>
              <td className="px-2 py-1.5 font-medium">{r.symbol}</td>
              <td className={cn("num px-2 py-1.5 text-[10px]", r.side === "long" ? "text-long" : "text-short")}>
                {r.side} {r.leverage}x
              </td>
              <td className="num px-2 py-1.5 text-right text-long">+{fmtBnb(r.pnlBnb)}</td>
              <td className="num px-2 py-1.5 text-right text-long">+{fmtPct(r.pnlPct, 0)}</td>
              <td className="num px-2 py-1.5 text-right text-muted-foreground">{truncAddr(r.address)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import type { Market } from "@/services/types";
import { marketQuery } from "@/lib/queries";
import { fmtBnb, fmtCompact, fmtPct, fmtPrice, fmtUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TokenCard({ token }: { token: string }) {
  const { data: m } = useQuery(marketQuery(token));

  if (!m) {
    return (
      <div className="border border-border bg-card p-3">
        <div className="h-4 w-24 animate-pulse bg-muted" />
        <div className="mt-2 h-6 w-32 animate-pulse bg-muted" />
      </div>
    );
  }
  return <TokenCardBody m={m} />;
}

function TokenCardBody({ m }: { m: Market }) {
  const up = m.change24hPct >= 0;
  const totalOi = m.longOiBnb + m.shortOiBnb;
  const longShare = totalOi > 0 ? (m.longOiBnb / totalOi) * 100 : 50;

  return (
    <div className="border border-border bg-card">
      <div className="flex items-start justify-between px-3 pt-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">{m.symbol}</span>
            <span className="border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              {m.oracleRoute}
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{m.name}</div>
        </div>
        <div className="text-right">
          <div className="num text-[18px] font-semibold text-foreground">{fmtUsd(m.priceUsd)}</div>
          <div className={cn("num text-[12px]", up ? "text-long" : "text-short")}>
            {fmtPct(m.change24hPct)} · {fmtPrice(m.priceBnb)} BNB
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-1 border-t border-border px-3 py-2 text-[11px]">
        <Row label="PancakeSwap liquidity">
          <span className="num">{fmtBnb(m.liquidityBnb)} BNB</span>
        </Row>
        <Row label="Volume 24h">
          <span className="num">{fmtCompact(m.volume24hBnb)} BNB</span>
        </Row>
      </div>
      <div className="border-t border-border px-3 py-2">
        <div className="mb-1 flex items-center justify-between text-[10px] font-mono">
          <span className="text-long">Long OI {fmtBnb(m.longOiBnb)}</span>
          <span className="text-muted-foreground">OI balance</span>
          <span className="text-short">Short OI {fmtBnb(m.shortOiBnb)}</span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden bg-muted">
          <div className="bg-long" style={{ width: `${longShare}%` }} />
          <div className="bg-short" style={{ width: `${100 - longShare}%` }} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

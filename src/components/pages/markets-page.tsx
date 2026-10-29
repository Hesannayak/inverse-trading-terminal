import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { Market } from "@/services/types";
import { marketsQuery } from "@/lib/queries";
import { fmtBnb, fmtCompact, fmtPct, fmtPrice, truncAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SortKey =
  | "symbol"
  | "priceUsd"
  | "change24hPct"
  | "volume24hBnb"
  | "longOiBnb"
  | "shortOiBnb"
  | "liquidityBnb";

const COLUMNS: Array<{ key: SortKey; label: string; align?: string }> = [
  { key: "symbol", label: "Token" },
  { key: "priceUsd", label: "Price", align: "text-right" },
  { key: "change24hPct", label: "24h", align: "text-right" },
  { key: "volume24hBnb", label: "Volume 24h", align: "text-right" },
  { key: "longOiBnb", label: "Long OI", align: "text-right" },
  { key: "shortOiBnb", label: "Short OI", align: "text-right" },
  { key: "liquidityBnb", label: "Liquidity", align: "text-right" },
];

export function MarketsPage() {
  const navigate = useNavigate();
  const { data: markets } = useQuery(marketsQuery());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24hBnb");
  const [dir, setDir] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    let list = markets ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.symbol.toLowerCase().includes(q) ||
          m.token.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === "symbol") return a.symbol.localeCompare(b.symbol) * dir;
      return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
    });
  }, [markets, search, sortKey, dir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setDir(-1);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] p-2">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-[15px] font-semibold">Markets</h1>
        <Input
          placeholder="Search name, symbol or address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full max-w-xs border-border bg-card text-[12px]"
        />
      </div>
      <div className="overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[820px] text-[12px]">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {COLUMNS.map((c) => (
                <th key={c.key} className={cn("px-3 py-2 text-left font-medium", c.align)}>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort(c.key)}
                  >
                    {c.label}
                    {sortKey === c.key &&
                      (dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Oracle</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((m: Market) => (
              <tr
                key={m.token}
                onClick={() => navigate({ to: "/trade/$token", params: { token: m.token } })}
                className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-elevated"
              >
                <td className="px-3 py-2">
                  <div className="font-medium">{m.symbol}</div>
                  <div className="num text-[10px] text-muted-foreground">{truncAddr(m.token)}</div>
                </td>
                <td className="num px-3 py-2 text-right">{fmtPrice(m.priceUsd)}</td>
                <td className={cn("num px-3 py-2 text-right", m.change24hPct >= 0 ? "text-long" : "text-short")}>
                  {fmtPct(m.change24hPct)}
                </td>
                <td className="num px-3 py-2 text-right">{fmtCompact(m.volume24hBnb)} BNB</td>
                <td className="num px-3 py-2 text-right text-long">{fmtBnb(m.longOiBnb)}</td>
                <td className="num px-3 py-2 text-right text-short">{fmtBnb(m.shortOiBnb)}</td>
                <td className="num px-3 py-2 text-right">{fmtBnb(m.liquidityBnb)} BNB</td>
                <td className="px-3 py-2 text-right">
                  <span className="num border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {m.oracleRoute}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 border-border px-3 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ to: "/trade/$token", params: { token: m.token } });
                    }}
                  >
                    Trade
                  </Button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                  No markets match "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

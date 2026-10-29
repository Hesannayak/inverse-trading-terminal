import { useEffect, useRef } from "react";
import type { PoolSeriesPoint } from "@/services/types";
import { cn } from "@/lib/utils";

export type PoolMetric = "tvlBnb" | "feesBnb" | "utilizationPct";

const LABELS: Record<PoolMetric, string> = {
  tvlBnb: "TVL",
  feesBnb: "Fees",
  utilizationPct: "Utilization",
};

export function PoolChart({
  series,
  metric,
  onMetric,
}: {
  series: PoolSeriesPoint[] | undefined;
  metric: PoolMetric;
  onMetric: (m: PoolMetric) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);
  const seriesRef = useRef<{ setData: (d: unknown) => void } | null>(null);

  useEffect(() => {
    let disposed = false;
    import("lightweight-charts").then(({ createChart, LineSeries, ColorType }) => {
      if (disposed || !containerRef.current) return;
      const chart = createChart(containerRef.current, {
        height: 240,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#7a7a8c",
          fontSize: 10,
          fontFamily: "JetBrains Mono, monospace",
        },
        grid: { vertLines: { color: "#14141d" }, horzLines: { color: "#14141d" } },
        rightPriceScale: { borderColor: "#1a1a2e" },
        timeScale: { borderColor: "#1a1a2e", timeVisible: true },
      });
      const line = chart.addSeries(LineSeries, { color: "#00ff88", lineWidth: 1, priceLineVisible: false });
      chartRef.current = chart;
      seriesRef.current = line as unknown as { setData: (d: unknown) => void };
      const ro = new ResizeObserver(() => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
      });
      ro.observe(containerRef.current);
      chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    return () => {
      disposed = true;
      (chartRef.current as { remove?: () => void } | null)?.remove?.();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const line = seriesRef.current;
    const chart = chartRef.current as { timeScale: () => { fitContent: () => void } } | null;
    if (!line || !series?.length) return;
    line.setData(series.map((p) => ({ time: p.ts as never, value: p[metric] })));
    chart?.timeScale().fitContent();
  }, [series, metric]);

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">Share price · pool metrics</span>
        <div className="flex gap-0.5">
          {(Object.keys(LABELS) as PoolMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => onMetric(m)}
              className={cn(
                "px-2 py-0.5 text-[11px] transition-colors",
                m === metric ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="h-[240px] w-full" />
    </div>
  );
}

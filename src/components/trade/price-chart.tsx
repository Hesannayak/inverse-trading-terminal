import { useEffect, useRef } from "react";
import type { Candle, Timeframe } from "@/services/types";
import { cn } from "@/lib/utils";

const TFS: Timeframe[] = ["1H", "4H", "1D", "1W"];

interface Props {
  candles: Candle[] | undefined;
  timeframe: Timeframe;
  onTimeframe: (tf: Timeframe) => void;
  /** tint by 24h direction */
  up: boolean;
  className?: string;
  compact?: boolean;
}

export function PriceChart({ candles, timeframe, onTimeframe, up, className, compact }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);
  const seriesRef = useRef<{ setData: (d: unknown) => void } | null>(null);
  const height = compact ? 200 : 320;

  useEffect(() => {
    let disposed = false;
    import("lightweight-charts").then(({ createChart, AreaSeries, ColorType, CrosshairMode }) => {
      if (disposed || !containerRef.current) return;
      const chart = createChart(containerRef.current, {
        height,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#7a7a8c",
          fontSize: 10,
          fontFamily: "JetBrains Mono, monospace",
        },
        grid: {
          vertLines: { color: "#14141d" },
          horzLines: { color: "#14141d" },
        },
        rightPriceScale: { borderColor: "#1a1a2e" },
        timeScale: { borderColor: "#1a1a2e", timeVisible: true, secondsVisible: false },
        crosshair: { mode: CrosshairMode.Normal },
      });
      const series = chart.addSeries(AreaSeries, {
        lineColor: up ? "#00ff88" : "#ff3366",
        topColor: up ? "rgba(0,255,136,0.18)" : "rgba(255,51,102,0.18)",
        bottomColor: "rgba(0,0,0,0)",
        priceLineColor: "#7a7a8c",
        lineWidth: 1,
      });
      chartRef.current = chart;
      seriesRef.current = series as unknown as { setData: (d: unknown) => void };
      if (candles?.length) {
        series.setData(candles);
        chart.timeScale().fitContent();
      }
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
    // chart is created once per mount; data updates flow through the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current as
      | { timeScale: () => { fitContent: () => void } }
      | null;
    if (!series || !candles?.length) return;
    series.setData(candles);
    chart?.timeScale().fitContent();
  }, [candles]);

  return (
    <div className={cn("border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">Price (BNB)</span>
        <div className="flex gap-0.5">
          {TFS.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframe(tf)}
              className={cn(
                "px-2 py-0.5 text-[11px] font-mono transition-colors",
                tf === timeframe
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} style={{ height }} className="w-full" />
    </div>
  );
}

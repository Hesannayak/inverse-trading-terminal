import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Zap } from "lucide-react";
import * as svc from "@/services";
import type { Side, Timeframe } from "@/services/types";
import { useTradeStore } from "@/store/trade-store";
import { oracleQuery, poolQuery, positionsQuery, previewQuery, walletQuery } from "@/lib/queries";
import { fmtBnb, fmtPct, fmtPrice, fmtSigned } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OneClickModal } from "./one-click-modal";
import { PositionsTable } from "./positions-table";

const LEVERAGES: Array<2 | 5 | 10> = [2, 5, 10];
const LIQ_HINTS: Record<number, string> = {
  2: "liquidates at ~47.5% move",
  5: "liquidates at ~19% move",
  10: "liquidates at ~9.5% move",
};

export function OrderPanel({ token }: { token: string | null }) {
  const store = useTradeStore();
  const queryClient = useQueryClient();
  const [simMove, setSimMove] = useState(0);
  const [tpslOpen, setTpslOpen] = useState(false);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [oneClickOpen, setOneClickOpen] = useState(false);

  const { data: wallet } = useQuery({ ...walletQuery(), refetchInterval: false });
  const { data: pool } = useQuery(poolQuery());
  const { data: oracle } = useQuery({ ...oracleQuery(token), refetchInterval: 15000 });
  const amount = parseFloat(store.amountBnb) || 0;
  const { data: preview } = useQuery(
    previewQuery({ token, isLong: store.side === "long", leverage: store.leverage, amountBnb: amount })
  );
  const { data: positions } = useQuery(positionsQuery(wallet?.connected ? wallet.address : null));

  const open = useMutation({
    mutationFn: () =>
      svc.openPosition({
        token: token!,
        isLong: store.side === "long",
        leverage: store.leverage,
        amountBnb: amount,
        tpBnb: tp ? parseFloat(tp) : null,
        slBnb: sl ? parseFloat(sl) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["tape"] });
      setTp("");
      setSl("");
      setTpslOpen(false);
    },
  });

  const isLong = store.side === "long";
  const tier = pool?.leverageTiers?.[store.leverage] ?? 0;
  const leverageLocked = pool ? pool.tvlBnb < tier : false;
  const oracleBlocked = oracle && oracle.state !== "ok";
  const balance = wallet?.connected ? wallet.bnbBalance : 0;
  const tradable = !!token && amount > 0 && !oracleBlocked && !leverageLocked && wallet?.connected;

  // rough P&L projection: margin · leverage · move
  const projected = amount * store.leverage * (isLong ? simMove / 100 : -simMove / 100);

  return (
    <div
      className={cn(
        "border bg-card",
        isLong ? "border-long/60" : "border-short/60",
        "flex flex-col"
      )}
    >
      <div className="grid grid-cols-2 gap-2 p-2">
        {(["long", "short"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => store.setSide(s)}
            className={cn(
              "h-12 text-[14px] font-bold uppercase tracking-wide transition-colors",
              store.side === s
                ? s === "long"
                  ? "bg-long text-background"
                  : "bg-short text-background"
                : "border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="border-t border-border p-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Leverage</span>
          {leverageLocked && <span className="num text-warning">unlocks at {tier} BNB pool</span>}
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-1">
          {LEVERAGES.map((l) => (
            <Tooltip key={l}>
              <TooltipTrigger asChild>
                <button
                  disabled={leverageLocked}
                  onClick={() => store.setLeverage(l)}
                  className={cn(
                    "h-9 font-mono text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    store.leverage === l && !leverageLocked
                      ? isLong
                        ? "bg-long/15 text-long"
                        : "bg-short/15 text-short"
                      : "border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l}x
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
                <span className="num text-[11px]">{LIQ_HINTS[l]}</span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Amount (BNB)</span>
          <span className="num">
            Balance: {wallet?.connected ? fmtBnb(balance) : "—"} BNB
          </span>
        </div>
        <div className="mt-1.5 flex gap-1">
          <Input
            inputMode="decimal"
            placeholder="0.00"
            value={store.amountBnb}
            onChange={(e) => store.setAmountBnb(e.target.value.replace(/[^0-9.]/g, ""))}
            className="num h-10 border-border bg-elevated text-[14px] text-right"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-border bg-elevated px-3 font-mono text-[11px]"
            onClick={() => store.setAmountBnb(balance ? String(Math.floor(balance * 10000) / 10000) : "")}
          >
            MAX
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-2 py-1.5 text-[11px]">
        {preview ? (
          <>
            <InfoRow label="Entry price">
              <span className="num">{fmtPrice(preview.entryPriceBnb)} BNB</span>
            </InfoRow>
            <InfoRow label="Liquidation price">
              <span className="num text-short">{fmtPrice(preview.liquidationPriceBnb)} BNB</span>
            </InfoRow>
            <InfoRow label="Max profit">
              <span className="num text-long">
                +{fmtBnb(preview.maxProfitBnb)} BNB ({fmtPct(preview.maxProfitPct, 0)})
              </span>
            </InfoRow>
            <InfoRow label="Open fee">
              <span className="num">{preview.openFeePct.toFixed(1)}%</span>
            </InfoRow>
            <InfoRow label="Borrowing fee">
              <span className="num">{preview.borrowingFeePctPerHour.toFixed(3)}%/hr</span>
            </InfoRow>
            <InfoRow label="Holding period">
              <span className="num">min {preview.minHoldSeconds}s</span>
            </InfoRow>
          </>
        ) : (
          <div className="py-2 text-center text-muted-foreground">
            {token ? "Enter an amount to preview the trade" : "Select a token to start"}
          </div>
        )}
      </div>

      {preview && (
        <div className="border-t border-border px-2 py-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">P&L simulator</span>
            <span className={cn("num font-medium", projected >= 0 ? "text-long" : "text-short")}>
              {fmtSigned(projected, 4)} BNB
            </span>
          </div>
          <Slider
            value={[simMove]}
            min={-50}
            max={50}
            step={1}
            onValueChange={([v]) => setSimMove(v)}
            className="mt-2"
          />
          <div className="num mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>−50%</span>
            <span>0</span>
            <span>+50%</span>
          </div>
        </div>
      )}

      <Collapsible open={tpslOpen} onOpenChange={setTpslOpen} className="border-t border-border">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-2 text-[11px] text-muted-foreground hover:text-foreground">
          Take profit / Stop loss
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", tpslOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-1 px-2 pb-2">
            <Input
              inputMode="decimal"
              placeholder="TP price"
              value={tp}
              onChange={(e) => setTp(e.target.value.replace(/[^0-9.]/g, ""))}
              className="num h-9 border-border bg-elevated text-right text-[12px]"
            />
            <Input
              inputMode="decimal"
              placeholder="SL price"
              value={sl}
              onChange={(e) => setSl(e.target.value.replace(/[^0-9.]/g, ""))}
              className="num h-9 border-border bg-elevated text-right text-[12px]"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="p-2">
        <Button
          disabled={!tradable || open.isPending}
          onClick={() => open.mutate()}
          className={cn(
            "h-[52px] w-full text-[15px] font-bold uppercase tracking-wide",
            isLong ? "bg-long text-background hover:bg-long/85" : "bg-short text-background hover:bg-short/85"
          )}
        >
          {open.isPending
            ? "Submitting…"
            : oracleBlocked
              ? "Trading unavailable"
              : !wallet?.connected
                ? "Connect wallet to trade"
                : `Open ${isLong ? "Long" : "Short"}`}
        </Button>
        {oracleBlocked && (
          <p className="mt-1 text-center text-[10px] text-warning">{oracle.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-2 py-2">
        <div className="flex items-center gap-2">
          <Zap className={cn("h-3.5 w-3.5", store.oneClick.enabled ? "text-warning" : "text-muted-foreground")} />
          <span className="text-[12px] text-muted-foreground">One-click trading</span>
        </div>
        <Switch
          checked={store.oneClick.enabled}
          onCheckedChange={(v) => {
            store.setOneClick({ enabled: v });
            if (v) setOneClickOpen(true);
          }}
        />
      </div>

      <div className="border-t border-border">
        <div className="px-2 pt-2 text-[11px] font-medium text-muted-foreground">
          Positions on this token
        </div>
        <PositionsTable positions={positions?.filter((p) => p.token === token)} />
      </div>

      <OneClickModal open={oneClickOpen} onOpenChange={setOneClickOpen} />
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

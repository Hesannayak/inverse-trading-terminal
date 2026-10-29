import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services";
import type { Position } from "@/services/types";
import { fmtBnb, fmtPct, fmtPrice, fmtSigned, timeAgo } from "@/lib/format";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PositionsTable({ positions }: { positions: Position[] | undefined }) {
  const now = useNow(1000);

  if (!positions?.length) {
    return (
      <div className="px-2 py-6 text-center text-[12px] text-muted-foreground">
        No open positions
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[11px]">
        <thead>
          <tr className="text-left text-muted-foreground">
            <Th className="sticky left-0 bg-card">Side</Th>
            <Th className="text-right">Lev</Th>
            <Th className="text-right">Size</Th>
            <Th className="text-right">Entry</Th>
            <Th className="text-right">Mark</Th>
            <Th className="text-right">PnL</Th>
            <Th className="text-right">Liq</Th>
            <Th className="text-right">Fees</Th>
            <Th className="text-right"></Th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <Td className={cn("sticky left-0 bg-card font-medium uppercase", p.side === "long" ? "text-long" : "text-short")}>
                {p.side} <span className="num text-muted-foreground">{timeAgo(p.openedAt, now)}</span>
              </Td>
              <Td className="num text-right">{p.leverage}x</Td>
              <Td className="num text-right">{fmtBnb(p.sizeBnb)}</Td>
              <Td className="num text-right">{fmtPrice(p.entryPriceBnb)}</Td>
              <Td className="num text-right">{fmtPrice(p.markPriceBnb)}</Td>
              <Td className={cn("num text-right", p.pnlBnb >= 0 ? "text-long" : "text-short")}>
                {fmtSigned(p.pnlBnb)}
              </Td>
              <Td className="num text-right text-short">{fmtPrice(p.liquidationPriceBnb)}</Td>
              <Td className="num text-right text-muted-foreground">{fmtBnb(p.feesBnb)}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <CloseButton id={p.id} />
                  <TpSlButton position={p} />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CloseButton({ id, size = "sm" }: { id: string; size?: "sm" | "default" }) {
  const queryClient = useQueryClient();
  const close = useMutation({
    mutationFn: () => svc.closePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: ["tape"] });
    },
  });
  return (
    <Button
      variant="outline"
      size={size}
      className="h-6 border-border px-2 text-[10px]"
      disabled={close.isPending}
      onClick={() => close.mutate()}
    >
      {close.isPending ? "…" : "Close"}
    </Button>
  );
}

function TpSlButton({ position }: { position: Position }) {
  const [open, setOpen] = useState(false);
  const [tp, setTp] = useState(position.tpBnb ? String(position.tpBnb) : "");
  const [sl, setSl] = useState(position.slBnb ? String(position.slBnb) : "");
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      svc.setTpSl(
        position.id,
        tp ? parseFloat(tp) : null,
        sl ? parseFloat(sl) : null
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      setOpen(false);
    },
  });
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-6 border-border px-2 text-[10px]"
        onClick={() => setOpen(true)}
      >
        TP/SL
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs border-border bg-card p-4">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold">
              TP / SL — {position.symbol} {position.side} {position.leverage}x
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <LabeledInput label="Take profit price" value={tp} onChange={setTp} />
            <LabeledInput label="Stop loss price" value={sl} onChange={setSl} />
            <p className="text-[10px] text-muted-foreground">
              Mark {fmtPrice(position.markPriceBnb)} BNB · Entry {fmtPrice(position.entryPriceBnb)} BNB ·
              PnL {fmtPct((position.pnlBnb / (position.sizeBnb / position.leverage)) * 100)}
            </p>
            <Button
              className="h-9 w-full bg-long text-background hover:bg-long/85"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LabeledInput({
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
        className="num mt-0.5 h-9 border-border bg-elevated text-right text-[12px]"
      />
    </label>
  );
}

function Th({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={cn("px-2 py-1 font-medium", className)}>{children}</th>;
}
function Td({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <td className={cn("px-2 py-1.5", className)}>{children}</td>;
}

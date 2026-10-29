import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services";
import { useTradeStore } from "@/store/trade-store";
import { oneClickSessionQuery, walletQuery } from "@/lib/queries";
import { fmtBnb } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OneClickModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useTradeStore();
  const queryClient = useQueryClient();
  const { data: session } = useQuery(oneClickSessionQuery());
  const { data: wallet } = useQuery({ ...walletQuery(), refetchInterval: false });

  const create = useMutation({
    mutationFn: () =>
      svc.createSession({
        budgetBnb: store.oneClick.budgetBnb,
        maxPerTradeBnb: store.oneClick.maxPerTradeBnb,
        durationHours: store.oneClick.durationHours,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["oneClickSession"] }),
  });
  const revoke = useMutation({
    mutationFn: svc.revokeSession,
    onSuccess: () => {
      store.setOneClick({ enabled: false });
      queryClient.invalidateQueries({ queryKey: ["oneClickSession"] });
    },
  });

  const set = (k: "budgetBnb" | "maxPerTradeBnb" | "durationHours", v: string) => {
    const n = parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
    store.setOneClick(k === "durationHours" ? { durationHours: Math.min(n, 24) } : { [k]: n });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-card p-4">
        <DialogHeader>
          <DialogTitle className="text-[14px] font-semibold">⚡ One-click trading</DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Trades fire instantly with your saved defaults, within a budget cap. Session auto-expires
            after the duration you set.
          </DialogDescription>
        </DialogHeader>

        {session ? (
          <div className="space-y-3">
            <div className="border border-border bg-elevated p-3 text-[12px]">
              <Row label="Budget">{fmtBnb(session.budgetBnb)} BNB</Row>
              <Row label="Max per trade">{fmtBnb(session.maxPerTradeBnb)} BNB</Row>
              <Row label="Duration">{session.durationHours}h</Row>
              <Row label="Expires">
                {new Date(session.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Row>
            </div>
            <Button
              variant="outline"
              className="h-9 w-full border-short/50 text-short hover:bg-short/10"
              disabled={revoke.isPending}
              onClick={() => revoke.mutate()}
            >
              {revoke.isPending ? "Revoking…" : "Revoke session"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Budget (BNB)" value={String(store.oneClick.budgetBnb)} onChange={(v) => set("budgetBnb", v)} />
            <Field label="Max per trade (BNB)" value={String(store.oneClick.maxPerTradeBnb)} onChange={(v) => set("maxPerTradeBnb", v)} />
            <Field
              label="Duration (hours, ≤ 24)"
              value={String(store.oneClick.durationHours)}
              onChange={(v) => set("durationHours", v)}
            />
            {wallet?.connected ? (
              <Button
                className="h-10 w-full bg-long text-background hover:bg-long/85"
                disabled={create.isPending}
                onClick={() => create.mutate()}
              >
                {create.isPending ? "Creating…" : "Create session"}
              </Button>
            ) : (
              <p className="text-center text-[11px] text-warning">Connect your wallet first</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="num">{children}</span>
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
        onChange={(e) => onChange(e.target.value)}
        className="num mt-0.5 h-9 border-border bg-elevated text-right text-[12px]"
      />
    </label>
  );
}

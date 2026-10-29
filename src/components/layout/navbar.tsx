import { Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services";
import { walletQuery } from "@/lib/queries";
import { fmtBnb, truncAddr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TABS = [
  { to: "/trade", label: "Trade" },
  { to: "/markets", label: "Markets" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/pool", label: "Pool" },
  { to: "/how", label: "How" },
] as const;

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const { data: wallet } = useQuery({ ...walletQuery(), refetchInterval: false });

  const connect = useMutation({
    mutationFn: svc.connectWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <header className="sticky top-0 z-40 h-12 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-6 px-4">
        <Link to="/trade" className="text-lg font-bold lowercase tracking-tight text-foreground">
          inverse
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive(t.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {isActive(t.to) && (
                <div className="mt-1 h-[2px] w-full bg-foreground" />
              )}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-border bg-card px-2.5 py-1">
            <div className="h-3.5 w-3.5 rounded-full bg-[#f0b90b]" />
            <span className="text-[12px] font-medium text-muted-foreground">BNB Chain</span>
          </div>
          {wallet?.connected ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 border-border bg-card px-3 font-mono text-[12px]"
            >
              <span className="text-muted-foreground">{truncAddr(wallet.address ?? "")}</span>
              <span className="text-foreground">{fmtBnb(wallet.bnbBalance)} BNB</span>
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 bg-long px-3 text-[12px] font-semibold text-background hover:bg-long/85"
              disabled={connect.isPending}
              onClick={() => connect.mutate()}
            >
              {connect.isPending ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight, BarChart3, Droplets, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/trade", label: "Trade", icon: ArrowLeftRight },
  { to: "/markets", label: "Markets", icon: BarChart3 },
  { to: "/portfolio", label: "Portfolio", icon: LayoutList },
  { to: "/pool", label: "Pool", icon: Droplets },
] as const;

export function MobileTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background md:hidden">
      {TABS.map((t) => {
        const active = pathname === t.to || pathname.startsWith(t.to + "/");
        const Icon = t.icon;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

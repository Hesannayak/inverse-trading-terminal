import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Ban, Clock } from "lucide-react";
import type { OracleStatus } from "@/services/types";
import { oracleQuery } from "@/lib/queries";
import { fmtCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Live countdown derived from readyInSeconds so no 1s polling is needed. */
function useCountdown(status: OracleStatus | undefined) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (status?.state !== "warming") {
      setRemaining(null);
      return;
    }
    const end = Date.now() + status.readyInSeconds * 1000;
    setRemaining(status.readyInSeconds);
    const t = setInterval(() => setRemaining(Math.max(0, (end - Date.now()) / 1000)), 500);
    return () => clearInterval(t);
  }, [status?.state, status?.readyInSeconds, status]);
  return remaining;
}

export function OracleBanner({ token }: { token: string | null }) {
  const { data: status } = useQuery({ ...oracleQuery(token), refetchInterval: 15000 });
  const remaining = useCountdown(status);

  if (!token || !status || status.state === "ok") return null;

  if (status.state === "warming") {
    return (
      <div className="flex items-center gap-2 border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] text-warning">
        <Clock className="h-3.5 w-3.5" />
        Oracle warming — ready in {fmtCountdown(remaining ?? status.readyInSeconds)}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center gap-2 border px-3 py-2 text-[12px] text-short",
        "border-short/40 bg-short/10"
      )}
    >
      {status.state === "halted" ? (
        <Ban className="h-3.5 w-3.5" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" />
      )}
      {status.message}
    </div>
  );
}

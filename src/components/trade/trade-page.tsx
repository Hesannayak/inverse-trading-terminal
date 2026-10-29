import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import type { Timeframe } from "@/services/types";
import { candlesQuery, marketQuery, positionsQuery, walletQuery } from "@/lib/queries";
import { isValidAddress } from "@/lib/format";
import { OrderPanel } from "@/components/trade/order-panel";
import { PasteBox } from "@/components/trade/paste-box";
import { PriceChart } from "@/components/trade/price-chart";
import { TokenCard } from "@/components/trade/token-card";
import { OracleBanner } from "@/components/trade/oracle-banner";
import { PositionsTable } from "@/components/trade/positions-table";
import { TopTrades, TradeTape } from "@/components/trade/trade-tape";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function TradePage({ token }: { token: string | null }) {
  const [tf, setTf] = useState<Timeframe>("1H");
  const valid = token ? isValidAddress(token) : false;
  const { data: market } = useQuery({ ...marketQuery(token), enabled: valid });
  const { data: candles } = useQuery({ ...candlesQuery(token ?? "", tf), enabled: valid });
  const { data: wallet } = useQuery({ ...walletQuery(), refetchInterval: false });
  const { data: positions } = useQuery(positionsQuery(wallet?.connected ? wallet.address : null));
  const tokenPositions = positions?.filter((p) => p.token === token);

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-2 p-2 md:grid-cols-[1fr_2fr_1fr]">
      {/* center column: order panel */}
      <div className="order-1 md:col-start-2 md:row-start-1">
        <OrderPanel token={valid ? token : null} />
      </div>

      {/* left column */}
      {token && !valid && (
        <div className="order-3 border border-short/40 bg-short/10 px-3 py-2 text-[12px] text-short md:col-start-1 md:row-start-2">
          Not a valid BEP-20 contract address.
        </div>
      )}
      {valid && (
        <div className="order-3 space-y-2 md:col-start-1 md:row-start-2">
          <TokenCard token={token!} />
          <OracleBanner token={token} />
        </div>
      )}
      <div className="order-4 md:col-start-1 md:row-start-1">
        <PasteBox />
      </div>
      {valid && (
        <div className="order-2 md:col-start-1 md:row-start-4">
          <PriceChart
            candles={candles}
            timeframe={tf}
            onTimeframe={setTf}
            up={(market?.change24hPct ?? 0) >= 0}
            compact
          />
        </div>
      )}

      {/* center column: positions for this token */}
      <div className="order-5 border border-border bg-card md:col-start-2 md:row-start-2">
        <div className="border-b border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
          Positions{market ? ` · ${market.symbol}` : ""}
        </div>
        <PositionsTable positions={tokenPositions} />
      </div>

      {/* right column: tape + top trades */}
      <div className="order-6 hidden space-y-2 md:col-start-3 md:row-span-2 md:row-start-1 md:block">
        <div className="border border-border bg-card">
          <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
            <Radio className="h-3 w-3 text-long" /> Trade tape
          </div>
          <TradeTape />
        </div>
        <div className="border border-border bg-card">
          <TopTrades />
        </div>
      </div>

      {/* mobile: live feed bottom sheet */}
      <div className="order-6 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-10 w-full border-border bg-card text-[12px]">
              Live feed
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] border-border bg-card p-0">
            <SheetTitle className="border-b border-border px-3 py-2 text-[12px] text-muted-foreground">
              Trade tape
            </SheetTitle>
            <TradeTape className="max-h-[55vh]" />
            <TopTrades />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

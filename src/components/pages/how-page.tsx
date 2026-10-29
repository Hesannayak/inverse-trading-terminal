import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HowPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 text-[13px] leading-relaxed">
      <header>
        <h1 className="text-xl font-semibold">How inverse works</h1>
        <p className="mt-1 text-muted-foreground">
          A plain explanation of the pool model, the fees, and the risks. No hype.
        </p>
      </header>

      <section>
        <h2 className="text-[15px] font-semibold">Short any coin</h2>
        <p className="mt-2 text-muted-foreground">
          Most DEXs only let you buy. inverse lets you open a leveraged long or a leveraged short on
          any BEP-20 token — you just paste its contract address. A short profits when the price
          falls. Positions are tracked by an oracle price feed from PancakeSwap, so there is no
          order book: you always trade against the pool at the oracle price.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">How the pool model works</h2>
        <div className="mt-3 border border-border bg-card p-4 font-mono text-[11px] text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <div className="border border-long/50 bg-long/10 px-4 py-2 text-long">Traders (long / short)</div>
            <div className="text-muted-foreground">↓ collateral + fees · ↑ P&L paid from pool</div>
            <div className="border border-border bg-elevated px-6 py-2 text-foreground">inverse liquidity pool</div>
            <div className="text-muted-foreground">↓ yield from fees & losing sides</div>
            <div className="border border-border bg-elevated px-6 py-2 text-foreground">Liquidity providers (LPs)</div>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">
          Traders post collateral in BNB. The pool takes the other side of every position. When a
          trader wins, the pool pays out; when a trader loses or is liquidated, the pool keeps the
          collateral. LPs deposit BNB, receive shares, and earn the open/close fees, the hourly
          borrowing fee, and the losing side of trades. Long and short interest is monitored so the
          pool never becomes directionally insolvent; utilization is capped and withdrawals cooldown
          when the pool is heavily used.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">Fees</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li><span className="num text-foreground">1%</span> open fee on position size</li>
          <li><span className="num text-foreground">1%</span> close fee on position size</li>
          <li><span className="num text-foreground">~0.006–0.014%/hr</span> borrowing fee, charged every hour a position stays open — it scales with pool utilization</li>
          <li><span className="num text-foreground">0.5%</span> exit fee on LP withdrawals</li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Fees go to LPs. Holding a losing position costs more the longer you hold it.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">Risks</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li><span className="text-foreground">Liquidation.</span> Leveraged positions close automatically near their liquidation price. At 10x, a ~9.5% move against you is enough.</li>
          <li><span className="text-foreground">Oracle.</span> Thin tokens rely on PancakeSwap routes; prices can lag or the oracle can halt trading mid-position.</li>
          <li><span className="text-foreground">Pool.</span> Large wins are paid from pool liquidity. When utilization is high, opening may be limited and withdrawals cooldown.</li>
          <li><span className="text-foreground">LP.</span> Providing liquidity is not risk-free: a run of winning traders can reduce LP value, and share price can fall.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold">FAQ</h2>
        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="q1" className="border-border">
            <AccordionTrigger className="text-[13px]">Which tokens can I trade?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Any BEP-20 token with at least 50 BNB of PancakeSwap liquidity. Paste the contract
              address on the trade page. Tokens below that threshold are not supported because the
              oracle price would be too easy to manipulate.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2" className="border-border">
            <AccordionTrigger className="text-[13px]">What leverage is available?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              2x, 5x and 10x. Higher tiers unlock as the pool grows: 5x needs a 100 BNB pool, 10x
              needs 200 BNB. Leverage multiplies both profit and loss, and liquidation gets closer:
              roughly 47.5% at 2x, 19% at 5x, 9.5% at 10x.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3" className="border-border">
            <AccordionTrigger className="text-[13px]">How fast can I close a position?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Positions must be held at least 60 seconds. After that you can close at any time at
              the current oracle price.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4" className="border-border">
            <AccordionTrigger className="text-[13px]">What is one-click trading?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              An opt-in session that fires trades instantly with your saved defaults, capped by a
              total budget and a max-per-trade amount. It expires automatically after at most 24
              hours, and you can revoke it at any time.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5" className="border-border">
            <AccordionTrigger className="text-[13px]">Can I lose more than I deposit?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              No. Your max loss per position is the collateral you posted — the position is closed at
              liquidation before it goes negative. LPs can see share price fall, but withdrawals are
              always proportional to shares.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}

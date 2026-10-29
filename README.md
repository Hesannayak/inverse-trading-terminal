# Inverse Trading Terminal

Build the frontend UI for "inverse" — a Hyperliquid-styled leveraged trading terminal for BNB Chain where users long or short ANY token by pasting its contract address. Trades execute against a liquidity pool (NOT an order book — do not build an order book). Vite + React + TypeScript + shadcn/ui + Tailwind.

IMPORTANT ARCHITECTURE RULE:
All data must come from a typed service layer in src/services/ with these mock functions returning realistic fake data (I will replace them with live implementations later — do not import anything blockchain-related, do not add wallet libraries, do not add websocket code):
  getMarkets(), getMarket(token), getOracleStatus(token), previewOpen({token,isLong,leverage,amountBnb}),
  getPositions(address), getHistory(address), getTape(), getLeaderboard(), getPool(),
  openPosition(params), closePosition(id), setTpSl(id,tp,sl), depositPool(amount), withdrawPool(shares),
  createSession(params), revokeSession(), getWallet()  // returns {address, bnbBalance, connected}
Put a single "Connect Wallet" button in the navbar that calls a stub connectWallet() and flips getWallet().connected. Use TanStack Query for all reads with refetch intervals: prices 5s, positions 10s, tape 3s, pool 30s. Use Zustand for: selected token, side, leverage, amount, one-click mode.

DESIGN SYSTEM:
Dark only. bg #0a0a0f, cards #111118, borders 1px #1a1a2e, text #e6e6f0, muted #7a7a8c.
Long/profit #00ff88, short/loss #ff3366, warning #ffb020. Inter for UI, JetBrains Mono for all numbers. Sharp corners (no border radius > 2px). Dense Hyperliquid-like layout, full-width on the trade page, no marketing fluff. All numeric cells right-aligned, monospace, 4–6 significant digits for prices, "+" prefix on gains.

NAVBAR: wordmark "inverse" (lowercase, bold) · tabs Trade | Markets | Portfolio | Pool | How · BNB Chain pill · wallet button showing truncated address + BNB balance when connected.

PAGE /trade and /trade/:token — three columns on desktop (25% / 50% / 25%):
LEFT: large input "Paste any BEP-20 contract address…" with Paste and Go buttons. Token card: name, symbol, price (BNB and USD), 24h change, "PancakeSwap liquidity: X BNB", oracle route badge (V2/V3), Long OI vs Short OI bar. Price chart (Lightweight Charts) with 1H/4H/1D/1W tabs. Oracle status banner driven by getOracleStatus(): if warming → amber banner "Oracle warming — ready in M:SS" with countdown; if unsupported → red banner "Not supported: pool below 50 BNB liquidity"; if halted → red "Trading halted for this token".
CENTER: Order panel. LONG / SHORT as two equal 48px buttons (filled when active, outline otherwise; panel border tints green or red to match). Leverage 2x / 5x / 10x segmented buttons with hover tooltips "liquidates at ~47.5% / ~19% / ~9.5% move"; disabled state when leverage not yet enabled (show "unlocks at 200 BNB pool"). Amount input in BNB with MAX, shows wallet balance. Info rows from previewOpen(): Entry price · Liquidation price · Max profit (BNB and %) · Open fee 1% · Borrowing fee %/hr · Holding period "min 60s". P&L simulator slider −50%…+50% showing projected BNB result. Collapsible TP/SL inputs. Full-width 52px submit "Open Long"/"Open Short" with loading state. Bottom: "⚡ One-click trading" switch → modal (budget BNB, max per trade, duration ≤ 24h, Create). Below panel: positions table for this token — Side | Lev | Size | Entry | Mark | PnL (colored, live) | Liq | Fees | [Close] [TP/SL]. Empty state "No open positions".
RIGHT: Trade tape — compact 32px rows, newest on top, slide-in animation, auto-scroll that pauses when user scrolls up with a "↓ new trades" pill. Row: symbol · "long 2x"/"short 10x" colored · size · PnL if closed · relative time updating live. Left 2px border green/red. Liquidations: red 10% background + "LIQUIDATED". Below: Top trades (rank, token, side+lev, PnL BNB, PnL %, 0x12…ab).

PAGE /markets: sortable table Token | Price | 24h | Volume 24h | Long OI | Short OI | Liquidity | Oracle | [Trade]. Search by name/symbol/address. Row click → /trade/:token.

PAGE /portfolio: summary cards (PnL all/24h/7d, volume, win rate, open count). Open positions table across all tokens with Close and TP/SL. Paginated history table with expandable fee breakdown.

PAGE /pool: stat cards TVL · APY (7d) · Utilization (green <50 / amber 50–80 / red >80) · Your shares · Your value. Deposit/Withdraw tabs; withdraw shows cooldown timer and exit fee from getPool(); amber warning when utilization > 80% explaining 72h cooldown. Share-price chart with toggles TVL / fees / utilization. Recent pool events table.

PAGE /how: centered max-w-3xl. Sections: Short any coin · How the pool model works (simple diagram) · Fees (1% in, 1% out, hourly borrowing fee) · Risks (liquidation, oracle, pool, LP) · FAQ accordion. Honest tone, no hype.

MOBILE (<768px): single column; sticky bottom tabs Trade/Markets/Portfolio/Pool; on trade page order panel first, then 200px chart, then positions; tape in a bottom sheet "Live feed"; tables horizontally scroll with sticky first column.

Do not add: light mode, social links, token/airdrop pages, order book, chart indicators, any blockchain or wallet library.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6169ad1e-7736-44e5-b171-ec3f818ebe3d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

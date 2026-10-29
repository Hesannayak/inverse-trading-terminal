// Types for the inverse trading terminal. All data flows through
// src/services — components never touch anything blockchain-related.

export type Side = "long" | "short";

export type Leverage = 2 | 5 | 10;

export type OracleRoute = "V2" | "V3";

export type Timeframe = "1H" | "4H" | "1D" | "1W";

export interface Market {
  /** BEP-20 contract address (also the stable token id used in routes) */
  token: string;
  name: string;
  symbol: string;
  priceUsd: number;
  priceBnb: number;
  change24hPct: number;
  volume24hBnb: number;
  longOiBnb: number;
  shortOiBnb: number;
  liquidityBnb: number;
  oracleRoute: OracleRoute;
}

export interface Candle {
  /** unix seconds */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type OracleState = "ok" | "warming" | "unsupported" | "halted";

export interface OracleStatus {
  state: OracleState;
  /** seconds until the oracle is ready (warming state only) */
  readyInSeconds: number;
  message?: string;
}

export interface OpenPreview {
  token: string;
  isLong: boolean;
  leverage: number;
  amountBnb: number;
  sizeBnb: number;
  entryPriceBnb: number;
  entryPriceUsd: number;
  liquidationPriceBnb: number;
  maxProfitBnb: number;
  maxProfitPct: number;
  openFeePct: number;
  borrowingFeePctPerHour: number;
  minHoldSeconds: number;
}

export interface Position {
  id: string;
  token: string;
  symbol: string;
  side: Side;
  leverage: Leverage;
  sizeBnb: number;
  entryPriceBnb: number;
  markPriceBnb: number;
  pnlBnb: number;
  liquidationPriceBnb: number;
  feesBnb: number;
  tpBnb: number | null;
  slBnb: number | null;
  openedAt: number;
}

export interface HistoryFees {
  openFeeBnb: number;
  closeFeeBnb: number;
  borrowingFeeBnb: number;
  totalBnb: number;
}

export interface HistoryEntry {
  id: string;
  token: string;
  symbol: string;
  side: Side;
  leverage: Leverage;
  sizeBnb: number;
  entryPriceBnb: number;
  exitPriceBnb: number;
  pnlBnb: number;
  pnlPct: number;
  closedAt: number;
  fees: HistoryFees;
}

export interface TapeEntry {
  id: string;
  symbol: string;
  side: Side;
  leverage: number;
  sizeBnb: number;
  /** present only on closed trades */
  pnlBnb: number | null;
  liquidated: boolean;
  ts: number;
}

export interface TopTrade {
  rank: number;
  token: string;
  symbol: string;
  side: Side;
  leverage: number;
  pnlBnb: number;
  pnlPct: number;
  address: string;
}

export interface PoolEvent {
  id: string;
  kind: "deposit" | "withdraw" | "borrow_fee" | "liquidation";
  amountBnb: number;
  shares?: number;
  address: string;
  ts: number;
}

export interface PoolSeriesPoint {
  ts: number;
  tvlBnb: number;
  feesBnb: number;
  utilizationPct: number;
  sharePrice: number;
}

export interface PoolStats {
  tvlBnb: number;
  apy7dPct: number;
  utilizationPct: number;
  yourShares: number;
  yourValueBnb: number;
  sharePrice: number;
  /** seconds left on your withdrawal cooldown (0 = none) */
  cooldownSecondsRemaining: number;
  exitFeePct: number;
  /** minimum pool TVL (BNB) required to enable each leverage tier */
  leverageTiers: Record<number, number>;
  series: PoolSeriesPoint[];
  events: PoolEvent[];
}

export interface OneClickSession {
  id: string;
  budgetBnb: number;
  maxPerTradeBnb: number;
  durationHours: number;
  createdAt: number;
  expiresAt: number;
}

export interface Wallet {
  address: string | null;
  bnbBalance: number;
  connected: boolean;
}

export interface OpenPositionParams {
  token: string;
  isLong: boolean;
  leverage: number;
  amountBnb: number;
  tpBnb?: number | null;
  slBnb?: number | null;
}

export interface OneClickSessionParams {
  budgetBnb: number;
  maxPerTradeBnb: number;
  durationHours: number;
}

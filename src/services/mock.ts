// Mock implementations of the inverse service layer.
// Every function here is intentionally fake and deterministic-ish per session.
// Replace file-by-file with live implementations later — the types are the contract.

import type {
  Candle,
  HistoryEntry,
  Market,
  OneClickSession,
  OneClickSessionParams,
  OpenPositionParams,
  OpenPreview,
  OracleStatus,
  PoolEvent,
  PoolSeriesPoint,
  PoolStats,
  Position,
  Side,
  TapeEntry,
  Timeframe,
  TopTrade,
  Wallet,
} from "./types";

// ---------------------------------------------------------------- utilities

function rnd(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function drift(v: number, vol: number): number {
  return v * (1 + (Math.random() - 0.5) * 2 * vol);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fakeAddress(seed: number): string {
  const hex = "0123456789abcdef";
  const r = mulberry(seed);
  let out = "0x";
  for (let i = 0; i < 40; i++) out += hex[Math.floor(r() * 16)];
  return out;
}

// ---------------------------------------------------------------- tokens

interface TokenSpec {
  address: string;
  name: string;
  symbol: string;
  basePriceUsd: number;
  liquidityBnb: number;
  oracleRoute: "V2" | "V3";
}

const TOKENS: TokenSpec[] = [
  { address: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82", name: "PancakeSwap", symbol: "CAKE", basePriceUsd: 2.41, liquidityBnb: 4820, oracleRoute: "V3" },
  { address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", name: "Wrapped BNB", symbol: "WBNB", basePriceUsd: 642.18, liquidityBnb: 15400, oracleRoute: "V3" },
  { address: "0xfb5b838b6cfee66271f75963f5e6a6e9ad8e5a5e", name: "Floki", symbol: "FLOKI", basePriceUsd: 0.00019312, liquidityBnb: 918, oracleRoute: "V2" },
  { address: "0x2170ed0880ac9a755fd29b2688956bd9599336b5", name: "Ethereum (BSC)", symbol: "ETH", basePriceUsd: 3184.5, liquidityBnb: 6200, oracleRoute: "V3" },
  { address: "0x7130d2a67b1b4a5a06d1a45d0c7d1c1d1a1a1a1a", name: "Bitcoin (BSC)", symbol: "BTCB", basePriceUsd: 67420, liquidityBnb: 7300, oracleRoute: "V3" },
  { address: "0x4bd1700310d2ee40095a395cf10e17a4a4a4a4a4", name: "Trust Wallet", symbol: "TWT", basePriceUsd: 1.083, liquidityBnb: 342, oracleRoute: "V2" },
  { address: "0x8f0f8f0f8f0f8f0f8f0f8f0f8f0f8f0f8f0f8f0f", name: "Alpaca Finance", symbol: "ALPACA", basePriceUsd: 0.1482, liquidityBnb: 96.4, oracleRoute: "V2" },
  { address: "0xa2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2", name: "BabySwap", symbol: "BABY", basePriceUsd: 0.03121, liquidityBnb: 38.2, oracleRoute: "V2" },
  { address: "0xc1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1", name: "SafeStar", symbol: "SSTAR", basePriceUsd: 0.00000421, liquidityBnb: 21.7, oracleRoute: "V2" },
];

const SYNONYMS_A = ["Mega", "Hyper", "Quantum", "Turbo", "Cyber", "Astro", "Neon", "Prime", "Ultra", "Meta"];
const SYNONYMS_B = ["Doge", "Pepe", "Cat", "Ape", "Moon", "Rocket", "Chain", "Gem", "Bot", "Fi"];

interface TokenState {
  spec: TokenSpec;
  priceUsd: number;
  refUsd: number; // 24h reference price
  volume24hBnb: number;
  longOiBnb: number;
  shortOiBnb: number;
  warmingReadyAt: number;
}

const bnbPriceUsdState = { v: 642.18 };

const tokenStates = new Map<string, TokenState>();

function getState(spec: TokenSpec, seedSalt = 0): TokenState {
  const seed = hash(spec.address) + seedSalt;
  const r = mulberry(seed);
  const priceUsd = spec.basePriceUsd * (1 + (r() - 0.5) * 0.04);
  const longOi = spec.liquidityBnb * rnd(0.1, 0.9);
  return {
    spec,
    priceUsd,
    refUsd: priceUsd * (1 + (r() - 0.5) * 0.12),
    volume24hBnb: spec.liquidityBnb * rnd(0.5, 4),
    longOiBnb: longOi,
    shortOiBnb: spec.liquidityBnb * rnd(0.1, 0.9),
    warmingReadyAt: Date.now() + rnd(25, 95) * 1000,
  };
}

function specForAddress(address: string): TokenSpec {
  const known = TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase());
  if (known) return known;
  const h = hash(address.toLowerCase());
  const r = mulberry(h);
  const name = `${SYNONYMS_A[h % SYNONYMS_A.length]}${SYNONYMS_B[(h >> 4) % SYNONYMS_B.length]}`;
  const symbol = (name.slice(0, 2) + SYNONYMS_B[(h >> 8) % SYNONYMS_B.length].slice(0, 2)).toUpperCase();
  const liquidity = 15 + r() * 3000;
  return {
    address,
    name,
    symbol,
    basePriceUsd:
      r() < 0.3 ? rnd(0.000001, 0.001) : r() < 0.7 ? rnd(0.01, 5) : rnd(5, 900),
    liquidityBnb: liquidity,
    oracleRoute: liquidity > 500 ? "V3" : "V2",
  };
}

function advance(ts: TokenState) {
  const r = mulberry(hash(ts.spec.address) + Math.floor(Date.now() / 2000));
  ts.priceUsd = drift(ts.priceUsd, 0.0015);
  ts.refUsd = drift(ts.refUsd, 0.0004);
  ts.volume24hBnb = drift(ts.volume24hBnb, 0.01);
  ts.longOiBnb = drift(ts.longOiBnb, 0.02);
  ts.shortOiBnb = drift(ts.shortOiBnb, 0.02);
  bnbPriceUsdState.v = drift(bnbPriceUsdState.v, 0.0008);
  void r;
}

function marketOf(ts: TokenState): Market {
  advance(ts);
  return {
    token: ts.spec.address,
    name: ts.spec.name,
    symbol: ts.spec.symbol,
    priceUsd: ts.priceUsd,
    priceBnb: ts.priceUsd / bnbPriceUsdState.v,
    change24hPct: (ts.priceUsd / ts.refUsd - 1) * 100,
    volume24hBnb: ts.volume24hBnb,
    longOiBnb: ts.longOiBnb,
    shortOiBnb: ts.shortOiBnb,
    liquidityBnb: ts.spec.liquidityBnb,
    oracleRoute: ts.spec.oracleRoute,
  };
}

function stateFor(token: string): TokenState {
  const key = token.toLowerCase();
  let ts = tokenStates.get(key);
  if (!ts) {
    ts = getState(specForAddress(token));
    tokenStates.set(key, ts);
  }
  return ts;
}

// ---------------------------------------------------------------- markets

export async function getMarkets(): Promise<Market[]> {
  return TOKENS.map((t) => marketOf(stateFor(t.address)));
}

export async function getMarket(token: string): Promise<Market> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(token)) throw new Error("Not a valid BEP-20 contract address");
  return marketOf(stateFor(token));
}

// ---------------------------------------------------------------- candles

const TF_SECONDS: Record<Timeframe, number> = { "1H": 60, "4H": 240, "1D": 900, "1W": 3600 };

export async function getCandles(token: string, tf: Timeframe): Promise<Candle[]> {
  const ts = stateFor(token);
  const priceBnb = ts.priceUsd / bnbPriceUsdState.v;
  const step = TF_SECONDS[tf];
  const r = mulberry(hash(token + tf));
  const count = 160;
  const now = Math.floor(Date.now() / 1000);
  // random walk backwards from the live price
  const closes: number[] = [priceBnb];
  for (let i = 1; i < count; i++) {
    const prev = closes[closes.length - 1] * (1 + (r() - 0.5) * 0.012);
    closes.push(Math.max(prev, priceBnb * 0.4));
  }
  closes.reverse();
  const out: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const c = closes[i];
    const o = i === 0 ? c * (1 - (r() - 0.5) * 0.01) : closes[i - 1];
    const hi = Math.max(o, c) * (1 + r() * 0.006);
    const lo = Math.min(o, c) * (1 - r() * 0.006);
    out.push({ time: now - (count - 1 - i) * step, open: o, high: hi, low: lo, close: c });
  }
  return out;
}

// ---------------------------------------------------------------- oracle

export async function getOracleStatus(token: string): Promise<OracleStatus> {
  const ts = stateFor(token);
  if (ts.spec.liquidityBnb < 50) {
    return { state: "unsupported", readyInSeconds: 0, message: "Not supported: pool below 50 BNB liquidity" };
  }
  const h = hash(token);
  if (h % 11 === 0) {
    return { state: "halted", readyInSeconds: 0, message: "Trading halted for this token" };
  }
  const remaining = (ts.warmingReadyAt - Date.now()) / 1000;
  if (remaining > 0) {
    return { state: "warming", readyInSeconds: Math.ceil(remaining) };
  }
  return { state: "ok", readyInSeconds: 0 };
}

// ---------------------------------------------------------------- preview

export async function previewOpen(params: {
  token: string;
  isLong: boolean;
  leverage: number;
  amountBnb: number;
}): Promise<OpenPreview> {
  const ts = stateFor(params.token);
  const entryBnb = ts.priceUsd / bnbPriceUsdState.v;
  const size = params.amountBnb * params.leverage;
  // liquidation when the position loses ~95% of margin
  const liqMove = 0.95 / params.leverage;
  const liqPrice = params.isLong ? entryBnb * (1 - liqMove) : entryBnb * (1 + liqMove);
  // longs cap at the +47.5%·lev move; shorts cap when price → 0
  const maxMovePct = params.isLong ? liqMove * 100 : 100;
  const maxProfitBnb = params.amountBnb * params.leverage * (maxMovePct / 100);
  const borrowFee = 0.006 + (hash(params.token) % 8) * 0.001;
  return {
    token: params.token,
    isLong: params.isLong,
    leverage: params.leverage,
    amountBnb: params.amountBnb,
    sizeBnb: size,
    entryPriceBnb: entryBnb,
    entryPriceUsd: ts.priceUsd,
    liquidationPriceBnb: liqPrice,
    maxProfitBnb,
    maxProfitPct: maxMovePct * params.leverage,
    openFeePct: 1,
    borrowingFeePctPerHour: borrowFee,
    minHoldSeconds: 60,
  };
}

// ---------------------------------------------------------------- positions & history

const DEMO_POSITIONS: Position[] = [];
const DEMO_HISTORY: HistoryEntry[] = [];
let posSeq = 1;

function seedDemoBook() {
  if (DEMO_POSITIONS.length || DEMO_HISTORY.length) return;
  const seeds: Array<[string, Side, 2 | 5 | 10, number, number]> = [
    [TOKENS[0].address, "long", 5, 1.2, -2],
    [TOKENS[2].address, "short", 2, 0.8, -6],
    [TOKENS[3].address, "long", 10, 0.35, -1],
  ];
  for (const [addr, side, lev, amount, minutesAgo] of seeds) {
    const spec = specForAddress(addr);
    const ts = stateFor(addr);
    const entry = (ts.priceUsd / bnbPriceUsdState.v) * (1 + (Math.random() - 0.5) * 0.02);
    const mark = ts.priceUsd / bnbPriceUsdState.v;
    const size = amount * lev;
    const pnl = side === "long" ? size * (mark / entry - 1) : size * (entry / mark - 1);
    DEMO_POSITIONS.push({
      id: `pos-${posSeq++}`,
      token: addr,
      symbol: spec.symbol,
      side,
      leverage: lev,
      sizeBnb: size,
      entryPriceBnb: entry,
      markPriceBnb: mark,
      pnlBnb: pnl,
      liquidationPriceBnb: side === "long" ? entry * (1 - 0.95 / lev) : entry * (1 + 0.95 / lev),
      feesBnb: size * 0.01,
      tpBnb: null,
      slBnb: null,
      openedAt: Date.now() + minutesAgo * 60_000,
    });
  }
  const histSeeds: Array<[string, Side, 2 | 5 | 10, number, number, number]> = [
    [TOKENS[1].address, "long", 2, 0.5, 4.2, -26],
    [TOKENS[0].address, "short", 5, 0.3, -12.8, -74],
    [TOKENS[2].address, "long", 10, 0.9, 61.3, -120],
    [TOKENS[4].address, "long", 5, 0.4, -7.1, -190],
    [TOKENS[3].address, "short", 2, 1.1, 2.6, -300],
    [TOKENS[0].address, "long", 2, 0.7, 9.4, -420],
    [TOKENS[5].address, "short", 10, 0.25, -31.5, -520],
    [TOKENS[1].address, "long", 5, 0.6, 15.2, -700],
  ];
  histSeeds.forEach(([addr, side, lev, amount, pnlPct, minutesAgo], i) => {
    const spec = specForAddress(addr);
    const size = amount * lev;
    const entry = spec.basePriceUsd / 642;
    const exit = side === "long" ? entry * (1 + pnlPct / 100 / lev) : entry * (1 - pnlPct / 100 / lev);
    const openFee = size * 0.01;
    const closeFee = size * 0.01;
    const borrowing = size * 0.00008 * (minutesAgo / -60);
    DEMO_HISTORY.push({
      id: `hist-${i + 1}`,
      token: addr,
      symbol: spec.symbol,
      side,
      leverage: lev,
      sizeBnb: size,
      entryPriceBnb: entry,
      exitPriceBnb: exit,
      pnlBnb: (pnlPct / 100) * amount,
      pnlPct,
      closedAt: Date.now() + minutesAgo * 60_000,
      fees: {
        openFeeBnb: openFee,
        closeFeeBnb: closeFee,
        borrowingFeeBnb: borrowing,
        totalBnb: openFee + closeFee + borrowing,
      },
    });
  });
}

export async function getPositions(_address: string | null): Promise<Position[]> {
  seedDemoBook();
  for (const p of DEMO_POSITIONS) {
    const ts = stateFor(p.token);
    const mark = ts.priceUsd / bnbPriceUsdState.v;
    p.markPriceBnb = mark;
    p.pnlBnb =
      p.side === "long"
        ? p.sizeBnb * (mark / p.entryPriceBnb - 1)
        : p.sizeBnb * (p.entryPriceBnb / mark - 1);
  }
  return [...DEMO_POSITIONS];
}

export async function getHistory(_address: string | null): Promise<HistoryEntry[]> {
  seedDemoBook();
  return [...DEMO_HISTORY].sort((a, b) => b.closedAt - a.closedAt);
}

export async function openPosition(params: OpenPositionParams): Promise<{ id: string }> {
  seedDemoBook();
  const ts = stateFor(params.token);
  const spec = specForAddress(params.token);
  const entry = ts.priceUsd / bnbPriceUsdState.v;
  const size = params.amountBnb * params.leverage;
  const id = `pos-${posSeq++}`;
  DEMO_POSITIONS.push({
    id,
    token: params.token,
    symbol: spec.symbol,
    side: params.isLong ? "long" : "short",
    leverage: params.leverage as 2 | 5 | 10,
    sizeBnb: size,
    entryPriceBnb: entry,
    markPriceBnb: entry,
    pnlBnb: 0,
    liquidationPriceBnb: params.isLong ? entry * (1 - 0.95 / params.leverage) : entry * (1 + 0.95 / params.leverage),
    feesBnb: size * 0.01,
    tpBnb: params.tpBnb ?? null,
    slBnb: params.slBnb ?? null,
    openedAt: Date.now(),
  });
  pushTape({ symbol: spec.symbol, side: params.isLong ? "long" : "short", leverage: params.leverage, sizeBnb: size, pnlBnb: null, liquidated: false });
  return { id };
}

export async function closePosition(id: string): Promise<{ pnlBnb: number }> {
  seedDemoBook();
  const idx = DEMO_POSITIONS.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Position not found");
  const p = DEMO_POSITIONS[idx];
  const ts = stateFor(p.token);
  const mark = ts.priceUsd / bnbPriceUsdState.v;
  const pnl =
    p.side === "long" ? p.sizeBnb * (mark / p.entryPriceBnb - 1) : p.sizeBnb * (p.entryPriceBnb / mark - 1);
  DEMO_POSITIONS.splice(idx, 1);
  DEMO_HISTORY.unshift({
    id: `hist-${Date.now()}`,
    token: p.token,
    symbol: p.symbol,
    side: p.side,
    leverage: p.leverage,
    sizeBnb: p.sizeBnb,
    entryPriceBnb: p.entryPriceBnb,
    exitPriceBnb: mark,
    pnlBnb: pnl,
    pnlPct: (pnl / (p.sizeBnb / p.leverage)) * 100,
    closedAt: Date.now(),
    fees: {
      openFeeBnb: p.feesBnb,
      closeFeeBnb: p.sizeBnb * 0.01,
      borrowingFeeBnb: p.feesBnb * 0.2,
      totalBnb: p.feesBnb + p.sizeBnb * 0.01 + p.feesBnb * 0.2,
    },
  });
  pushTape({ symbol: p.symbol, side: p.side, leverage: p.leverage, sizeBnb: p.sizeBnb, pnlBnb: pnl, liquidated: false });
  return { pnlBnb: pnl };
}

export async function setTpSl(id: string, tp: number | null, sl: number | null): Promise<void> {
  seedDemoBook();
  const p = DEMO_POSITIONS.find((x) => x.id === id);
  if (!p) throw new Error("Position not found");
  p.tpBnb = tp;
  p.slBnb = sl;
}

// ---------------------------------------------------------------- tape & leaderboard

const TAPE: TapeEntry[] = [];
let tapeSeq = 1;

function pushTape(e: Omit<TapeEntry, "id" | "ts">) {
  TAPE.unshift({ ...e, id: `tape-${tapeSeq++}`, ts: Date.now() });
  if (TAPE.length > 60) TAPE.length = 60;
}

function randomTapeEntry(): TapeEntry {
  const spec = TOKENS[Math.floor(Math.random() * TOKENS.length)];
  const side: Side = Math.random() < 0.5 ? "long" : "short";
  const leverage = [2, 5, 10, 10, 5, 2, 10][Math.floor(Math.random() * 7)];
  const size = Math.pow(10, rnd(-0.7, 1.2));
  const liquidated = Math.random() < 0.07;
  const closed = !liquidated && Math.random() < 0.4;
  return {
    id: `tape-${tapeSeq++}`,
    symbol: spec.symbol,
    side,
    leverage,
    sizeBnb: size,
    pnlBnb: closed ? (side === "long" ? 1 : -1) * rnd(0.001, 12) : null,
    liquidated,
    ts: Date.now() - Math.floor(Math.random() * 2000),
  };
}

export async function getTape(): Promise<TapeEntry[]> {
  if (!TAPE.length) {
    for (let i = 0; i < 40; i++) {
      const e = randomTapeEntry();
      e.ts = Date.now() - i * rnd(4000, 30000);
      TAPE.push(e);
    }
  } else {
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const e = randomTapeEntry();
      e.ts = Date.now();
      TAPE.unshift(e);
    }
    if (TAPE.length > 60) TAPE.length = 60;
  }
  return [...TAPE];
}

const LEADERBOARD: TopTrade[] = [];

function seedLeaderboard() {
  if (LEADERBOARD.length) return;
  const rows = Array.from({ length: 10 }, (_, i) => {
    const spec = TOKENS[(hash(`lb${i}`) + i) % TOKENS.length];
    const side: Side = i % 3 === 0 ? "short" : "long";
    const leverage = [10, 10, 5, 10, 2, 5, 10, 5, 2, 10][i];
    const pnlBnb = rnd(8, 96) * (1 - i * 0.08);
    return {
      rank: i + 1,
      token: spec.address,
      symbol: spec.symbol,
      side,
      leverage,
      pnlBnb,
      pnlPct: rnd(40, 420),
      address: fakeAddress(hash(`trader${i}`)),
    };
  });
  LEADERBOARD.push(...rows.sort((a, b) => b.pnlBnb - a.pnlBnb).map((r, i) => ({ ...r, rank: i + 1 })));
}

export async function getLeaderboard(): Promise<TopTrade[]> {
  seedLeaderboard();
  return [...LEADERBOARD];
}

// ---------------------------------------------------------------- pool

const poolState = {
  tvlBnb: 145.62,
  utilizationPct: 47.3,
  apy7dPct: 11.84,
  yourShares: 0,
  sharePrice: 1.0342,
  fees7dBnb: 3.94,
  cooldownUntil: 0,
  exitFeePct: 0.5,
  events: [] as PoolEvent[],
};

export async function getPool(): Promise<PoolStats> {
  poolState.utilizationPct = drift(poolState.utilizationPct, 0.01);
  const leverageTiers: Record<number, number> = { 2: 50, 5: 100, 10: 200 };
  const series: PoolSeriesPoint[] = [];
  const r = mulberry(4242);
  const hours = 168;
  const now = Math.floor(Date.now() / 1000);
  let tvl = poolState.tvlBnb * 0.82;
  let sp = poolState.sharePrice * 0.94;
  for (let i = hours; i >= 0; i--) {
    tvl = tvl * (1 + (r() - 0.45) * 0.01);
    sp = sp * (1 + (r() - 0.4) * 0.002);
    series.push({
      ts: now - i * 3600,
      tvlBnb: tvl,
      feesBnb: poolState.fees7dBnb * (0.5 + r()) / 3,
      utilizationPct: 30 + r() * 45,
      sharePrice: sp,
    });
  }
  const events: PoolEvent[] = poolState.events.length
    ? [...poolState.events]
    : Array.from({ length: 8 }, (_, i) => {
        const kinds: PoolEvent["kind"][] = ["deposit", "borrow_fee", "withdraw", "deposit", "liquidation", "borrow_fee", "deposit", "withdraw"];
        const kind = kinds[i];
        return {
          id: `ev-${i}`,
          kind,
          amountBnb: kind === "borrow_fee" ? rnd(0.02, 0.4) : rnd(0.5, 22),
          shares: kind === "deposit" || kind === "withdraw" ? rnd(0.5, 20) : undefined,
          address: fakeAddress(hash(`pooler${i}`)),
          ts: Date.now() - (i + 1) * rnd(1800_000, 14_400_000),
        };
      });
  poolState.events = events;
  return {
    tvlBnb: poolState.tvlBnb,
    apy7dPct: poolState.apy7dPct,
    utilizationPct: poolState.utilizationPct,
    yourShares: poolState.yourShares,
    yourValueBnb: poolState.yourShares * poolState.sharePrice,
    sharePrice: poolState.sharePrice,
    cooldownSecondsRemaining: Math.max(0, Math.round((poolState.cooldownUntil - Date.now()) / 1000)),
    exitFeePct: poolState.exitFeePct,
    leverageTiers,
    series,
    events,
  };
}

export async function depositPool(amountBnb: number): Promise<void> {
  const shares = amountBnb / poolState.sharePrice;
  poolState.yourShares += shares;
  poolState.tvlBnb += amountBnb;
  poolState.events.unshift({
    id: `ev-${Date.now()}`,
    kind: "deposit",
    amountBnb,
    shares,
    address: wallet.address ?? "0x0000…0000",
    ts: Date.now(),
  });
}

export async function withdrawPool(shares: number): Promise<void> {
  if (poolState.yourShares < shares) throw new Error("Not enough shares");
  const amount = shares * poolState.sharePrice;
  poolState.yourShares -= shares;
  poolState.tvlBnb -= amount;
  // demo the cooldown behaviour
  poolState.cooldownUntil = Date.now() + 3600 * 1000;
  poolState.events.unshift({
    id: `ev-${Date.now()}`,
    kind: "withdraw",
    amountBnb: amount,
    shares,
    address: wallet.address ?? "0x0000…0000",
    ts: Date.now(),
  });
}

// ---------------------------------------------------------------- wallet & one-click

const wallet: Wallet = { address: null, bnbBalance: 0, connected: false };

export async function getWallet(): Promise<Wallet> {
  return { ...wallet };
}

export async function connectWallet(): Promise<Wallet> {
  wallet.connected = true;
  wallet.address = fakeAddress(910199);
  wallet.bnbBalance = 4.8217;
  return { ...wallet };
}

let oneClickSession: OneClickSession | null = null;

export async function createSession(params: OneClickSessionParams): Promise<OneClickSession> {
  oneClickSession = {
    id: `oc-${Date.now()}`,
    budgetBnb: params.budgetBnb,
    maxPerTradeBnb: params.maxPerTradeBnb,
    durationHours: params.durationHours,
    createdAt: Date.now(),
    expiresAt: Date.now() + params.durationHours * 3600_000,
  };
  return { ...oneClickSession };
}

export async function getSession(): Promise<OneClickSession | null> {
  if (oneClickSession && oneClickSession.expiresAt < Date.now()) {
    oneClickSession = null;
  }
  return oneClickSession ? { ...oneClickSession } : null;
}

export async function revokeSession(): Promise<void> {
  oneClickSession = null;
}

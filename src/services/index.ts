// Public service layer. Components import only from here (plus types).
// Mock today — swap to live implementations later without touching the UI.

export * from "./types";
export {
  getMarkets,
  getMarket,
  getCandles,
  getOracleStatus,
  previewOpen,
  getPositions,
  getHistory,
  openPosition,
  closePosition,
  setTpSl,
  getTape,
  getLeaderboard,
  getPool,
  depositPool,
  withdrawPool,
  getWallet,
  connectWallet,
  createSession,
  getSession,
  revokeSession,
} from "./mock";

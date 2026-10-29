import { queryOptions } from "@tanstack/react-query";
import * as svc from "@/services";
import type { Side, Timeframe } from "@/services/types";
import { useTradeStore } from "@/store/trade-store";

/** prices & markets refresh every 5s */
export const marketsQuery = () =>
  queryOptions({
    queryKey: ["markets"],
    queryFn: svc.getMarkets,
    refetchInterval: 5000,
  });

export const marketQuery = (token: string | null) =>
  queryOptions({
    queryKey: ["market", token],
    queryFn: () => svc.getMarket(token as string),
    enabled: !!token,
    refetchInterval: 5000,
    retry: false,
  });

export const candlesQuery = (token: string, tf: Timeframe) =>
  queryOptions({
    queryKey: ["candles", token, tf],
    queryFn: () => svc.getCandles(token, tf),
    enabled: !!token,
    refetchInterval: 5000,
  });

export const oracleQuery = (token: string | null) =>
  queryOptions({
    queryKey: ["oracle", token],
    queryFn: () => svc.getOracleStatus(token as string),
    enabled: !!token,
    refetchInterval: 5000,
  });

export const previewQuery = (params: {
  token: string | null;
  isLong: boolean;
  leverage: number;
  amountBnb: number;
}) =>
  queryOptions({
    queryKey: ["preview", params.token, params.isLong, params.leverage, params.amountBnb],
    queryFn: () =>
      svc.previewOpen({
        token: params.token as string,
        isLong: params.isLong,
        leverage: params.leverage,
        amountBnb: params.amountBnb,
      }),
    enabled: !!params.token && params.amountBnb > 0,
    refetchInterval: 5000,
  });

/** positions refresh every 10s */
export const positionsQuery = (address: string | null) =>
  queryOptions({
    queryKey: ["positions", address],
    queryFn: () => svc.getPositions(address),
    refetchInterval: 10000,
  });

export const historyQuery = (address: string | null) =>
  queryOptions({
    queryKey: ["history", address],
    queryFn: () => svc.getHistory(address),
  });

/** tape refreshes every 3s */
export const tapeQuery = () =>
  queryOptions({
    queryKey: ["tape"],
    queryFn: svc.getTape,
    refetchInterval: 3000,
  });

export const leaderboardQuery = () =>
  queryOptions({
    queryKey: ["leaderboard"],
    queryFn: svc.getLeaderboard,
    refetchInterval: 10000,
  });

/** pool refreshes every 30s */
export const poolQuery = () =>
  queryOptions({
    queryKey: ["pool"],
    queryFn: svc.getPool,
    refetchInterval: 30000,
  });

export const walletQuery = () =>
  queryOptions({
    queryKey: ["wallet"],
    queryFn: svc.getWallet,
  });

export const oneClickSessionQuery = () =>
  queryOptions({
    queryKey: ["oneClickSession"],
    queryFn: svc.getSession,
    refetchInterval: 30000,
  });

/** current selection helpers shared by queries */
export function currentSelection(): {
  token: string | null;
  isLong: boolean;
  leverage: number;
} {
  const { token, side, leverage } = useTradeStore.getState();
  return { token, isLong: side === ("long" as Side), leverage };
}

import { create } from "zustand";
import type { Leverage, Side } from "@/services/types";

interface OneClickState {
  enabled: boolean;
  budgetBnb: number;
  maxPerTradeBnb: number;
  durationHours: number;
}

interface TradeState {
  /** selected token contract address (mirrors the /trade/:token route param) */
  token: string | null;
  side: Side;
  leverage: Leverage;
  /** raw input string so the user can clear it */
  amountBnb: string;
  oneClick: OneClickState;
  pasteValue: string;
  setToken: (t: string | null) => void;
  setSide: (s: Side) => void;
  setLeverage: (l: Leverage) => void;
  setAmountBnb: (a: string) => void;
  setOneClick: (o: Partial<OneClickState>) => void;
  setPasteValue: (v: string) => void;
  reset: () => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  token: null,
  side: "long",
  leverage: 2,
  amountBnb: "",
  oneClick: {
    enabled: false,
    budgetBnb: 5,
    maxPerTradeBnb: 1,
    durationHours: 12,
  },
  pasteValue: "",
  setToken: (token) => set({ token }),
  setSide: (side) => set({ side }),
  setLeverage: (leverage) => set({ leverage }),
  setAmountBnb: (amountBnb) => set({ amountBnb }),
  setOneClick: (o) => set((s) => ({ oneClick: { ...s.oneClick, ...o } })),
  setPasteValue: (pasteValue) => set({ pasteValue }),
  reset: () =>
    set({
      token: null,
      side: "long",
      leverage: 2,
      amountBnb: "",
      pasteValue: "",
    }),
}));

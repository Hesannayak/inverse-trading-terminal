// Number / address formatting helpers. All numeric UI text goes through here.

const PRICE_FMT = new Intl.NumberFormat("en-US", {
  minimumSignificantDigits: 4,
  maximumSignificantDigits: 6,
});

const PLAIN_FMT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

/** 4–6 significant digits, thousands separators. */
export function fmtPrice(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v !== 0 && Math.abs(v) < 0.0001) return v.toExponential(2);
  return PRICE_FMT.format(v);
}

export function fmtUsd(v: number): string {
  return "$" + fmtPrice(v);
}

export function fmtBnb(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumSignificantDigits: 3,
    maximumSignificantDigits: 5,
  }).format(v);
}

export function fmtSigned(v: number, decimals = 4): string {
  if (!Number.isFinite(v)) return "—";
  const s = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (v > 0 ? "+" : v < 0 ? "−" : "") + s;
}

export function fmtPct(v: number, decimals = 2): string {
  if (!Number.isFinite(v)) return "—";
  return fmtSigned(v, decimals) + "%";
}

export function fmtSignedPrice(v: number): string {
  return fmtSigned(v, Math.abs(v) < 1 ? 5 : 3);
}

export function fmtPlain(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return PLAIN_FMT.format(v);
}

export function truncAddr(a: string): string {
  if (!a) return "—";
  if (a.length <= 12) return a;
  return a.slice(0, 6) + "…" + a.slice(-4);
}

/** "M:SS" countdown */
export function fmtCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** Compact relative time: "42s", "7m", "3h", "2d" */
export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/** Volume / OI style compact numbers: 1.2M, 340.5K */
export function fmtCompact(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (abs >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
}

export function isValidAddress(a: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(a.trim());
}

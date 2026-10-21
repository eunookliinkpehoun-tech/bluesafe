import { formatUnits, parseUnits } from "viem";

const CENT = 10n ** 16n;

function group(int: bigint) {
  return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 1234.5 USDT (18 decimals) -> "1,234.50" (floored to cents). */
export function fmtAmount(wei: bigint): string {
  const abs = wei < 0n ? -wei : wei;
  const cents = abs / CENT;
  return `${group(cents / 100n)}.${(cents % 100n).toString().padStart(2, "0")}`;
}

export const fmtUsd = (wei: bigint) => `${wei < 0n ? "-" : ""}$${fmtAmount(wei)}`;

export const fmtSigned = (wei: bigint, sign: "+" | "-" | "") => (sign ? `${sign} $${fmtAmount(wei)}` : `$${fmtAmount(wei)}`);

export function parseAmount(input: string): bigint | null {
  const s = input.replace(",", ".").trim();
  if (!s || s === "." || !/^\d*\.?\d{0,18}$/.test(s)) return null;
  try {
    return parseUnits(s, 18);
  } catch {
    return null;
  }
}

/** Exact decimal string for inputs (MAX buttons). */
export const toInput = (wei: bigint) => formatUnits(wei, 18);

export const shortAddr = (a?: string) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "");

export const pct = (part: bigint, total: bigint) => (total > 0n ? Math.min(100, Number((part * 10000n) / total) / 100) : 0);

export const usd = (n: number) => parseUnits(n.toFixed(2), 18);

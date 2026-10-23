// Hermes has no Web Crypto. viem / noble read globalThis.crypto.getRandomValues, so make sure it exists
// before any wallet code runs (react-native-get-random-values first, expo-crypto as a fallback).
import "react-native-get-random-values";
import { getRandomValues } from "expo-crypto";

const g = globalThis as { crypto?: { getRandomValues?: unknown } };
if (typeof g.crypto?.getRandomValues !== "function") {
  try {
    Object.defineProperty(globalThis, "crypto", { value: { ...(g.crypto ?? {}), getRandomValues }, configurable: true, writable: true });
  } catch {
    // Non configurable global: passphrase entropy still comes from expo-crypto directly (src/lib/wallet.ts).
  }
}

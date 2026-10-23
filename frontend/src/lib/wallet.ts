// Passphrase (BIP-39) wallet: 12 words -> BIP-44 Ethereum key (m/44'/60'/0'/0/0), same as Trust Wallet.
import { HDKey } from "@scure/bip32";
import { entropyToMnemonic, mnemonicToSeed, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { getRandomBytes, getRandomValues } from "expo-crypto";
import { bytesToHex, keccak256, toHex, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const normalizePhrase = (phrase: string) => phrase.trim().toLowerCase().split(/\s+/).filter(Boolean).join(" ");

// 128 bits of entropy from the OS secure RNG (expo-crypto works on Android, iOS and web).
export const createPhrase = () => entropyToMnemonic(getRandomBytes(16), wordlist);

export const isValidPhrase = (phrase: string) => {
  const words = normalizePhrase(phrase).split(" ");
  if (words.length !== 12 && words.length !== 24) return false;
  return validateMnemonic(words.join(" "), wordlist);
};

export async function deriveWallet(phrase: string): Promise<{ privateKey: Hex; address: Address }> {
  const seed = await mnemonicToSeed(normalizePhrase(phrase));
  const node = HDKey.fromMasterSeed(seed).derive("m/44'/60'/0'/0/0");
  if (!node.privateKey) throw new Error("derivation failed");
  const privateKey = bytesToHex(node.privateKey);
  return { privateKey, address: privateKeyToAccount(privateKey).address };
}

export const hashPin = (pin: string, address: string) => keccak256(toHex(`tirelire:${address.toLowerCase()}:${pin}`));

export const randomWords = (count: number, exclude: string[]) => {
  const out: string[] = [];
  const bytes = getRandomValues(new Uint32Array(count * 3));
  for (let i = 0; i < bytes.length && out.length < count; i++) {
    const w = wordlist[bytes[i] % wordlist.length];
    if (!exclude.includes(w) && !out.includes(w)) out.push(w);
  }
  return out;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateReferralCode(name: string) {
  const base =
    name
      .normalize("NFD")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "VAULT";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `${base}-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

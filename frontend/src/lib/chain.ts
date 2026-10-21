// All reads come straight from BNB Smart Chain (public RPC). Writes are owner-signed
// EIP-712 requests relayed by the backend, which pays the gas.
import {
  createPublicClient,
  encodeFunctionData,
  fallback,
  getAddress,
  hexToString,
  http,
  isAddress,
  stringToHex,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

import { ERC20_ABI, FACTORY_ABI, VAULT_ABI } from "./abis";
import { apiGet, apiPost } from "./api";

export type ChainConfig = {
  chainId: number;
  rpcUrls: string[];
  factory: Address;
  usdt: Address;
  usdtDecimals: number;
  price: string;
  referralBps: number;
  totalVaults: number;
  relayer: Address;
  explorer: string;
  deployBlock: number;
};

export type Entry = {
  index: number;
  counterparty: Address;
  timestamp: number;
  subId: number;
  kind: number;
  amount: bigint;
};

export type SubAccount = {
  id: number;
  name: string;
  category: number;
  createdAt: number;
  unlockAt: number;
  closed: boolean;
  balance: bigint;
  target: bigint;
};

export type VaultData = {
  owner: Address;
  vault: Address;
  deployed: boolean;
  name: string;
  balance: bigint;
  accounted: bigint;
  allocated: bigint;
  available: bigint;
  pending: bigint;
  entries: Entry[];
  subs: SubAccount[];
  activatedAt: number;
};

export type Referral = {
  owner: Address;
  vault: Address;
  name: string;
  joinedAt: number;
  earned: bigint;
  balance: bigint;
};

export type TeamData = { code: string; totalEarned: bigint; referrals: Referral[] };

export const KIND = {
  deposit: 0,
  transferOut: 1,
  withdraw: 2,
  allocate: 3,
  release: 4,
  activation: 5,
  referral: 6,
  transferIn: 7,
  subCreated: 8,
  subClosed: 9,
} as const;

let configPromise: Promise<ChainConfig> | null = null;
export function getConfig(): Promise<ChainConfig> {
  if (!configPromise) {
    configPromise = apiGet<ChainConfig>("/config").catch((e) => {
      configPromise = null;
      throw e;
    });
  }
  return configPromise;
}

function makeClient(urls: string[]) {
  return createPublicClient({
    chain: bsc,
    transport: fallback(urls.map((u) => http(u, { timeout: 15_000, retryCount: 1 }))),
    batch: { multicall: true },
  });
}

let client: ReturnType<typeof makeClient> | null = null;
async function chain() {
  const cfg = await getConfig();
  if (!client) client = makeClient(cfg.rpcUrls);
  return { client, cfg };
}

export const encodeCode = (code: string): Hex => stringToHex(code.trim().toUpperCase(), { size: 32 });
export const decodeCode = (hex: Hex): string => hexToString(hex, { size: 32 }).replace(/\0/g, "");

export async function readVault(owner: Address): Promise<VaultData> {
  const { client, cfg } = await chain();
  const vault = (await client.readContract({
    address: cfg.factory,
    abi: FACTORY_ABI,
    functionName: "vaultOf",
    args: [owner],
  })) as Address;

  if (vault === zeroAddress) {
    const predicted = (await client.readContract({
      address: cfg.factory,
      abi: FACTORY_ABI,
      functionName: "predictVault",
      args: [owner],
    })) as Address;
    const balance = (await client.readContract({
      address: cfg.usdt,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [predicted],
    })) as bigint;
    return {
      owner,
      vault: predicted,
      deployed: false,
      name: "",
      balance,
      accounted: 0n,
      allocated: 0n,
      available: balance,
      pending: 0n,
      entries: [],
      subs: [],
      activatedAt: 0,
    };
  }

  const [summary, rawEntries, rawSubs] = await Promise.all([
    client.readContract({ address: vault, abi: VAULT_ABI, functionName: "summary" }),
    client.readContract({ address: vault, abi: VAULT_ABI, functionName: "getEntries", args: [0n, 200n] }),
    client.readContract({ address: vault, abi: VAULT_ABI, functionName: "getSubs" }),
  ]);
  const [, name, balance, accounted, allocated, entryCount, , , activatedAt] = summary as readonly [
    Address, string, bigint, bigint, bigint, bigint, bigint, bigint, bigint,
  ];
  const entries: Entry[] = (rawEntries as readonly any[]).map((e, i) => ({
    index: Number(entryCount) - 1 - i,
    counterparty: e.counterparty,
    timestamp: Number(e.timestamp),
    subId: Number(e.subId),
    kind: Number(e.kind),
    amount: BigInt(e.amount),
  }));
  const subs: SubAccount[] = (rawSubs as readonly any[]).map((s, id) => ({
    id,
    name: s.name,
    category: Number(s.category),
    createdAt: Number(s.createdAt),
    unlockAt: Number(s.unlockAt),
    closed: Boolean(s.closed),
    balance: BigInt(s.balance),
    target: BigInt(s.target),
  }));
  return {
    owner,
    vault,
    deployed: true,
    name,
    balance,
    accounted,
    allocated,
    available: balance > allocated ? balance - allocated : 0n,
    pending: balance > accounted ? balance - accounted : 0n,
    entries,
    subs,
    activatedAt: Number(activatedAt),
  };
}

export async function readTeam(owner: Address): Promise<TeamData> {
  const { client, cfg } = await chain();
  const [code, totalEarned, refs] = await Promise.all([
    client.readContract({ address: cfg.factory, abi: FACTORY_ABI, functionName: "codeOf", args: [owner] }),
    client.readContract({ address: cfg.factory, abi: FACTORY_ABI, functionName: "totalEarned", args: [owner] }),
    client.readContract({
      address: cfg.factory,
      abi: FACTORY_ABI,
      functionName: "getReferrals",
      args: [owner, 0n, 200n],
    }),
  ]);
  return {
    code: decodeCode(code as Hex),
    totalEarned: totalEarned as bigint,
    referrals: (refs as readonly any[]).map((r) => ({
      owner: r.owner,
      vault: r.vault,
      name: r.name,
      joinedAt: Number(r.joinedAt),
      earned: BigInt(r.earned),
      balance: BigInt(r.balance),
    })),
  };
}

export async function isCodeTaken(code: string): Promise<boolean> {
  const { client, cfg } = await chain();
  const owner = (await client.readContract({
    address: cfg.factory,
    abi: FACTORY_ABI,
    functionName: "codeOwner",
    args: [encodeCode(code)],
  })) as Address;
  return owner !== zeroAddress;
}

/** Resolves a referral code to its owner + vault + on-chain name. */
export async function resolveCode(code: string): Promise<{ owner: Address; vault: Address; name: string } | null> {
  if (code.trim().length < 3 || code.trim().length > 32) return null;
  const { client, cfg } = await chain();
  const owner = (await client.readContract({
    address: cfg.factory,
    abi: FACTORY_ABI,
    functionName: "codeOwner",
    args: [encodeCode(code)],
  })) as Address;
  if (owner === zeroAddress) return null;
  const vault = (await client.readContract({
    address: cfg.factory,
    abi: FACTORY_ABI,
    functionName: "vaultOf",
    args: [owner],
  })) as Address;
  const name = (await client.readContract({ address: vault, abi: VAULT_ABI, functionName: "name" })) as string;
  return { owner, vault, name };
}

/** Accepts a 0x address or a Tirelire referral code; returns the destination address. */
export async function resolveRecipient(input: string): Promise<{ address: Address; name?: string } | null> {
  const value = input.trim();
  if (isAddress(value)) {
    const address = getAddress(value);
    const { client, cfg } = await chain();
    const isVault = (await client.readContract({
      address: cfg.factory,
      abi: FACTORY_ABI,
      functionName: "isVault",
      args: [address],
    })) as boolean;
    if (!isVault) return { address };
    const name = (await client.readContract({ address, abi: VAULT_ABI, functionName: "name" })) as string;
    return { address, name };
  }
  const res = await resolveCode(value);
  return res ? { address: res.vault, name: res.name } : null;
}

async function waitTx(hash: Hex) {
  const { client } = await chain();
  const receipt = await client.waitForTransactionReceipt({ hash, timeout: 120_000, pollingInterval: 1_500 });
  if (receipt.status !== "success") throw new Error("TransactionRejected");
}

const deadline = () => BigInt(Math.floor(Date.now() / 1000) + 1800);

export type VaultFunction = "transfer" | "withdraw" | "createSub" | "allocate" | "release" | "closeSub" | "setName";

/** Signs an EIP-712 Execute request for the vault and lets the relayer pay the gas. */
export async function execGasless(privateKey: Hex, vault: Address, functionName: VaultFunction, args: readonly unknown[]) {
  const { client, cfg } = await chain();
  const account = privateKeyToAccount(privateKey);
  const data = encodeFunctionData({ abi: VAULT_ABI, functionName, args } as any);
  const nonce = (await client.readContract({ address: vault, abi: VAULT_ABI, functionName: "nonce" })) as bigint;
  const dl = deadline();
  const signature = await account.signTypedData({
    domain: { name: "TirelireVault", version: "1", chainId: cfg.chainId, verifyingContract: vault },
    types: {
      Execute: [
        { name: "data", type: "bytes" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Execute",
    message: { data, nonce, deadline: dl },
  });
  const { txHash } = await apiPost<{ txHash: Hex }>("/relay/execute", {
    vault,
    data,
    deadline: Number(dl),
    signature,
  });
  await waitTx(txHash);
  return txHash;
}

/** Gasless lifetime activation: deploys the user's personal vault contract. */
export async function activateGasless(
  privateKey: Hex,
  input: { name: string; code: string; referrer: Address | null },
) {
  const { cfg } = await chain();
  const account = privateKeyToAccount(privateKey);
  const dl = deadline();
  const code = encodeCode(input.code);
  const referrer = input.referrer ?? zeroAddress;
  const signature = await account.signTypedData({
    domain: { name: "TirelireFactory", version: "1", chainId: cfg.chainId, verifyingContract: cfg.factory },
    types: {
      Activate: [
        { name: "owner", type: "address" },
        { name: "name", type: "string" },
        { name: "code", type: "bytes32" },
        { name: "referrer", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Activate",
    message: { owner: account.address, name: input.name, code, referrer, deadline: dl },
  });
  const { txHash } = await apiPost<{ txHash: Hex }>("/relay/activate", {
    owner: account.address,
    name: input.name,
    code,
    referrer,
    deadline: Number(dl),
    signature,
  });
  await waitTx(txHash);
  return txHash;
}

export async function requestSync(vault: Address) {
  const res = await apiPost<{ synced: boolean; txHash: Hex | null }>("/relay/sync", { vault });
  if (res.txHash) await waitTx(res.txHash);
  return res.synced;
}

export async function isActivated(owner: Address): Promise<boolean> {
  const { client, cfg } = await chain();
  const vault = (await client.readContract({
    address: cfg.factory,
    abi: FACTORY_ABI,
    functionName: "vaultOf",
    args: [owner],
  })) as Address;
  return vault !== zeroAddress;
}

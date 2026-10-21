import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Address, Hex } from "viem";

import { isActivated } from "@/src/lib/chain";
import { hashPin } from "@/src/lib/wallet";
import { storage } from "@/src/utils/storage";

export type Status = "loading" | "none" | "locked" | "ready" | "demo";
export type ActiveAccount = "main" | number;
export type Draft = { phrase: string; privateKey: Hex; address: Address };
export type Profile = { name: string; code: string; referrer: Address | null; referrerName: string };

const K = {
  phrase: "tl.phrase",
  pk: "tl.pk",
  pin: "tl.pinHash",
  address: "tl.address",
  demo: "tl.demo",
  name: "tl.profile.name",
  code: "tl.profile.code",
  referrer: "tl.profile.referrer",
  referrerName: "tl.profile.referrerName",
  refCode: "tl.refCode",
};

type Ctx = {
  status: Status;
  address: Address | null;
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
  commitWallet: (pin: string) => Promise<Address>;
  unlock: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  lock: () => void;
  signOut: () => Promise<void>;
  enterDemo: () => Promise<void>;
  exitDemo: () => Promise<void>;
  getPrivateKey: () => Promise<Hex>;
  getPhrase: () => Promise<string>;
  getProfile: () => Promise<Profile>;
  saveProfile: (p: Profile) => Promise<void>;
  pendingRefCode: () => Promise<string>;
  setPendingRefCode: (code: string) => Promise<void>;
  nextRoute: (address: Address) => Promise<"/(tabs)" | "/activate" | "/setup">;
  activeAccount: ActiveAccount;
  setActiveAccount: (a: ActiveAccount) => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("loading");
  const [address, setAddress] = useState<Address | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeAccount, setActiveAccount] = useState<ActiveAccount>("main");

  useEffect(() => {
    (async () => {
      const demo = await storage.getItem(K.demo, false);
      const addr = (await storage.getItem(K.address, "")) as string;
      if (demo) setStatus("demo");
      else if (addr) {
        setAddress(addr as Address);
        setStatus("locked");
      } else setStatus("none");
    })();
  }, []);

  const commitWallet = useCallback(
    async (pin: string) => {
      if (!draft) throw new Error("no draft");
      await storage.secureSet(K.phrase, draft.phrase);
      await storage.secureSet(K.pk, draft.privateKey);
      await storage.secureSet(K.pin, hashPin(pin, draft.address));
      await storage.setItem(K.address, draft.address);
      await storage.removeItem(K.demo);
      setAddress(draft.address);
      setDraft(null);
      setActiveAccount("main");
      setStatus("ready");
      return draft.address;
    },
    [draft],
  );

  const verifyPin = useCallback(
    async (pin: string) => {
      if (!address) return false;
      const stored = await storage.secureGet<string>(K.pin, "");
      return stored === hashPin(pin, address);
    },
    [address],
  );

  const unlock = useCallback(
    async (pin: string) => {
      const ok = await verifyPin(pin);
      if (ok) setStatus("ready");
      return ok;
    },
    [verifyPin],
  );

  const lock = useCallback(() => setStatus("locked"), []);

  const signOut = useCallback(async () => {
    await Promise.all(Object.values(K).map((k) => Promise.all([storage.secureRemove(k), storage.removeItem(k)])));
    qc.clear();
    setAddress(null);
    setActiveAccount("main");
    setStatus("none");
  }, [qc]);

  const enterDemo = useCallback(async () => {
    await storage.setItem(K.demo, true);
    setActiveAccount("main");
    setStatus("demo");
  }, []);

  const exitDemo = useCallback(async () => {
    await storage.removeItem(K.demo);
    setActiveAccount("main");
    setStatus(address ? "locked" : "none");
  }, [address]);

  const getPrivateKey = useCallback(async () => (await storage.secureGet(K.pk, "")) as Hex, []);
  const getPhrase = useCallback(async () => (await storage.secureGet(K.phrase, "")) as string, []);

  const getProfile = useCallback(async (): Promise<Profile> => {
    const [name, code, referrer, referrerName] = await Promise.all([
      storage.getItem(K.name, ""),
      storage.getItem(K.code, ""),
      storage.getItem(K.referrer, ""),
      storage.getItem(K.referrerName, ""),
    ]);
    return {
      name: (name as string) ?? "",
      code: (code as string) ?? "",
      referrer: referrer ? (referrer as Address) : null,
      referrerName: (referrerName as string) ?? "",
    };
  }, []);

  const saveProfile = useCallback(async (p: Profile) => {
    await Promise.all([
      storage.setItem(K.name, p.name),
      storage.setItem(K.code, p.code),
      storage.setItem(K.referrer, p.referrer ?? ""),
      storage.setItem(K.referrerName, p.referrerName),
    ]);
  }, []);

  const pendingRefCode = useCallback(async () => ((await storage.getItem(K.refCode, "")) as string) ?? "", []);
  const setPendingRefCode = useCallback(async (code: string) => {
    await storage.setItem(K.refCode, code);
  }, []);

  const nextRoute = useCallback(
    async (addr: Address) => {
      try {
        if (await isActivated(addr)) return "/(tabs)" as const;
      } catch {
        return "/(tabs)" as const;
      }
      const p = await getProfile();
      return p.name ? ("/activate" as const) : ("/setup" as const);
    },
    [getProfile],
  );

  const value = useMemo(
    () => ({
      status, address, draft, setDraft, commitWallet, unlock, verifyPin, lock, signOut, enterDemo, exitDemo,
      getPrivateKey, getPhrase, getProfile, saveProfile, pendingRefCode, setPendingRefCode, nextRoute,
      activeAccount, setActiveAccount,
    }),
    [status, address, draft, commitWallet, unlock, verifyPin, lock, signOut, enterDemo, exitDemo, getPrivateKey,
      getPhrase, getProfile, saveProfile, pendingRefCode, setPendingRefCode, nextRoute, activeAccount],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useToast } from "@/src/components/Toast";
import { useI18n } from "@/src/i18n";
import { ApiError } from "@/src/lib/api";
import {
  execGasless,
  getConfig,
  readTeam,
  readVault,
  requestSync,
  type SubAccount,
  type TeamData,
  type VaultData,
  type VaultFunction,
} from "@/src/lib/chain";
import { DEMO_OWNER, DEMO_VAULT, demoSubs, demoTeam, demoTxs } from "@/src/lib/demo";
import { buildTxs, type UiTx } from "@/src/lib/entries";
import { usd } from "@/src/lib/format";
import { useApp } from "@/src/state/app";

export function useConfigQuery() {
  return useQuery({ queryKey: ["config"], queryFn: getConfig, staleTime: 60_000 });
}

export function useVaultQuery() {
  const { status, address } = useApp();
  return useQuery({
    queryKey: ["vault", address],
    queryFn: () => readVault(address!),
    enabled: status === "ready" && !!address,
    refetchInterval: 15_000,
  });
}

export type VaultView = Omit<VaultData, "entries"> & { isDemo: boolean };

/** Vault data from the chain, or the mockup demo data in demo mode. */
export function useVaultView() {
  const { status } = useApp();
  const { t } = useI18n();
  const q = useVaultQuery();
  const isDemo = status === "demo";

  const view = useMemo<VaultView | undefined>(() => {
    if (isDemo) {
      const subs = demoSubs(t);
      const allocated = subs.reduce((a, s) => a + s.balance, 0n);
      const free = usd(2340);
      return {
        isDemo: true, owner: DEMO_OWNER, vault: DEMO_VAULT, deployed: true, name: t("demo.name"),
        balance: allocated + free, accounted: allocated + free, allocated, available: free, pending: 0n,
        subs, activatedAt: 0,
      };
    }
    if (!q.data) return undefined;
    const { entries: _e, ...rest } = q.data;
    return { ...rest, subs: q.data.subs.filter((s) => !s.closed), isDemo: false };
  }, [isDemo, q.data, t]);

  return {
    view,
    loading: !isDemo && q.isLoading,
    error: !isDemo && q.isError,
    refreshing: !isDemo && q.isRefetching,
    refetch: q.refetch,
  };
}

export function useTxs(scope: "main" | number): UiTx[] {
  const { status } = useApp();
  const { t } = useI18n();
  const q = useVaultQuery();
  return useMemo(() => {
    if (status === "demo") return demoTxs(t, scope);
    if (!q.data) return [];
    return buildTxs(q.data.entries, q.data.subs, scope, t);
  }, [status, q.data, scope, t]);
}

export function useActiveSub(view?: VaultView): SubAccount | undefined {
  const { activeAccount } = useApp();
  return typeof activeAccount === "number" ? view?.subs.find((s) => s.id === activeAccount) : undefined;
}

export function useTeam() {
  const { status, address } = useApp();
  const q = useQuery({
    queryKey: ["team", address],
    queryFn: () => readTeam(address!),
    enabled: status === "ready" && !!address,
    refetchInterval: 30_000,
  });
  const demo = useMemo(() => (status === "demo" ? demoTeam() : undefined), [status]);
  return {
    team: (demo ?? q.data) as TeamData | undefined,
    loading: status !== "demo" && q.isLoading,
    refreshing: q.isRefetching,
    refetch: q.refetch,
  };
}

export function errorMessage(e: unknown, t: (k: string) => string) {
  const known = [
    "InsufficientFunds", "SubLocked", "InvalidRecipient", "InvalidAmount", "BadSignature", "Expired",
    "InvalidCode", "InvalidReferrer", "AlreadyActivated", "InvalidName", "UnknownVault",
  ];
  if (e instanceof ApiError) {
    if (e.status === 0) return t("errors.network");
    if (e.status === 429) return t("errors.tooMany");
    if (known.includes(e.message)) return t(`errors.${e.message}`);
    return t("errors.generic");
  }
  const msg = e instanceof Error ? e.message : "";
  const hit = known.find((k) => msg.includes(k));
  return hit ? t(`errors.${hit}`) : t("errors.generic");
}

/** Runs a gasless vault operation: sign locally, relay, wait, refresh. */
export function useVaultAction() {
  const { status, getPrivateKey } = useApp();
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (vault: `0x${string}`, fn: VaultFunction, args: readonly unknown[]) => {
      if (status === "demo") {
        toast.show(t("sheets.demoAction"), "info");
        return null;
      }
      setBusy(true);
      try {
        const pk = await getPrivateKey();
        const hash = await execGasless(pk, vault, fn, args);
        await qc.invalidateQueries({ queryKey: ["vault"] });
        return hash;
      } catch (e) {
        toast.show(errorMessage(e, t), "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [status, getPrivateKey, qc, t, toast],
  );
  return { run, busy };
}

/** Records plain BEP20 deposits into the on-chain ledger (relayer pays the gas). */
export function useAutoSync(view?: VaultView) {
  const qc = useQueryClient();
  const asked = useRef<string>("");
  useEffect(() => {
    if (!view || view.isDemo || !view.deployed || view.pending === 0n) return;
    const key = `${view.vault}:${view.balance}`;
    if (asked.current === key) return;
    asked.current = key;
    requestSync(view.vault)
      .then(() => qc.invalidateQueries({ queryKey: ["vault"] }))
      .catch(() => undefined);
  }, [view, qc]);
}

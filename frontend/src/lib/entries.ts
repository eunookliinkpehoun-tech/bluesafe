import type { IconName } from "@/src/components/Icon";
import { KIND, type Entry, type SubAccount } from "./chain";
import { shortAddr } from "./format";

export type TxCategory = "income" | "expense" | "transfer";

export type UiTx = {
  id: string;
  title: string;
  amount: bigint;
  sign: "+" | "-";
  timestamp: number;
  icon: IconName;
  highlight: boolean;
  category: TxCategory;
  counterparty?: string;
  /** Moves between the main vault and its own sub-accounts. */
  internal?: boolean;
};

type T = (key: string, params?: Record<string, string | number>) => string;

const isZero = (a: string) => /^0x0{40}$/i.test(a);

export function buildTxs(entries: Entry[], subs: SubAccount[], scope: "main" | number, t: T): UiTx[] {
  const subName = (id: number) => subs.find((s) => s.id === id)?.name ?? `#${id + 1}`;
  const out: UiTx[] = [];
  for (const e of entries) {
    if (e.kind === KIND.subCreated || e.kind === KIND.subClosed) continue;
    const base = { id: `${e.index}`, amount: e.amount, timestamp: e.timestamp, counterparty: e.counterparty };
    if (scope !== "main") {
      if (e.subId !== scope) continue;
      if (e.kind === KIND.allocate)
        out.push({ ...base, title: t("tx.fromMain"), sign: "+", icon: "vault", highlight: true, category: "transfer" });
      if (e.kind === KIND.release)
        out.push({ ...base, title: t("tx.toMain"), sign: "-", icon: "vault", highlight: false, category: "transfer" });
      continue;
    }
    const who = isZero(e.counterparty) ? "" : shortAddr(e.counterparty);
    switch (e.kind) {
      case KIND.deposit:
        out.push({ ...base, title: who ? t("tx.depositFrom", { who }) : t("tx.deposit"), sign: "+", icon: "arrowIn", highlight: true, category: "income" });
        break;
      case KIND.transferIn:
        out.push({ ...base, title: t("tx.transferFrom", { who }), sign: "+", icon: "arrowIn", highlight: true, category: "transfer" });
        break;
      case KIND.referral:
        out.push({ ...base, title: t("tx.referral"), sign: "+", icon: "users", highlight: true, category: "income" });
        break;
      case KIND.transferOut:
        out.push({ ...base, title: t("tx.transferTo", { who }), sign: "-", icon: "transfer", highlight: false, category: "transfer" });
        break;
      case KIND.withdraw:
        out.push({ ...base, title: t("tx.withdraw", { who }), sign: "-", icon: "withdraw", highlight: false, category: "expense" });
        break;
      case KIND.activation:
        out.push({ ...base, title: t("tx.activation"), sign: "-", icon: "key", highlight: false, category: "expense" });
        break;
      case KIND.allocate:
        out.push({ ...base, title: t("tx.toSub", { name: subName(e.subId) }), sign: "-", icon: "vault", highlight: false, category: "transfer", internal: true });
        break;
      case KIND.release:
        out.push({ ...base, title: t("tx.fromSub", { name: subName(e.subId) }), sign: "+", icon: "vault", highlight: true, category: "transfer", internal: true });
        break;
    }
  }
  return out;
}

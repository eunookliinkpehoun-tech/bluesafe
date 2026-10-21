// Demo data reproducing the mockups. Only used in "Explore the demo" mode.
import type { Address } from "viem";

import type { Referral, SubAccount, TeamData } from "./chain";
import type { UiTx } from "./entries";
import { usd } from "./format";

type T = (key: string, params?: Record<string, string | number>) => string;

const DAY = 86400;
const now = () => Math.floor(Date.now() / 1000);
const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return Math.floor(d.getTime() / 1000);
};

export const DEMO_OWNER = "0x87Ffa589043d9503Ab71C953e781b2D2406818C7" as Address;
export const DEMO_VAULT = "0x87Ffa589043d9503Ab71C953e781b2D2406818C7" as Address;

export function demoSubs(t: T): SubAccount[] {
  return [
    { id: 0, name: t("demo.subSecurity"), category: 0, createdAt: now() - 200 * DAY, unlockAt: 0, closed: false, balance: usd(8200), target: usd(10000) },
    { id: 1, name: t("demo.subWedding"), category: 1, createdAt: now() - 120 * DAY, unlockAt: now() + 90 * DAY, closed: false, balance: usd(5600), target: usd(7000) },
    { id: 2, name: t("demo.subHealth"), category: 2, createdAt: now() - 90 * DAY, unlockAt: 0, closed: false, balance: usd(3150), target: 0n },
    { id: 3, name: t("demo.subHoliday"), category: 3, createdAt: now() - 60 * DAY, unlockAt: 0, closed: false, balance: usd(1500), target: usd(2000) },
  ];
}

export function demoTxs(t: T, scope: "main" | number): UiTx[] {
  if (scope !== "main") {
    return [
      { id: "s1", title: t("tx.fromMain"), amount: usd(250), sign: "+", timestamp: at(0, 9, 30), icon: "vault", highlight: true, category: "transfer" },
      { id: "s2", title: t("tx.fromMain"), amount: usd(500), sign: "+", timestamp: at(12, 9, 30), icon: "vault", highlight: true, category: "transfer" },
      { id: "s3", title: t("tx.toMain"), amount: usd(120), sign: "-", timestamp: at(20, 18, 5), icon: "vault", highlight: false, category: "transfer" },
    ];
  }
  return [
    { id: "d1", title: t("demo.salary"), amount: usd(16), sign: "+", timestamp: at(0, 10, 45), icon: "cash", highlight: true, category: "income" },
    { id: "d2", title: t("demo.coffee"), amount: usd(4.5), sign: "-", timestamp: at(0, 8, 15), icon: "withdraw", highlight: false, category: "expense" },
    { id: "d3", title: t("demo.zomato"), amount: usd(32), sign: "-", timestamp: at(1, 20, 20), icon: "withdraw", highlight: false, category: "expense" },
    { id: "d4", title: t("demo.netflix"), amount: usd(15.99), sign: "-", timestamp: at(1, 12, 0), icon: "withdraw", highlight: false, category: "expense" },
    { id: "d5", title: t("demo.electricity"), amount: usd(1200), sign: "-", timestamp: at(3, 12, 0), icon: "zap", highlight: false, category: "expense" },
    { id: "d6", title: t("demo.transferAlex"), amount: usd(450), sign: "+", timestamp: at(3, 10, 14), icon: "arrowIn", highlight: true, category: "transfer" },
    { id: "d7", title: t("demo.uber"), amount: usd(24.8), sign: "-", timestamp: at(3, 7, 42), icon: "transfer", highlight: false, category: "transfer" },
    { id: "d8", title: t("demo.market"), amount: usd(112.4), sign: "-", timestamp: at(7, 18, 18), icon: "withdraw", highlight: false, category: "expense" },
    { id: "d9", title: t("demo.savings"), amount: usd(200), sign: "-", timestamp: at(7, 9, 30), icon: "vault", highlight: false, category: "transfer" },
  ];
}

const DEMO_NAMES = [
  "Alexandre M.", "Sophie Laurent", "Karim Diallo", "Nadia B.", "Youssef K.", "Emma R.", "Lucas P.",
  "Fatou S.", "Hugo D.", "Amina T.", "Léo G.", "Sara H.", "Omar Z.", "Julie V.",
];

export function demoTeam(): TeamData {
  const referrals: Referral[] = DEMO_NAMES.map((name, i) => ({
    owner: `0x${(i + 17).toString(16).padStart(2, "0")}4b9a12c8f63e27aa91d2c8f4b9a12c8f63e27a9${i % 10}` as Address,
    vault: `0x${(i + 40).toString(16).padStart(2, "0")}91c2c8f4b9a12c8f63e27aa91d2c8f4b9a12c8f${i % 10}` as Address,
    name,
    joinedAt: now() - (i * 3 + 1) * DAY,
    earned: i === 0 ? usd(142.5) : i === 1 ? usd(88) : i === 2 || i === 13 ? 0n : usd(30 * (1 + (i % 4))),
    balance: i === 2 || i === 13 ? 0n : usd(100 + i * 37),
  }));
  return { code: "RAKIB-VIP8", totalEarned: usd(1450), referrals };
}

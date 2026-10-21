import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { storage } from "@/src/utils/storage";
import { ar } from "./ar";
import { en, type Dict } from "./en";
import { fr } from "./fr";

export type Lang = "en" | "fr" | "ar";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "عربي" },
];

const DICTS: Record<Lang, Dict> = { en, fr, ar };
const LANG_KEY = "tl.lang";

type Params = Record<string, string | number>;
type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Params) => string;
  dict: Dict;
  isRTL: boolean;
  ready: boolean;
};

const I18nContext = createContext<Ctx | null>(null);

function lookup(dict: unknown, key: string): string | undefined {
  const v = key.split(".").reduce<any>((acc, k) => (acc == null ? undefined : acc[k]), dict);
  return typeof v === "string" ? v : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.getItem<string>(LANG_KEY, "en").then((v) => {
      if (v === "fr" || v === "ar" || v === "en") setLangState(v);
      setReady(true);
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    storage.setItem(LANG_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, params?: Params) => {
      const raw = lookup(DICTS[lang], key) ?? lookup(en, key) ?? key;
      if (!params) return raw;
      return raw.replace(/\{\{(\w+)\}\}/g, (_, p) => String(params[p] ?? ""));
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, dict: DICTS[lang], isRTL: lang === "ar", ready }),
    [lang, setLang, t, ready],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  return ctx;
}

const pad = (n: number) => n.toString().padStart(2, "0");

export const timeLabel = (ts: number) => {
  const d = new Date(ts * 1000);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Today", "Yesterday" or "28 October". */
export function dayLabel(ts: number, dict: Dict) {
  const d = new Date(ts * 1000);
  const now = new Date();
  const y = new Date();
  y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return dict.common.today;
  if (sameDay(d, y)) return dict.common.yesterday;
  return `${d.getDate()} ${dict.monthsLong[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ""}`;
}

/** "Today • 10:45" / "Oct 28 • 12:00". */
export function shortStamp(ts: number, dict: Dict) {
  const d = new Date(ts * 1000);
  const label = dayLabel(ts, dict);
  const isRel = label === dict.common.today || label === dict.common.yesterday;
  return `${isRel ? label : `${dict.monthsShort[d.getMonth()]} ${d.getDate()}`} • ${timeLabel(ts)}`;
}

export function dateLabel(ts: number, dict: Dict) {
  const d = new Date(ts * 1000);
  return `${d.getDate()} ${dict.monthsShort[d.getMonth()]} ${d.getFullYear()}`;
}

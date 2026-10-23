import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type SheetKind =
  | "deposit"
  | "transfer"
  | "withdraw"
  | "createSub"
  | "subDeposit"
  | "subWithdraw"
  | "notifications"
  | "backup"
  | "signOut"
  | "teamHelp"
  | "period"
  | "subActions"
  | "subDelete";

export type Period = "all" | "month" | "week";

type Ctx = {
  sheet: SheetKind | null;
  open: (s: SheetKind) => void;
  close: () => void;
  plusOpen: boolean;
  setPlusOpen: (v: boolean) => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  /** Sub-account targeted by the actions / delete sheets. */
  target: number | null;
  setTarget: (id: number | null) => void;
};

const OverlayContext = createContext<Ctx | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("all");
  const [target, setTarget] = useState<number | null>(null);

  const open = useCallback((s: SheetKind) => {
    setPlusOpen(false);
    setDrawerOpen(false);
    setSheet(s);
  }, []);
  const close = useCallback(() => setSheet(null), []);

  const value = useMemo(
    () => ({ sheet, open, close, plusOpen, setPlusOpen, drawerOpen, setDrawerOpen, period, setPeriod, target, setTarget }),
    [sheet, open, close, plusOpen, drawerOpen, period, target],
  );
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay outside OverlayProvider");
  return ctx;
}

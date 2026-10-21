// Design tokens for Tirelire. Dark only (cosmic glassmorphism from the user's mockups).
//
// A plain key is a background, and its `on` partner is the text or icon color on top of it.
// Build sheets with makeStyles so colors and layout live together.

import { useMemo } from "react";
import { Appearance, Platform, StyleSheet, useColorScheme } from "react-native";

/** Forces a layout direction: native Yoga uses the `direction` style, react-native-web the `dir` attribute. */
type Dir = "ltr" | "rtl";
export const dirStyle = (d: Dir) => (Platform.OS === "web" ? {} : { direction: d });
export const webDir = (d: Dir) => (Platform.OS === "web" ? ({ dir: d } as object) : {});

export type ColorScheme = "light" | "dark";

const dark = {
  // Surfaces
  surface: "#030712",
  onSurface: "#F1F5F9",
  surfaceSecondary: "rgba(18, 24, 38, 0.65)",
  onSurfaceSecondary: "#E2E8F0",
  surfaceTertiary: "rgba(30, 41, 59, 0.8)",
  onSurfaceTertiary: "#CBD5E1",
  surfaceInverse: "#F1F5F9",
  onSurfaceInverse: "#030712",
  muted: "#94A3B8",

  // Brand
  brand: "#2F69FF",
  onBrand: "#FFFFFF",
  brandPrimary: "#3B82F6",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#2563EB",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "rgba(59, 130, 246, 0.15)",
  onBrandTertiary: "#60A5FA",

  // Status
  success: "#34D399",
  onSuccess: "#022C22",
  warning: "#FBBF24",
  onWarning: "#1C1917",
  error: "#FB7185",
  onError: "#1F0A10",
  info: "#38BDF8",
  onInfo: "#082F49",

  // Lines
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(96, 165, 250, 0.4)",
  divider: "rgba(255, 255, 255, 0.05)",

  // Canvas & glass
  canvas: "#030611",
  glass: "rgba(18, 24, 38, 0.65)",
  glassCard: "rgba(15, 23, 42, 0.55)",
  glassStrong: "rgba(22, 30, 49, 0.65)",
  glassSubtle: "rgba(255, 255, 255, 0.03)",
  glassInput: "rgba(10, 15, 29, 0.65)",
  glassHighlight: "rgba(255, 255, 255, 0.12)",
  glassPressed: "rgba(30, 42, 69, 0.85)",
  navBar: "rgba(12, 18, 34, 0.92)",
  sheet: "rgba(9, 13, 26, 0.98)",
  drawer: "rgba(6, 10, 22, 0.98)",
  overlay: "rgba(2, 6, 23, 0.62)",
  overlayLight: "rgba(2, 6, 23, 0.35)",
  iconTile: "rgba(30, 41, 59, 0.8)",
  track: "rgba(15, 23, 42, 0.8)",
  white10: "rgba(255, 255, 255, 0.10)",
  white15: "rgba(255, 255, 255, 0.15)",
  white70: "rgba(255, 255, 255, 0.72)",
  qrBackground: "#FFFFFF",
  qrForeground: "#030712",

  // Text scale
  textStrong: "#FFFFFF",
  textSoft: "#CBD5E1",
  textFaint: "#64748B",

  // Accents
  accentBlue: "#60A5FA",
  accentIndigo: "#6366F1",
  accentIndigoSoft: "#818CF8",
  accentSky: "#38BDF8",
  accentCyan: "#22D3EE",
  accentCyanSoft: "#67E8F9",
  accentEmerald: "#34D399",
  accentAmber: "#FBBF24",
  accentOrange: "#F97316",
  accentRose: "#FB7185",
  accentPurple: "#C084FC",
  emeraldSoft: "rgba(16, 185, 129, 0.12)",
  emeraldBorder: "rgba(16, 185, 129, 0.25)",
  roseSoft: "rgba(244, 63, 94, 0.12)",
  amberSoft: "rgba(251, 191, 36, 0.12)",
  blueSoft: "rgba(59, 130, 246, 0.12)",
  blueBorder: "rgba(96, 165, 250, 0.25)",

  // Glow orbs (solid stops; opacity applied in gradients)
  glowBright: "#2563EB",
  glowDeep: "#1E3A8A",
  glowRoyal: "#1D4ED8",
  glowSky: "#3B82F6",
  glowTeal: "#0E7490",
  glowIndigo: "#4F46E5",
  dot: "#FFFFFF",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light: dark, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

// The app ships a single dark look; keep native chrome dark too.
setColorScheme?.("dark");

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const colors = dark;

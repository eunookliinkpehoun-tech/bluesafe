import type { IconName } from "@/src/components/Icon";
import type { ThemeColors } from "@/src/theme";

export type CategoryStyle = { icon: IconName; color: keyof ThemeColors; gradient: [keyof ThemeColors, keyof ThemeColors] };

/** Sub-account categories: 0 savings, 1 projects, 2 health/insurance, 3 leisure, 4 other. */
export const CATEGORY: Record<number, CategoryStyle> = {
  0: { icon: "safe", color: "accentSky", gradient: ["accentSky", "brandPrimary"] },
  1: { icon: "gift", color: "accentIndigoSoft", gradient: ["accentIndigo", "accentPurple"] },
  2: { icon: "heart", color: "accentEmerald", gradient: ["accentEmerald", "accentCyan"] },
  3: { icon: "plane", color: "accentAmber", gradient: ["accentAmber", "accentOrange"] },
  4: { icon: "layers", color: "accentBlue", gradient: ["accentBlue", "accentIndigo"] },
};

export const CATEGORY_IDS = [0, 1, 2, 3, 4];

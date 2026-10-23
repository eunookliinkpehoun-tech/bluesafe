import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { Icon } from "@/src/components/Icon";
import { Sheet } from "@/src/components/Sheet";
import { PrimaryButton } from "@/src/components/ui";
import { WHEEL_ITEM_H, WHEEL_VISIBLE, WheelColumn } from "@/src/components/WheelPicker";
import { dateLabel, useI18n } from "@/src/i18n";
import { dirStyle, makeStyles, useTheme, webDir } from "@/src/theme";

const YEARS_AHEAD = 30;
const DAY_MS = 86_400_000;

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** iOS-style Day / Month / Year wheel for a custom unlock date (tomorrow at the earliest). */
export function DatePickerSheet({ value, onConfirm, onClose }: { value: number | null; onConfirm: (unix: number) => void; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, dict } = useI18n();
  const tomorrow = startOfDay(Date.now() + DAY_MS);
  const baseYear = new Date().getFullYear();
  const initial = new Date(value ? value * 1000 : Date.now() + 30 * DAY_MS);

  const [yearIdx, setYearIdx] = useState(Math.min(YEARS_AHEAD, Math.max(0, initial.getFullYear() - baseYear)));
  const [month, setMonth] = useState(initial.getMonth());
  const [dayIdx, setDayIdx] = useState(initial.getDate() - 1);

  const year = baseYear + yearIdx;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dayIdx, daysInMonth - 1);
  useEffect(() => {
    if (dayIdx > daysInMonth - 1) setDayIdx(daysInMonth - 1);
  }, [dayIdx, daysInMonth]);

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0")), [daysInMonth]);
  const years = useMemo(() => Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => String(baseYear + i)), [baseYear]);

  const picked = new Date(year, month, day + 1).getTime();
  const valid = picked >= tomorrow;

  return (
    <Sheet title={t("sheets.pickDateTitle")} onClose={onClose} testID="date-picker-sheet" scrollable={false}>
      <Text style={styles.hint}>{t("sheets.pickDateHint")}</Text>
      <View style={[styles.labels, dirStyle("ltr")]} {...webDir("ltr")}>
        <Text style={[styles.label, styles.dayCol]}>{t("sheets.day")}</Text>
        <Text style={[styles.label, styles.monthCol]}>{t("sheets.month")}</Text>
        <Text style={[styles.label, styles.yearCol]}>{t("sheets.year")}</Text>
      </View>
      <View style={[styles.wheel, dirStyle("ltr")]} {...webDir("ltr")}>
        <View pointerEvents="none" style={styles.band} />
        <WheelColumn testID="date-wheel-day" items={days} index={day} onChange={setDayIdx} flex={0.8} />
        <WheelColumn testID="date-wheel-month" items={dict.monthsLong} index={month} onChange={setMonth} flex={1.7} />
        <WheelColumn testID="date-wheel-year" items={years} index={yearIdx} onChange={setYearIdx} flex={1} />
        <LinearGradient pointerEvents="none" colors={[colors.sheet, colors.sheetClear]} style={[styles.fade, styles.fadeTop]} />
        <LinearGradient pointerEvents="none" colors={[colors.sheetClear, colors.sheet]} style={[styles.fade, styles.fadeBottom]} />
      </View>
      <View style={[styles.summary, !valid && styles.summaryOff]} testID="date-picker-summary">
        <Icon name="lock" size={14} color={valid ? colors.accentBlue : colors.accentRose} />
        <Text style={[styles.summaryText, !valid && styles.summaryTextOff]}>{valid ? dateLabel(picked / 1000, dict) : t("sheets.dateInvalid")}</Text>
      </View>
      <PrimaryButton testID="date-picker-confirm" label={t("common.confirm")} icon="check" disabled={!valid} onPress={() => onConfirm(Math.floor(picked / 1000))} />
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  hint: { color: c.textSoft, fontSize: 14, lineHeight: 20, textAlign: "center" },
  labels: { flexDirection: "row", paddingHorizontal: 8 },
  label: { color: c.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", textAlign: "center" },
  dayCol: { flex: 0.8 },
  monthCol: { flex: 1.7 },
  yearCol: { flex: 1 },
  wheel: {
    flexDirection: "row",
    height: WHEEL_ITEM_H * WHEEL_VISIBLE,
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: c.glassSubtle,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  band: {
    position: "absolute",
    start: 8,
    end: 8,
    top: WHEEL_ITEM_H * 2,
    height: WHEEL_ITEM_H,
    borderRadius: 12,
    backgroundColor: c.brandTertiary,
    borderWidth: 1,
    borderColor: c.blueBorder,
  },
  fade: { position: "absolute", start: 0, end: 0, height: WHEEL_ITEM_H * 1.2 },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 36, borderRadius: 18, backgroundColor: c.blueSoft, paddingHorizontal: 14, alignSelf: "center" },
  summaryOff: { backgroundColor: c.roseSoft },
  summaryText: { color: c.textStrong, fontSize: 14, fontWeight: "700", textAlign: "center" },
  summaryTextOff: { color: c.accentRose },
}));

import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";

type Props = {
  title: string;
  subtitle?: string;
  subtitleAccent?: boolean;
  onBack: () => void;
  action?: { icon: IconName; onPress: () => void; testID: string; label: string; accent?: boolean };
  testID: string;
};

/** Sticky screen header from the mockups: glass back button, centered title, glass action. */
export function ScreenHeader({ title, subtitle, subtitleAccent, onBack, action, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <PressableScale testID={`${testID}-back`} accessibilityLabel={t("common.back")} onPress={onBack} style={styles.btn}>
          <Icon name={isRTL ? "chevronRight" : "chevronLeft"} size={20} color={colors.textSoft} strokeWidth={2.2} />
        </PressableScale>
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, subtitleAccent && styles.subtitleAccent]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action ? (
          <PressableScale testID={action.testID} accessibilityLabel={action.label} onPress={action.onPress} style={styles.btn}>
            <Icon name={action.icon} size={20} color={action.accent ? colors.accentSky : colors.textSoft} />
          </PressableScale>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassCard,
    borderWidth: 1,
    borderColor: c.white10,
  },
  spacer: { width: 44 },
  center: { flex: 1, alignItems: "center" },
  title: { color: c.textStrong, fontSize: 17, fontWeight: "600", letterSpacing: 0.2 },
  subtitle: { color: c.muted, fontSize: 11, marginTop: 2 },
  subtitleAccent: { color: c.accentBlue, fontWeight: "500" },
}));

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

/** Screen header: glass back button, perfectly centered title (independent of side buttons), optional glass action. */
export function ScreenHeader({ title, subtitle, subtitleAccent, onBack, action, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View pointerEvents="none" style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, subtitleAccent && styles.subtitleAccent]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <PressableScale testID={`${testID}-back`} accessibilityLabel={t("common.back")} onPress={onBack} style={styles.btn}>
          <Icon name={isRTL ? "chevronRight" : "chevronLeft"} size={20} color={colors.textStrong} strokeWidth={2.2} />
        </PressableScale>
        {action ? (
          <PressableScale
            testID={action.testID}
            accessibilityLabel={action.label}
            onPress={action.onPress}
            style={[styles.btn, action.accent && styles.btnAccent]}
          >
            <Icon name={action.icon} size={20} color={action.accent ? colors.accentSky : colors.textStrong} />
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
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
  },
  btnAccent: { backgroundColor: c.brandTertiary, borderColor: c.blueBorder },
  spacer: { width: 44 },
  center: { position: "absolute", start: 56, end: 56, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  title: { color: c.textStrong, fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { color: c.muted, fontSize: 12, marginTop: 2, textAlign: "center" },
  subtitleAccent: { color: c.accentBlue, fontWeight: "500" },
}));

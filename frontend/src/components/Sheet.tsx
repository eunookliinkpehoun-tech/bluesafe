import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";

/** Glass bottom sheet rendered inside the tab layout overlay host (above the nav bar). */
export function Sheet({ title, onClose, children, testID }: { title: string; onClose: () => void; children: ReactNode; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.host}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(180)} style={styles.backdrop}>
        <Pressable testID={`${testID}-backdrop`} style={styles.fill} onPress={onClose} />
      </Animated.View>
      <KeyboardStickyView style={styles.sticky} offset={{ opened: insets.bottom }}>
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(180)}
          exiting={SlideOutDown.duration(220)}
          testID={testID}
          style={[styles.panel, { paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <PressableScale testID={`${testID}-close`} accessibilityLabel={t("common.close")} onPress={onClose} style={styles.close}>
              <Icon name="x" size={18} color={colors.textSoft} />
            </PressableScale>
          </View>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  host: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0, backgroundColor: c.overlay },
  fill: { flex: 1 },
  sticky: { width: "100%", alignItems: "center" },
  panel: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "92%",
    backgroundColor: c.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: c.white10,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: c.canvas,
    shadowOpacity: 0.7,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 24,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.white15, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { flex: 1, color: c.textStrong, fontSize: 18, fontWeight: "700" },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.border,
  },
  body: { gap: 16, paddingBottom: 4 },
}));

import type { ReactNode } from "react";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";

/** Glass bottom sheet rendered inside the tab layout overlay host (above the nav bar). */
export function Sheet({
  title,
  onClose,
  children,
  testID,
  scrollable = true,
  size = "auto",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  testID: string;
  /** Off for sheets that host their own scrolling content (wheel pickers). */
  scrollable?: boolean;
  /** `half` is 50% of the screen, `tall` is 86%. */
  size?: "auto" | "half" | "tall";
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const pinned = size === "half" ? 0.5 : size === "tall" ? 0.86 : 0;
  return (
    <View style={styles.host}>
      <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(100)} style={styles.backdrop}>
        <Pressable testID={`${testID}-backdrop`} style={styles.fill} onPress={onClose} />
      </Animated.View>
      <KeyboardStickyView style={[styles.sticky, pinned > 0 && { maxHeight: size === "tall" ? "86%" : "50%" }]} offset={{ opened: insets.bottom }}>
        <Animated.View
          entering={SlideInDown.duration(200).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(150).easing(Easing.in(Easing.cubic))}
          testID={testID}
          style={[styles.panel, pinned > 0 && { height: Math.round(windowHeight * pinned) }, { paddingBottom: insets.bottom + 20 }]}
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
          {scrollable ? (
            <KeyboardAwareScrollView
              bottomOffset={24}
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={[styles.scroll, pinned > 0 && styles.scrollHalf]}
              contentContainerStyle={styles.body}
            >
              {children}
            </KeyboardAwareScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
        </Animated.View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  host: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, bottom: 0, start: 0, end: 0, backgroundColor: c.overlay },
  fill: { flex: 1 },
  sticky: { width: "100%", alignItems: "center", maxHeight: "92%" },
  panel: {
    width: "100%",
    maxWidth: 560,
    flexShrink: 1,
    backgroundColor: c.sheet,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: c.white10,
    borderTopColor: c.glassHighlight,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -10 },
    elevation: 24,
  },
  handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: c.white15, marginBottom: 14 },
  header: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  title: { flex: 1, color: c.textStrong, fontSize: 20, fontWeight: "700" },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: c.border,
  },
  scroll: { flexShrink: 1 },
  scrollHalf: { flex: 1 },
  body: { gap: 18, paddingBottom: 4 },
}));

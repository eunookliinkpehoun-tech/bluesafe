import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  /** Fade the control when disabled (off for buttons that draw their own disabled look). */
  dimWhenDisabled?: boolean;
  children?: ReactNode;
};

export function PressableScale({ style, scaleTo = 0.95, haptic = true, dimWhenDisabled = true, onPress, disabled, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 420 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 320 });
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && Platform.OS !== "web") Haptics.selectionAsync().catch(() => undefined);
        onPress?.(e);
      }}
      style={[style, animated, disabled && dimWhenDisabled ? { opacity: 0.45 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}

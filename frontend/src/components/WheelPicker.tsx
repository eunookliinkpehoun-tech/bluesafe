import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { makeStyles } from "@/src/theme";

export const WHEEL_ITEM_H = 44;
export const WHEEL_VISIBLE = 5;

let tickPlayer: AudioPlayer | null = null;

/** One notch crossed: light selection haptic + discreet "tic" like the iOS picker. */
function tick() {
  if (Platform.OS === "web") (globalThis.navigator as { vibrate?: (ms: number) => void } | undefined)?.vibrate?.(4);
  else Haptics.selectionAsync().catch(() => undefined);
  if (!tickPlayer) {
    tickPlayer = createAudioPlayer(require("../../assets/sounds/tick.wav"));
    tickPlayer.volume = 0.35;
  }
  tickPlayer.seekTo(0);
  tickPlayer.play();
}

function WheelItem({ label, index, y, onPress }: { label: string; index: number; y: SharedValue<number>; onPress: () => void }) {
  const styles = useStyles();
  // Cylinder effect: the centered row is sharp, neighbours fade, shrink and tilt away.
  const style = useAnimatedStyle(() => {
    const d = (y.value - index * WHEEL_ITEM_H) / WHEEL_ITEM_H;
    const ad = Math.abs(d);
    return {
      opacity: interpolate(ad, [0, 1, 2, 3], [1, 0.45, 0.2, 0.06], Extrapolation.CLAMP),
      transform: [
        { perspective: 500 },
        { rotateX: `${interpolate(d, [-3, 0, 3], [-62, 0, 62], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(ad, [0, 2], [1, 0.86], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.item, style]}>
        <Text style={styles.itemText} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** One vertical wheel column with inertia, snapping and a haptic notch per value. */
export function WheelColumn({
  items,
  index,
  onChange,
  flex = 1,
  testID,
}: {
  items: string[];
  index: number;
  onChange: (i: number) => void;
  flex?: number;
  testID: string;
}) {
  const styles = useStyles();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const y = useSharedValue(index * WHEEL_ITEM_H);
  const last = useSharedValue(index);
  const current = useRef(index);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const max = items.length - 1;

  const onNotch = (i: number) => {
    tick();
    current.current = i;
    clearTimeout(timer.current);
    // Commit once the wheel settles, and snap precisely (web has no native snapping).
    timer.current = setTimeout(() => {
      ref.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated: true });
      onChange(i);
    }, 160);
  };

  const onScroll = useAnimatedScrollHandler(
    (e) => {
      y.value = e.contentOffset.y;
      const i = Math.min(max, Math.max(0, Math.round(e.contentOffset.y / WHEEL_ITEM_H)));
      if (i !== last.value) {
        last.value = i;
        runOnJS(onNotch)(i);
      }
    },
    [max],
  );

  // Follow external changes (e.g. day 31 clamped to 30 when the month changes).
  useEffect(() => {
    if (current.current === index) return;
    current.current = index;
    last.value = index;
    ref.current?.scrollTo({ y: index * WHEEL_ITEM_H, animated: true });
  }, [index, last, ref]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <View style={[styles.column, { flex }]} testID={testID}>
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        onLayout={() => ref.current?.scrollTo({ y: index * WHEEL_ITEM_H, animated: false })}
        contentContainerStyle={styles.content}
      >
        {items.map((label, i) => (
          <WheelItem key={`${label}-${i}`} label={label} index={i} y={y} onPress={() => ref.current?.scrollTo({ y: i * WHEEL_ITEM_H, animated: true })} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  column: { height: WHEEL_ITEM_H * WHEEL_VISIBLE },
  content: { paddingVertical: WHEEL_ITEM_H * 2 },
  item: { height: WHEEL_ITEM_H, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  itemText: { color: c.textStrong, fontSize: 20, fontWeight: "500", textAlign: "center" },
}));

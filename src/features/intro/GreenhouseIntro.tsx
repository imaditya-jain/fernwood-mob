import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { Text } from "@/components/Text";
import { pickTip, timeOfDayGreeting } from "@/features/intro/greeting";
import { colors, fonts } from "@/theme/tokens";

/** Spores drift up through the warm greenhouse air. Fixed positions so both halves of the doors match exactly. */
const SPORES = [
  { x: 0.12, size: 5, delay: 0, duration: 4200 },
  { x: 0.27, size: 3, delay: 600, duration: 5200 },
  { x: 0.41, size: 6, delay: 300, duration: 4600 },
  { x: 0.55, size: 4, delay: 1100, duration: 5000 },
  { x: 0.68, size: 5, delay: 200, duration: 4400 },
  { x: 0.79, size: 3, delay: 900, duration: 5400 },
  { x: 0.9, size: 6, delay: 500, duration: 4800 },
  { x: 0.34, size: 4, delay: 1400, duration: 5000 },
] as const;

type Clock = {
  stem: SharedValue<number>;
  leafLeft: SharedValue<number>;
  leafRight: SharedValue<number>;
  title: SharedValue<number>;
  lines: SharedValue<number>;
  sway: SharedValue<number>;
};

const STEM_LENGTH = 92;

function Spore({ spec, width, height }: { spec: (typeof SPORES)[number]; width: number; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(spec.delay, withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1));
    return () => cancelAnimation(t);
  }, [t, spec]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.15, 0.85, 1], [0, 0.55, 0.55, 0]),
    transform: [{ translateY: interpolate(t.value, [0, 1], [height * 0.2, -height * 0.55]) }, { translateX: Math.sin(t.value * 6.28) * 10 }],
  }));
  return (
    <Animated.View
      style={[
        { position: "absolute", left: spec.x * width, bottom: height * 0.18, width: spec.size, height: spec.size, borderRadius: spec.size, backgroundColor: colors.sage },
        style,
      ]}
    />
  );
}

/** The scene: warm forest light, drifting spores, a sprout that grows, then the name and a greeting. */
function Scene({ clock, greeting, tip, width, height }: { clock: Clock; greeting: string; tip: string; width: number; height: number }) {
  const leafLeft = useAnimatedStyle(() => ({
    opacity: clock.leafLeft.value,
    transform: [{ translateX: 8 }, { translateY: 6 }, { rotate: `${interpolate(clock.leafLeft.value, [0, 1], [-35, 0])}deg` }, { scale: clock.leafLeft.value }, { translateX: -8 }, { translateY: -6 }],
  }));
  const leafRight = useAnimatedStyle(() => ({
    opacity: clock.leafRight.value,
    transform: [{ rotate: `${interpolate(clock.leafRight.value, [0, 1], [35, 0])}deg` }, { scale: clock.leafRight.value }],
  }));
  const glow = useAnimatedStyle(() => ({
    opacity: interpolate(clock.stem.value, [0, 1], [0, 0.35]),
    transform: [{ scale: interpolate(clock.sway.value, [0, 1], [0.92, 1.08]) }],
  }));
  const title = useAnimatedStyle(() => ({
    opacity: clock.title.value,
    transform: [{ translateY: interpolate(clock.title.value, [0, 1], [16, 0]) }],
  }));
  const lines = useAnimatedStyle(() => ({
    opacity: clock.lines.value,
    transform: [{ translateY: interpolate(clock.lines.value, [0, 1], [12, 0]) }],
  }));
  const stem = useAnimatedStyle(() => ({ transform: [{ scaleY: clock.stem.value }], opacity: clock.stem.value > 0.02 ? 1 : 0 }));

  return (
    <View style={{ width, height }}>
      <LinearGradient colors={[colors.forestDeep, "#233a1e", colors.forest]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.glow, { left: width / 2 - 170, top: height * 0.34 - 170 }, glow]} />
      {SPORES.map((spec) => (
        <Spore key={spec.x} spec={spec} width={width} height={height} />
      ))}
      <View style={[styles.center, { top: height * 0.3 }]} pointerEvents="none">
        <View style={{ width: 120, height: 130 }}>
          <Animated.View style={[{ position: "absolute", left: 57, bottom: 0, width: 6, height: STEM_LENGTH, borderRadius: 3, backgroundColor: colors.sage, transformOrigin: "bottom" }, stem]} />
          <Animated.View style={[{ position: "absolute", left: 6, top: 18 }, leafLeft]}>
            <Svg width={56} height={54} viewBox="0 0 56 54">
              <Path d="M54 50C54 22 36 4 6 4c0 28 16 46 48 46Z" fill={colors.cream} />
            </Svg>
          </Animated.View>
          <Animated.View style={[{ position: "absolute", left: 58, top: 4 }, leafRight]}>
            <Svg width={56} height={54} viewBox="0 0 56 54">
              <Path d="M2 50C2 22 20 4 50 4c0 28-16 46-48 46Z" fill={colors.sageLight} />
            </Svg>
          </Animated.View>
        </View>
        <Animated.View style={[{ alignItems: "center", marginTop: 14 }, title]}>
          <Text variant="display" style={{ color: colors.cream, fontSize: 46, lineHeight: 50 }}>
            Fernwood
          </Text>
          <Text variant="eyebrow" style={{ color: colors.sage, marginTop: 6 }}>
            Nursery · Greenhouse
          </Text>
        </Animated.View>
        <Animated.View style={[{ alignItems: "center", marginTop: 30, paddingHorizontal: 40 }, lines]}>
          <Text variant="title" style={{ color: colors.cream, fontSize: 22, textAlign: "center" }}>
            {greeting}. Welcome to the greenhouse.
          </Text>
          <Text variant="small" style={{ color: colors.cream, opacity: 0.75, textAlign: "center", marginTop: 10, fontFamily: fonts.body }}>
            {tip}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

/** Glass-pane lines and a handle, so each half reads as a greenhouse door. */
function Mullions({ side, width, height }: { side: "left" | "right"; width: number; height: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0.33, 0.66].map((x) => (
        <View key={x} style={{ position: "absolute", left: x * width, top: 0, bottom: 0, width: StyleSheet.hairlineWidth * 2, backgroundColor: "rgba(155,171,138,0.22)" }} />
      ))}
      {[0.3, 0.62].map((y) => (
        <View key={y} style={{ position: "absolute", top: y * height, left: 0, right: 0, height: StyleSheet.hairlineWidth * 2, backgroundColor: "rgba(155,171,138,0.22)" }} />
      ))}
      <View style={{ position: "absolute", top: height * 0.47, [side === "left" ? "right" : "left"]: 10, width: 4, height: 70, borderRadius: 2, backgroundColor: "rgba(250,243,229,0.7)" }} />
    </View>
  );
}

/**
 * Every launch opens like stepping into the nursery: the sprout grows, the name and a time-of-day welcome appear,
 * then the greenhouse doors slide apart onto the shop. It runs while the catalogue loads, can be skipped with a
 * tap, and with "Reduce motion" on it is a short, still fade instead.
 */
export function GreenhouseIntro({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const half = width / 2;
  const greeting = useMemo(() => timeOfDayGreeting(), []);
  const tip = useMemo(() => pickTip(), []);

  const clock: Clock = {
    stem: useSharedValue(0),
    leafLeft: useSharedValue(0),
    leafRight: useSharedValue(0),
    title: useSharedValue(0),
    lines: useSharedValue(0),
    sway: useSharedValue(0),
  };
  const doors = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      for (const key of ["stem", "leafLeft", "leafRight", "title", "lines"] as const) clock[key].value = withTiming(1, { duration: 250 });
      fade.value = withDelay(900, withTiming(0, { duration: 300 }, (finished) => finished && runOnJS(onDone)()));
      return;
    }
    clock.sway.value = withRepeat(withSequence(withTiming(1, { duration: 1800 }), withTiming(0, { duration: 1800 })), -1);
    clock.stem.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    clock.leafLeft.value = withDelay(520, withSpring(1, { damping: 11, stiffness: 120 }));
    clock.leafRight.value = withDelay(720, withSpring(1, { damping: 11, stiffness: 120 }));
    clock.title.value = withDelay(950, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    clock.lines.value = withDelay(1350, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    const haptic = setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft), 2350);
    doors.value = withDelay(
      2400,
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    return () => {
      clearTimeout(haptic);
      cancelAnimation(doors);
    };
    // The intro runs once per launch; shared values are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (reduced) return onDone();
    cancelAnimation(doors);
    doors.value = withTiming(1, { duration: 420, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  };

  const left = useAnimatedStyle(() => ({ transform: [{ translateX: -doors.value * half }] }));
  const right = useAnimatedStyle(() => ({ transform: [{ translateX: doors.value * half }] }));
  const wrapper = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100 }, wrapper]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip the welcome" onPress={skip} style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.half, { left: 0, width: half, height }, left]}>
          <View style={{ width, height }}>
            <Scene clock={clock} greeting={greeting} tip={tip} width={width} height={height} />
          </View>
          <Mullions side="left" width={half} height={height} />
        </Animated.View>
        <Animated.View style={[styles.half, { right: 0, width: half, height }, right]}>
          <View style={{ width, height, marginLeft: -half }}>
            <Scene clock={clock} greeting={greeting} tip={tip} width={width} height={height} />
          </View>
          <Mullions side="right" width={half} height={height} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  half: { position: "absolute", top: 0, overflow: "hidden" },
  glow: { position: "absolute", width: 340, height: 340, borderRadius: 170, backgroundColor: colors.sage },
  center: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});

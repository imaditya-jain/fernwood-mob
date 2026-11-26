import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
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
  withTiming,
} from "react-native-reanimated";

import { Text } from "@/components/Text";
import { pickTip, timeOfDayGreeting } from "@/features/intro/greeting";
import { colors } from "@/theme/tokens";

const PHOTO = `${process.env.EXPO_PUBLIC_API_URL ?? ""}/images/seasonal-greenhouse.jpg`;

type Plant = {
  source: number;
  /** Image proportions (height / width), so layout never has to wait for the picture to load. */
  aspect: number;
  /** Offset from this side's edge and from the bottom, as fractions of the screen. Negative hangs off-screen. */
  x: number;
  bottom: number;
  /** Width as a fraction of the screen width. */
  size: number;
  rotate: number;
  mirror?: boolean;
  /** How far this plant sways, so the group never moves in unison. */
  sway: number;
  phase: number;
};

/** Real plant photographs (cut out from the shop's own product pictures), arranged in two depth layers per side. */
const SIDES: Record<"left" | "right", Record<"back" | "front", Plant[]>> = {
  left: {
    back: [
      { source: require("../../../assets/foliage/calathea-back.webp"), aspect: 1.0, x: -0.14, bottom: 0.3, size: 0.66, rotate: 10, sway: 0.8, phase: 0.1 },
      { source: require("../../../assets/foliage/zz-back.webp"), aspect: 1.15, x: 0.02, bottom: 0.56, size: 0.5, rotate: 24, sway: 0.9, phase: 0.5 },
    ],
    front: [
      { source: require("../../../assets/foliage/monstera.webp"), aspect: 0.96, x: -0.24, bottom: -0.1, size: 1.0, rotate: 6, sway: 1, phase: 0.2 },
      { source: require("../../../assets/foliage/bird.webp"), aspect: 1.15, x: -0.1, bottom: 0.26, size: 0.66, rotate: 20, sway: 1.2, phase: 0.7 },
    ],
  },
  right: {
    back: [{ source: require("../../../assets/foliage/peace-back.webp"), aspect: 0.78, x: -0.1, bottom: 0.4, size: 0.62, rotate: -12, mirror: true, sway: 0.8, phase: 0.3 }],
    front: [
      { source: require("../../../assets/foliage/fiddle.webp"), aspect: 1.31, x: -0.2, bottom: -0.1, size: 0.78, rotate: -8, mirror: true, sway: 1, phase: 0.6 },
      { source: require("../../../assets/foliage/fern.webp"), aspect: 0.97, x: -0.12, bottom: 0.08, size: 0.72, rotate: -26, mirror: true, sway: 1.2, phase: 0.1 },
    ],
  },
};

function PlantImage({ plant, side, sway, width, height }: { plant: Plant; side: "left" | "right"; sway: SharedValue<number>; width: number; height: number }) {
  const w = plant.size * width;
  const h = w * plant.aspect;
  const style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${plant.rotate + Math.sin((sway.value + plant.phase) * 6.283) * 2.2 * plant.sway}deg` },
      { scale: 1 + Math.sin((sway.value + plant.phase) * 6.283) * 0.012 * plant.sway },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: "absolute", width: w, height: h, bottom: plant.bottom * height, [side]: plant.x * width, transformOrigin: "50% 100%" },
        style,
      ]}
    >
      <Image source={plant.source} style={{ width: w, height: h, transform: [{ scaleX: plant.mirror ? -1 : 1 }] }} contentFit="contain" />
    </Animated.View>
  );
}

function Cluster({ side, layer, open, sway, width, height }: { side: "left" | "right"; layer: "back" | "front"; open: SharedValue<number>; sway: SharedValue<number>; width: number; height: number }) {
  const dir = side === "left" ? -1 : 1;
  const speed = layer === "front" ? 1 : 0.6;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.8, 1], [1, 1, 0]),
    transform: [{ translateX: dir * open.value * width * 0.95 * speed }, { rotate: `${dir * open.value * 9 * speed}deg` }, { scale: 1 + open.value * 0.14 }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {SIDES[side][layer].map((plant, index) => (
        <PlantImage key={index} plant={plant} side={side} sway={sway} width={width} height={height} />
      ))}
    </Animated.View>
  );
}

function Shaft({ left, tilt, delay, width, height }: { left: number; tilt: number; delay: number; width: number; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 2600 }), withTiming(0.35, { duration: 2600 })), -1));
    return () => cancelAnimation(t);
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0, 1], [0.05, 0.22]) }));
  return (
    <Animated.View style={[{ position: "absolute", top: -height * 0.1, left: left * width, width: width * 0.22, height: height * 1.3, transform: [{ rotate: `${tilt}deg` }] }, style]} pointerEvents="none">
      <LinearGradient colors={["rgba(255,244,214,0.9)", "rgba(255,244,214,0)"]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

/**
 * Second welcome: walking into a lush greenhouse. A real photograph of the nursery slowly settles behind layers of
 * real plant photographs (monstera, bird of paradise, fiddle-leaf fig, fern) swaying in warm light shafts; the name appears, then the foliage parts like a path
 * through the plants. Same rules as the other welcome: skippable, runs while the shop loads, calm with Reduce motion.
 */
export function JungleIntro({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const greeting = useMemo(() => timeOfDayGreeting(), []);
  const tip = useMemo(() => pickTip(), []);

  const sway = useSharedValue(0);
  const open = useSharedValue(0);
  const settle = useSharedValue(0);
  const title = useSharedValue(0);
  const lines = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      settle.value = withTiming(1, { duration: 250 });
      title.value = withTiming(1, { duration: 250 });
      lines.value = withTiming(1, { duration: 250 });
      fade.value = withDelay(900, withTiming(0, { duration: 300 }, (finished) => finished && runOnJS(onDone)()));
      return;
    }
    sway.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1);
    settle.value = withTiming(1, { duration: 2600, easing: Easing.out(Easing.cubic) });
    title.value = withDelay(700, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    lines.value = withDelay(1200, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    const haptic = setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft), 2350);
    open.value = withDelay(
      2450,
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    return () => {
      clearTimeout(haptic);
      cancelAnimation(open);
    };
    // Once per launch; shared values are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (reduced) return onDone();
    cancelAnimation(open);
    open.value = withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  };

  const photo = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(settle.value, [0, 1], [1.18, 1.04]) + open.value * 0.1 }] }));
  const textBlock = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.35], [1, 0], "clamp") }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: title.value, transform: [{ translateY: interpolate(title.value, [0, 1], [18, 0]) }] }));
  const linesStyle = useAnimatedStyle(() => ({ opacity: lines.value, transform: [{ translateY: interpolate(lines.value, [0, 1], [12, 0]) }] }));
  const veil = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.7, 1], [1, 0.6, 0]) }));
  const wrapper = useAnimatedStyle(() => ({ opacity: fade.value * interpolate(open.value, [0.8, 1], [1, 0], "clamp") }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: colors.forestDeep }, wrapper]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip the welcome" onPress={skip} style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, photo]}>
          <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, veil]}>
          <LinearGradient colors={["rgba(26,44,22,0.82)", "rgba(26,44,22,0.5)", "rgba(26,44,22,0.9)"]} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Shaft left={0.18} tilt={14} delay={0} width={width} height={height} />
        <Shaft left={0.46} tilt={14} delay={900} width={width} height={height} />
        <Shaft left={0.7} tilt={14} delay={400} width={width} height={height} />

        <Cluster side="left" layer="back" open={open} sway={sway} width={width} height={height} />
        <Cluster side="right" layer="back" open={open} sway={sway} width={width} height={height} />

        <Animated.View style={[styles.text, { top: height * 0.34 }, textBlock]} pointerEvents="none">
          <Animated.View style={[{ alignItems: "center" }, titleStyle]}>
            <Text variant="eyebrow" style={{ color: colors.sage, letterSpacing: 4 }}>
              Step into the greenhouse
            </Text>
            <Text variant="display" style={{ color: colors.cream, fontSize: 56, lineHeight: 60, marginTop: 10 }}>
              Fernwood
            </Text>
          </Animated.View>
          <Animated.View style={[{ alignItems: "center", marginTop: 22, paddingHorizontal: 44 }, linesStyle]}>
            <Text variant="title" style={{ color: colors.cream, fontSize: 21, textAlign: "center" }}>
              {greeting}. Take your time.
            </Text>
            <Text variant="small" style={{ color: colors.cream, opacity: 0.75, textAlign: "center", marginTop: 8 }}>
              {tip}
            </Text>
          </Animated.View>
        </Animated.View>

        <Cluster side="left" layer="front" open={open} sway={sway} width={width} height={height} />
        <Cluster side="right" layer="front" open={open} sway={sway} width={width} height={height} />
        <View style={styles.vignette} pointerEvents="none" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  vignette: { ...StyleSheet.absoluteFill, borderWidth: 0 },
});

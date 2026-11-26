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

const SITE = process.env.EXPO_PUBLIC_API_URL ?? "";
const PHOTO = `${SITE}/images/seasonal-greenhouse.jpg`;

type Layer = "far" | "mid" | "front" | "near";
type Side = "left" | "right";

type Plant = {
  source: number;
  /** Image proportions (height / width), so layout never waits for the picture to load. */
  aspect: number;
  /** Distance from this side's edge and from the bottom, as fractions of the screen. Negative hangs off-screen. */
  x: number;
  bottom: number;
  /** Width as a fraction of the screen width. */
  size: number;
  rotate: number;
  mirror?: boolean;
  /** How far this plant sways in the wind, so the group never moves in unison. */
  sway: number;
  phase: number;
};

/**
 * Real plant photographs cut out from the shop's own product pictures, in four depths. Far plants are dark and
 * soft, near ones are out of focus and huge, like leaves brushing the camera as you walk in.
 */
const WORLD: Record<Layer, Record<Side, Plant[]>> = {
  far: {
    left: [
      { source: require("../../../assets/foliage/calathea-back.webp"), aspect: 1.0, x: -0.14, bottom: 0.32, size: 0.66, rotate: 10, sway: 0.7, phase: 0.1 },
      { source: require("../../../assets/foliage/zz-back.webp"), aspect: 1.15, x: 0.04, bottom: 0.58, size: 0.5, rotate: 24, sway: 0.8, phase: 0.5 },
    ],
    right: [
      { source: require("../../../assets/foliage/peace-back.webp"), aspect: 0.78, x: -0.1, bottom: 0.42, size: 0.62, rotate: -12, mirror: true, sway: 0.7, phase: 0.3 },
      { source: require("../../../assets/foliage/zz-back.webp"), aspect: 1.15, x: 0.02, bottom: 0.62, size: 0.46, rotate: -26, mirror: true, sway: 0.8, phase: 0.8 },
    ],
  },
  mid: {
    left: [{ source: require("../../../assets/foliage/peace-mid.webp"), aspect: 0.78, x: -0.1, bottom: 0.12, size: 0.74, rotate: 14, sway: 0.9, phase: 0.35 }],
    right: [{ source: require("../../../assets/foliage/calathea-mid.webp"), aspect: 1.0, x: -0.16, bottom: 0.28, size: 0.62, rotate: -16, sway: 0.9, phase: 0.65 }],
  },
  front: {
    left: [
      { source: require("../../../assets/foliage/monstera.webp"), aspect: 0.96, x: -0.24, bottom: -0.1, size: 1.0, rotate: 6, sway: 1, phase: 0.2 },
      { source: require("../../../assets/foliage/bird.webp"), aspect: 1.15, x: -0.12, bottom: 0.1, size: 0.62, rotate: 18, sway: 1.2, phase: 0.7 },
    ],
    right: [
      { source: require("../../../assets/foliage/fiddle.webp"), aspect: 1.31, x: -0.2, bottom: -0.1, size: 0.78, rotate: -8, mirror: true, sway: 1, phase: 0.6 },
      { source: require("../../../assets/foliage/fern.webp"), aspect: 0.97, x: -0.12, bottom: 0.08, size: 0.72, rotate: -26, mirror: true, sway: 1.2, phase: 0.1 },
    ],
  },
  near: {
    left: [
      { source: require("../../../assets/foliage/monstera-near.webp"), aspect: 0.96, x: -0.55, bottom: -0.32, size: 1.05, rotate: 14, sway: 0.5, phase: 0.45 },
      { source: require("../../../assets/foliage/bird-near.webp"), aspect: 1.15, x: -0.42, bottom: 0.9, size: 0.7, rotate: 160, sway: 0.5, phase: 0.9 },
    ],
    right: [{ source: require("../../../assets/foliage/fiddle-near.webp"), aspect: 1.31, x: -0.5, bottom: -0.3, size: 0.8, rotate: -18, mirror: true, sway: 0.5, phase: 0.15 }],
  },
};

/** How far each depth travels as the plants part (near moves most) and how much it grows as you walk in. */
const PARALLAX: Record<Layer, { part: number; dolly: number }> = {
  far: { part: 0.5, dolly: 0.04 },
  mid: { part: 0.75, dolly: 0.08 },
  front: { part: 1, dolly: 0.13 },
  near: { part: 1.4, dolly: 0.26 },
};

const TAU = Math.PI * 2;
/** A soft shadow keeps the words readable over leaves and light. */
const legible = { textShadowColor: "rgba(10,20,8,0.65)", textShadowRadius: 14, textShadowOffset: { width: 0, height: 1 } } as const;

function PlantImage({ plant, side, wind, width, height }: { plant: Plant; side: Side; wind: SharedValue<number>; width: number; height: number }) {
  const w = plant.size * width;
  const h = w * plant.aspect;
  // A gust travels across the screen: plants nearer the middle start to move a moment after those at the edge.
  const lag = plant.x * 0.6 + plant.phase;
  const style = useAnimatedStyle(() => {
    const t = (wind.value + lag) * TAU;
    return {
      transform: [
        { rotate: `${plant.rotate + Math.sin(t) * 2.4 * plant.sway}deg` },
        { skewX: `${Math.sin(t * 1.7 + 1) * 1.1 * plant.sway}deg` },
        { scale: 1 + Math.sin(t * 0.8) * 0.012 * plant.sway },
      ],
    };
  });
  return (
    <Animated.View style={[{ position: "absolute", width: w, height: h, bottom: plant.bottom * height, [side]: plant.x * width, transformOrigin: "50% 100%" }, style]}>
      <Image source={plant.source} style={{ width: w, height: h, transform: [{ scaleX: plant.mirror ? -1 : 1 }] }} contentFit="contain" />
    </Animated.View>
  );
}

function Depth({ layer, side, open, walk, wind, width, height }: { layer: Layer; side: Side; open: SharedValue<number>; walk: SharedValue<number>; wind: SharedValue<number>; width: number; height: number }) {
  const dir = side === "left" ? -1 : 1;
  const { part, dolly } = PARALLAX[layer];
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.82, 1], [1, 1, 0]),
    transform: [
      { translateX: dir * open.value * width * 0.95 * part },
      { rotate: `${dir * open.value * 9 * part}deg` },
      // Walking in: the closer the layer, the faster it grows toward you.
      { scale: 1 + walk.value * dolly + open.value * dolly },
    ],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {WORLD[layer][side].map((plant, index) => (
        <PlantImage key={index} plant={plant} side={side} wind={wind} width={width} height={height} />
      ))}
    </Animated.View>
  );
}

function Shaft({ left, tilt, delay, width, height }: { left: number; tilt: number; delay: number; width: number; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 2600 }), withTiming(0.3, { duration: 2600 })), -1));
    return () => cancelAnimation(t);
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0, 1], [0.05, 0.26]) }));
  return (
    <Animated.View style={[{ position: "absolute", top: -height * 0.1, left: left * width, width: width * 0.2, height: height * 1.3, transform: [{ rotate: `${tilt}deg` }] }, style]} pointerEvents="none">
      <LinearGradient colors={["rgba(255,236,190,0.95)", "rgba(255,236,190,0)"]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

/** Warm dust floating in the light, drifting upward at different speeds. Fixed layout so it never jumps between renders. */
const DUST = [
  { x: 0.2, size: 4, delay: 0, duration: 5200 },
  { x: 0.34, size: 6, delay: 900, duration: 6200 },
  { x: 0.48, size: 3, delay: 300, duration: 5000 },
  { x: 0.57, size: 5, delay: 1500, duration: 6600 },
  { x: 0.69, size: 4, delay: 600, duration: 5600 },
  { x: 0.8, size: 7, delay: 1200, duration: 7000 },
  { x: 0.42, size: 3, delay: 2000, duration: 5800 },
  { x: 0.26, size: 5, delay: 2600, duration: 6400 },
] as const;

function Dust({ spec, width, height }: { spec: (typeof DUST)[number]; width: number; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(spec.delay, withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1));
    return () => cancelAnimation(t);
  }, [t, spec]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.2, 0.8, 1], [0, 0.7, 0.7, 0]),
    transform: [{ translateY: interpolate(t.value, [0, 1], [height * 0.1, -height * 0.5]) }, { translateX: Math.sin(t.value * TAU) * 14 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: spec.x * width, bottom: height * 0.3, width: spec.size, height: spec.size, borderRadius: spec.size, backgroundColor: "#ffe9b8", shadowColor: "#ffe9b8", shadowOpacity: 0.9, shadowRadius: 6 }, style]}
    />
  );
}

/** Low mist drifting slowly across the floor of the greenhouse. */
function Mist({ top, delay, width, height }: { top: number; delay: number; width: number; height: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) })), -1));
    return () => cancelAnimation(t);
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(t.value, [0, 1], [-width * 0.15, width * 0.15]) }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", top: top * height, left: -width * 0.2, width: width * 1.4, height: height * 0.16 }, style]}>
      <LinearGradient colors={["rgba(225,235,210,0)", "rgba(225,235,210,0.13)", "rgba(225,235,210,0)"]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

/**
 * The welcome: walking into a lush greenhouse. A real photograph of the nursery sits behind four depths of real
 * plant photographs (far and dark, mid, sharp, and huge out-of-focus leaves brushing the lens). You slowly walk in,
 * wind passes through the leaves, warm dust floats in the light shafts and mist drifts low; then the plants part
 * like a path. Skippable, runs while the shop loads, and a short still fade with Reduce motion.
 */
export function JungleIntro({ onReady, onDone }: { onReady: () => void; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const greeting = useMemo(() => timeOfDayGreeting(), []);
  const tip = useMemo(() => pickTip(), []);

  const wind = useSharedValue(0);
  const walk = useSharedValue(0);
  const open = useSharedValue(0);
  const title = useSharedValue(0);
  const lines = useSharedValue(0);
  const fade = useSharedValue(1);

  // The launch screen is held until the welcome has been laid out, so the home page is never seen first.
  useEffect(() => {
    onReady();
    // Once per launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduced) {
      title.value = withTiming(1, { duration: 250 });
      lines.value = withTiming(1, { duration: 250 });
      fade.value = withDelay(900, withTiming(0, { duration: 300 }, (finished) => finished && runOnJS(onDone)()));
      return;
    }
    wind.value = withRepeat(withTiming(1, { duration: 6400, easing: Easing.linear }), -1);
    walk.value = withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) });
    title.value = withDelay(700, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    lines.value = withDelay(1250, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    const haptic = setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft), 2400);
    open.value = withDelay(
      2500,
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.cubic) }, (finished) => {
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
    open.value = withTiming(1, { duration: 560, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  };

  const photo = useAnimatedStyle(() => ({ transform: [{ scale: 1.18 - walk.value * 0.1 + open.value * 0.12 }] }));
  const textBlock = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.35], [1, 0], "clamp") }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: title.value, transform: [{ translateY: interpolate(title.value, [0, 1], [18, 0]) }] }));
  const linesStyle = useAnimatedStyle(() => ({ opacity: lines.value, transform: [{ translateY: interpolate(lines.value, [0, 1], [12, 0]) }] }));
  const veil = useAnimatedStyle(() => ({ opacity: interpolate(open.value, [0, 0.7, 1], [1, 0.55, 0]) }));
  const wrapper = useAnimatedStyle(() => ({ opacity: fade.value * interpolate(open.value, [0.82, 1], [1, 0], "clamp") }));

  const depth = (layer: Layer) => (
    <>
      <Depth layer={layer} side="left" open={open} walk={walk} wind={wind} width={width} height={height} />
      <Depth layer={layer} side="right" open={open} walk={walk} wind={wind} width={width} height={height} />
    </>
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: colors.forestDeep }, wrapper]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip the welcome" onPress={skip} style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, photo]}>
          <Image source={{ uri: PHOTO }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, veil]}>
          <LinearGradient colors={["rgba(26,44,22,0.8)", "rgba(26,44,22,0.46)", "rgba(20,34,17,0.92)"]} style={StyleSheet.absoluteFill} />
          {/* Golden-hour warmth from the top corner, cool shade in the foreground. */}
          <LinearGradient colors={["rgba(255,214,140,0.2)", "rgba(255,214,140,0)"]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 0.55 }} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {depth("far")}
        <Shaft left={0.14} tilt={14} delay={0} width={width} height={height} />
        <Shaft left={0.44} tilt={14} delay={900} width={width} height={height} />
        <Shaft left={0.72} tilt={14} delay={400} width={width} height={height} />
        {depth("mid")}
        <Mist top={0.56} delay={0} width={width} height={height} />
        {DUST.map((spec) => (
          <Dust key={spec.x} spec={spec} width={width} height={height} />
        ))}

        {depth("front")}
        <Mist top={0.7} delay={2200} width={width} height={height} />
        {depth("near")}
        {/* Soft shade at the edges, like looking through the greenhouse door. */}
        <LinearGradient colors={["rgba(10,20,8,0.55)", "rgba(10,20,8,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 0.22, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <LinearGradient colors={["rgba(10,20,8,0.55)", "rgba(10,20,8,0)"]} start={{ x: 1, y: 0.5 }} end={{ x: 0.78, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <Animated.View style={[styles.text, { top: height * 0.3 }, textBlock]} pointerEvents="none">
          <Animated.View style={[{ alignItems: "center" }, titleStyle]}>
            <Text variant="eyebrow" style={{ color: "#f1d9a6", letterSpacing: 4, ...legible }}>
              Step into the greenhouse
            </Text>
            <Text variant="display" style={{ color: colors.cream, fontSize: 58, lineHeight: 62, marginTop: 10, ...legible }}>
              Fernwood
            </Text>
          </Animated.View>
          <Animated.View style={[{ alignItems: "center", marginTop: 22, paddingHorizontal: 44 }, linesStyle]}>
            <Text variant="title" style={{ color: colors.cream, fontSize: 21, textAlign: "center", ...legible }}>
              {greeting}. Take your time.
            </Text>
            <Text variant="small" style={{ color: colors.cream, opacity: 0.9, textAlign: "center", marginTop: 8, ...legible }}>
              {tip}
            </Text>
          </Animated.View>
        </Animated.View>

      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});

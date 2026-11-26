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
import Svg, { Path } from "react-native-svg";

import { Text } from "@/components/Text";
import { broadPaths, frondPaths, type Leaf } from "@/features/intro/foliage";
import { pickTip, timeOfDayGreeting } from "@/features/intro/greeting";
import { colors } from "@/theme/tokens";

const PHOTO = `${process.env.EXPO_PUBLIC_API_URL ?? ""}/images/hero-plants.jpg`;

/** One side of the jungle. Mirrored for the other side, so the two never look copy-pasted: the right uses its own phases. */
const LEAVES: Leaf[] = [
  // Back layer: darker, slower, further away.
  { kind: "frond", x: 0.05, y: 0.92, size: 360, rotate: 18, color: "#1f3a1c", vein: "#2c4f27", layer: "back", sway: 0.8, phase: 0.1 },
  { kind: "broad", x: 0.12, y: 0.62, size: 300, rotate: 32, color: "#264420", vein: "#35592c", layer: "back", sway: 0.7, phase: 0.4 },
  { kind: "frond", x: 0.02, y: 0.45, size: 320, rotate: 52, color: "#223f1e", vein: "#2f5029", layer: "back", sway: 0.9, phase: 0.7 },
  // Front layer: lighter, larger, moves faster as it parts.
  { kind: "broad", x: 0.0, y: 1.02, size: 420, rotate: 14, color: colors.forest, vein: colors.moss, layer: "front", sway: 1, phase: 0.2 },
  { kind: "frond", x: 0.1, y: 1.0, size: 400, rotate: 36, color: colors.moss, vein: colors.sage, layer: "front", sway: 1.2, phase: 0.55 },
  { kind: "broad", x: 0.0, y: 0.7, size: 340, rotate: 62, color: "#3b5a30", vein: "#5d7a4c", layer: "front", sway: 1.1, phase: 0.85 },
];

function LeafShape({ leaf, mirror, sway, width, height }: { leaf: Leaf; mirror: boolean; sway: SharedValue<number>; width: number; height: number }) {
  const shape = useMemo(
    () => (leaf.kind === "frond" ? { frond: frondPaths(leaf.size, 14, leaf.size * 0.34, leaf.size * 0.05) } : { broad: broadPaths(leaf.size) }),
    [leaf],
  );
  const dir = mirror ? -1 : 1;
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dir * leaf.rotate + Math.sin((sway.value + leaf.phase) * 6.283) * 2.4 * leaf.sway}deg` }],
  }));
  const pad = leaf.size * 0.6;
  const box = leaf.size + pad * 2;
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: (mirror ? 1 - leaf.x : leaf.x) * width - box / 2,
          top: leaf.y * height - box + pad,
          width: box,
          height: box,
          transformOrigin: "50% 100%",
        },
        style,
      ]}
    >
      <Svg width={box} height={box} viewBox={`${-box / 2} ${-box + pad} ${box} ${box}`}>
        {shape.frond ? (
          <>
            <Path d={shape.frond.blades} fill={leaf.color} />
            <Path d={shape.frond.rib} stroke={leaf.vein} strokeWidth={3} strokeLinecap="round" />
          </>
        ) : null}
        {shape.broad ? (
          <>
            <Path d={shape.broad.body} fill={leaf.color} />
            <Path d={shape.broad.veins} stroke={leaf.vein} strokeWidth={2} fill="none" strokeLinecap="round" />
          </>
        ) : null}
      </Svg>
    </Animated.View>
  );
}

function Cluster({ side, layer, open, sway, width, height }: { side: "left" | "right"; layer: "back" | "front"; open: SharedValue<number>; sway: SharedValue<number>; width: number; height: number }) {
  const dir = side === "left" ? -1 : 1;
  const speed = layer === "front" ? 1 : 0.62;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.75, 1], [1, 1, 0]),
    transform: [{ translateX: dir * open.value * width * 0.85 * speed }, { rotate: `${dir * open.value * 10 * speed}deg` }, { scale: 1 + open.value * 0.12 }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {LEAVES.filter((leaf) => leaf.layer === layer).map((leaf, index) => (
        <LeafShape key={index} leaf={leaf} mirror={side === "right"} sway={sway} width={width} height={height} />
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
 * Second welcome: walking into a lush greenhouse. A real photograph of the nursery slowly settles behind dense
 * fern and leaf layers swaying in warm light shafts; the name appears, then the foliage parts like a path
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

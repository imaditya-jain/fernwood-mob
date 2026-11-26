import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { formatPrice } from "@/lib/format";
import type { FinderPlant } from "@/lib/plant-finder";
import { colors, fonts, radius, shadow } from "@/theme/tokens";

const THRESHOLD = 110;
const EXIT = 520;

type Props<T extends FinderPlant> = {
  plants: T[];
  onDone: (liked: string[], passed: string[]) => void;
};

/** Tinder-style deck: drag a card right to like, left to pass, or use the buttons. Drag past 110 px (or flick) to decide. */
export function SwipeDeck<T extends FinderPlant>({ plants, onDone }: Props<T>) {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const current = plants[index];
  const next = plants[index + 1];

  const decide = useCallback(
    (like: boolean) => {
      if (!current) return;
      void Haptics.impactAsync(like ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
      const nextLiked = like ? [...liked, current.id] : liked;
      const nextPassed = like ? passed : [...passed, current.id];
      setLiked(nextLiked);
      setPassed(nextPassed);
      x.value = 0;
      y.value = 0;
      if (index + 1 >= plants.length) onDone(nextLiked, nextPassed);
      else setIndex(index + 1);
    },
    [current, index, liked, passed, plants.length, onDone, x, y],
  );

  const fling = (like: boolean) => {
    x.value = withTiming(like ? EXIT : -EXIT, { duration: 240 }, (finished) => {
      if (finished) runOnJS(decide)(like);
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      x.value = event.translationX;
      y.value = event.translationY * 0.25;
    })
    .onEnd((event) => {
      const like = event.translationX > THRESHOLD || event.velocityX > 900;
      const pass = event.translationX < -THRESHOLD || event.velocityX < -900;
      if (like || pass) {
        x.value = withTiming(like ? EXIT : -EXIT, { duration: 200 }, (finished) => {
          if (finished) runOnJS(decide)(like);
        });
      } else {
        x.value = withSpring(0, { damping: 16 });
        y.value = withSpring(0, { damping: 16 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-EXIT, 0, EXIT], [-16, 0, 16])}deg` },
    ],
  }));
  const likeStamp = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [20, THRESHOLD], [0, 1], "clamp") }));
  const passStamp = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-THRESHOLD, -20], [1, 0], "clamp") }));
  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(Math.abs(x.value), [0, THRESHOLD], [0.94, 1], "clamp") }],
  }));

  if (!current) return null;

  const card = (plant: FinderPlant) => (
    <>
      <Image source={{ uri: plant.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.caption}>
        <Text variant="title" style={{ color: colors.cream }}>
          {plant.name}
        </Text>
        <Text variant="small" style={{ color: colors.cream, opacity: 0.85 }}>
          {[plant.light, plant.size].filter(Boolean).join(" · ")}
        </Text>
        <Text variant="body" style={{ color: colors.cream, fontFamily: fonts.bodySemibold }}>
          {formatPrice(plant.price)}
        </Text>
      </View>
    </>
  );

  return (
    <View accessibilityLabel={`Plant ${index + 1} of ${plants.length}: ${current.name}`} style={{ gap: 18 }}>
      <Text variant="small" style={{ textAlign: "center" }}>
        {index + 1} of {plants.length} · swipe right to like, left to pass
      </Text>
      <View style={styles.stack}>
        {next ? (
          <Animated.View style={[styles.card, nextStyle]} pointerEvents="none">
            {card(next)}
          </Animated.View>
        ) : null}
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.card, cardStyle]}>
            {card(current)}
            <Animated.View style={[styles.stamp, styles.likeStamp, likeStamp]}>
              <Text variant="title" style={{ color: colors.cream }}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.passStamp, passStamp]}>
              <Text variant="title" style={{ color: colors.cream }}>PASS</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button label="Pass" variant="outline" onPress={() => fling(false)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Like" onPress={() => fling(true)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { height: 440 },
  card: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.sand,
    ...shadow.card,
  },

  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    gap: 2,
    backgroundColor: "rgba(26,44,22,0.72)",
  },
  stamp: { position: "absolute", top: 28, borderWidth: 3, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  likeStamp: { left: 20, borderColor: colors.cream, backgroundColor: "rgba(49,67,41,0.7)", transform: [{ rotate: "-12deg" }] },
  passStamp: { right: 20, borderColor: colors.cream, backgroundColor: "rgba(191,98,61,0.8)", transform: [{ rotate: "12deg" }] },
});

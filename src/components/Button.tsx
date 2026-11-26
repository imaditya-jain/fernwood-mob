import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, type PressableProps, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { Text } from "@/components/Text";
import { colors, radius } from "@/theme/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "children"> & {
  label: string;
  variant?: "primary" | "light" | "outline";
  loading?: boolean;
};

/** Pill button with a springy press and a light haptic tick. */
export function Button({ label, variant = "primary", loading, disabled, onPress, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const palette = {
    primary: { bg: colors.forest, fg: colors.cream, border: colors.forest },
    light: { bg: colors.cream, fg: colors.forestDeep, border: colors.cream },
    outline: { bg: "transparent", fg: colors.forest, border: colors.forest },
  }[variant];

  return (
    <AnimatedPressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPressIn={() => (scale.value = withSpring(0.96, { damping: 15 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
      onPress={(event) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      style={[
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        (disabled || loading) && { opacity: 0.6 },
        animated,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text variant="body" style={[styles.label, { color: palette.fg }]}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  label: { fontWeight: "600", letterSpacing: 0.6 },
});

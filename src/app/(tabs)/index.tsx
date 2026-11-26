import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { colors, radius, shadow } from "@/theme/tokens";

const HERO = "https://fernwood-ruby.vercel.app/images/hero-plants.jpg";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient
          colors={["rgba(26,44,22,0.35)", "rgba(26,44,22,0.2)", "rgba(26,44,22,0.85)"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View entering={FadeInDown.duration(700)} style={[styles.heroText, { paddingTop: insets.top + 24 }]}>
          <Text variant="eyebrow" style={{ color: colors.sage }}>
            Nursery-grown · delivered with care
          </Text>
          <Text variant="display" style={{ color: colors.cream, marginTop: 10 }}>
            Let&apos;s go green!
          </Text>
          <View style={{ marginTop: 22, alignSelf: "flex-start" }}>
            <Button label="Shop indoor plants" variant="light" />
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.card}>
        <Text variant="eyebrow">Plant Finder</Text>
        <Text variant="title" style={{ marginTop: 6 }}>
          Not sure which plant? Swipe your way to it
        </Text>
        <Text variant="small" style={{ marginTop: 8 }}>
          A few quick questions, then swipe through plants and we show your best matches.
        </Text>
        <View style={{ marginTop: 16, alignSelf: "flex-start" }}>
          <Button label="Find my plant" />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  hero: { height: 460, justifyContent: "flex-end", overflow: "hidden", borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  heroText: { padding: 24, paddingBottom: 36 },
  card: {
    margin: 20,
    padding: 22,
    borderRadius: radius.lg,
    backgroundColor: colors.sageLight,
    ...shadow.card,
  },
});

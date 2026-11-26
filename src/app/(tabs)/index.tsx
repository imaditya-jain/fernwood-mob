import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { Text } from "@/components/Text";
import { useBestSellers, useCollections } from "@/lib/shopify/hooks";
import { colors, radius, shadow } from "@/theme/tokens";

const CARD_W = 220;
const HERO = "https://fernwood-ruby.vercel.app/images/hero-plants.jpg";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const collections = useCollections();
  const bestSellers = useBestSellers();
  const refreshing = collections.isRefetching || bestSellers.isRefetching;
  const refresh = () => {
    void collections.refetch();
    void bestSellers.refetch();
  };
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.forest} />}
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
            <Button label="Shop indoor plants" variant="light" onPress={() => router.push("/shop")} />
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
          <Button label="Find my plant" onPress={() => router.push("/plant-finder")} />
        </View>
      </Animated.View>

      {collections.data && collections.data.length > 0 ? (
        <View style={{ marginTop: 8 }}>
          <Text variant="title" style={styles.sectionTitle}>
            Shop house plants
          </Text>
          <FlatList
            horizontal
            data={collections.data}
            keyExtractor={(item) => item.slug}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + 14}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.name}
                onPress={() => router.push("/shop")}
                style={[styles.collection, { width: CARD_W }]}
              >
                <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
                <LinearGradient colors={["transparent", "rgba(26,44,22,0.8)"]} style={StyleSheet.absoluteFill} />
                <View style={{ padding: 14 }}>
                  <Text variant="title" style={{ color: colors.cream, fontSize: 20 }}>
                    {item.name}
                  </Text>
                  <Text variant="small" style={{ color: colors.cream, opacity: 0.85 }}>
                    {item.tagline}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {bestSellers.data && bestSellers.data.length > 0 ? (
        <View style={{ marginTop: 28 }}>
          <Text variant="eyebrow" style={styles.sectionEyebrow}>
            Loved by plant parents
          </Text>
          <Text variant="title" style={styles.sectionTitle}>
            Best sellers this season
          </Text>
          <FlatList
            horizontal
            data={bestSellers.data}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 8 }}
            renderItem={({ item }) => <ProductCard product={item} width={CARD_W} />}
          />
        </View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.services}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/doctor")} style={[styles.service, { backgroundColor: colors.forestDeep }]}>
          <Text variant="eyebrow" style={{ color: colors.sage }}>New</Text>
          <Text variant="title" style={{ color: colors.cream, marginTop: 4 }}>Plant Doctor</Text>
          <Text variant="small" style={{ color: colors.cream, opacity: 0.8, marginTop: 4 }}>Photograph a plant and get a care plan.</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/gifts")} style={[styles.service, { backgroundColor: colors.clay }]}>
          <Text variant="eyebrow" style={{ color: colors.cream }}>Nagpur</Text>
          <Text variant="title" style={{ color: colors.cream, marginTop: 4 }}>Gifts & bouquets</Text>
          <Text variant="small" style={{ color: colors.cream, opacity: 0.9, marginTop: 4 }}>Fresh flowers delivered on the day you choose.</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/gardener")} style={[styles.service, { backgroundColor: colors.forest }]}>
          <Text variant="eyebrow" style={{ color: colors.sage }}>Services</Text>
          <Text variant="title" style={{ color: colors.cream, marginTop: 4 }}>Gardener visits</Text>
          <Text variant="small" style={{ color: colors.cream, opacity: 0.8, marginTop: 4 }}>One-time or monthly, fortnightly and weekly plans.</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/wholesale")} style={[styles.service, { backgroundColor: colors.sand }]}>
          <Text variant="eyebrow">Trade</Text>
          <Text variant="title" style={{ marginTop: 4 }}>Wholesale</Text>
          <Text variant="small" style={{ marginTop: 4 }}>Apply for a trade account for your business.</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  services: { paddingHorizontal: 20, gap: 14, marginTop: 28 },
  service: { borderRadius: radius.xl, padding: 20, ...shadow.card },
  sectionEyebrow: { paddingHorizontal: 20 },
  sectionTitle: { paddingHorizontal: 20, marginBottom: 14 },
  collection: { height: 280, borderRadius: radius.lg, overflow: "hidden", justifyContent: "flex-end", backgroundColor: colors.sand },
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

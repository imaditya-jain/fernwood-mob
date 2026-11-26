import { Ionicons } from "@expo/vector-icons";
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
import { colors, fonts, radius, shadow } from "@/theme/tokens";

const CARD_W = 220;
const SERVICES = [
  { href: "/gifts", icon: "flower-outline", eyebrow: "Nagpur", title: "Gifts & bouquets", text: "Fresh flowers delivered on the day you choose.", color: colors.clayDeep, tint: "#f4e1d6" },
  { href: "/gardener", icon: "leaf-outline", eyebrow: "Services", title: "Gardener visits", text: "One-time, monthly, fortnightly or weekly plans.", color: colors.forest, tint: colors.sageLight },
  { href: "/wholesale", icon: "storefront-outline", eyebrow: "Trade", title: "Wholesale", text: "Apply for a trade account for your business.", color: colors.forestDeep, tint: colors.sand },
] as const;
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
        <Text variant="eyebrow" style={{ color: colors.clay }}>More from Fernwood</Text>
        <Text variant="title" style={{ marginBottom: 4 }}>Care, gifts and trade</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Plant Doctor" onPress={() => router.push("/doctor")} style={({ pressed }) => [styles.feature, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
          <LinearGradient colors={[colors.forestDeep, colors.forest]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Ionicons name="leaf" size={180} color={colors.cream} style={styles.watermark} />
          <View style={styles.pill}>
            <Text variant="eyebrow" style={{ color: colors.cream, fontSize: 10 }}>New · AI</Text>
          </View>
          <Text variant="title" style={{ color: colors.cream, marginTop: 14 }}>Plant Doctor</Text>
          <Text variant="small" style={{ color: colors.cream, opacity: 0.82, marginTop: 6, maxWidth: "75%" }}>
            Photograph a struggling plant and get a clear, step-by-step care plan.
          </Text>
          <View style={styles.cta}>
            <Text variant="small" style={{ color: colors.forestDeep, fontFamily: fonts.bodySemibold }}>Check a plant</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.forestDeep} />
          </View>
        </Pressable>
        {SERVICES.map((item) => (
          <Pressable key={item.href} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}>
            <View style={[styles.badge, { backgroundColor: item.tint }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="eyebrow" style={{ color: item.color, fontSize: 10 }}>{item.eyebrow}</Text>
              <Text variant="title" style={{ fontSize: 19, marginTop: 1 }}>{item.title}</Text>
              <Text variant="small" style={{ marginTop: 2 }}>{item.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  services: { paddingHorizontal: 20, gap: 12, marginTop: 36 },
  feature: { borderRadius: radius.xl, padding: 22, overflow: "hidden", ...shadow.card },
  watermark: { position: "absolute", right: -30, bottom: -40, opacity: 0.07 },
  pill: { alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(246,239,226,0.35)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  cta: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.cream, borderRadius: 999, paddingHorizontal: 16, minHeight: 40, marginTop: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
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

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorState, Loading } from "@/components/QueryState";
import { Text } from "@/components/Text";
import { formatPrice } from "@/lib/format";
import { useProduct } from "@/lib/shopify/hooks";
import { colors, radius, shadow } from "@/theme/tokens";

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: product, isPending, isError, refetch } = useProduct(handle);

  if (isPending) return <Loading />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!product) {
    return (
      <View style={{ padding: 32 }}>
        <Text variant="title">We couldn&apos;t find that plant</Text>
      </View>
    );
  }

  const details = [
    { label: "Light", value: product.light, icon: "sunny-outline" as const },
    { label: "Size", value: product.size, icon: "resize-outline" as const },
    { label: "Availability", value: product.inStock ? "In stock" : "Sold out", icon: "cube-outline" as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.back, { top: insets.top + 8 }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.forest} />
          </Pressable>
        </View>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.sheet}>
          <Text variant="eyebrow">{product.category}</Text>
          <Text variant="display" style={{ marginTop: 6, fontSize: 32, lineHeight: 36 }}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text variant="title" style={{ fontSize: 28 }}>
              {formatPrice(product.price)}
            </Text>
            {product.compareAtPrice !== undefined ? (
              <Text variant="body" style={{ textDecorationLine: "line-through", color: colors.muted }}>
                {formatPrice(product.compareAtPrice)}
              </Text>
            ) : null}
          </View>
          <View style={styles.details}>
            {details.map((detail) => (
              <View key={detail.label} style={styles.detail}>
                <Ionicons name={detail.icon} size={18} color={colors.clay} />
                <Text variant="small" style={{ marginTop: 6 }}>
                  {detail.label}
                </Text>
                <Text variant="body" style={{ fontSize: 14, lineHeight: 19, marginTop: 2 }}>
                  {detail.value || "—"}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Button label={product.inStock ? "Add to cart" : "Sold out"} disabled={!product.inStock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", aspectRatio: 4 / 5, backgroundColor: colors.sand },
  back: {
    position: "absolute",
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  sheet: {
    marginTop: -28,
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 12, marginTop: 10 },
  details: { flexDirection: "row", gap: 10, marginTop: 20 },
  detail: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 12, ...shadow.card },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

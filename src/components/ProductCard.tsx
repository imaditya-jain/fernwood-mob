import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { colors, radius, shadow } from "@/theme/tokens";

export function ProductCard({ product, width }: { product: Product; width?: number }) {
  return (
    <Link href={{ pathname: "/product/[handle]", params: { handle: product.slug } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`View ${product.name}`}
        style={({ pressed }) => [styles.card, width ? { width } : { flex: 1 }, pressed && { opacity: 0.9 }]}
      >
        <View>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="cover"
            transition={250}
            recyclingKey={product.id}
          />
          {product.badge ? (
            <View style={[styles.badge, product.badge === "Sale" && { backgroundColor: colors.clay }]}>
              <Text variant="small" style={styles.badgeText}>
                {product.badge.toUpperCase()}
              </Text>
            </View>
          ) : null}
          {!product.inStock ? (
            <View style={styles.soldOut}>
              <Text variant="small" style={{ color: colors.cream }}>
                SOLD OUT
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.info}>
          <Text variant="small" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            {product.category}
          </Text>
          <Text variant="title" numberOfLines={2} style={{ fontSize: 17, lineHeight: 22, marginTop: 2 }}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text variant="body" style={{ fontWeight: "600", color: colors.forest }}>
              {formatPrice(product.price)}
            </Text>
            {product.compareAtPrice !== undefined ? (
              <Text variant="small" style={{ textDecorationLine: "line-through" }}>
                {formatPrice(product.compareAtPrice)}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  image: { width: "100%", aspectRatio: 4 / 5, backgroundColor: colors.sand },
  info: { padding: 12 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 },
  badge: {
    position: "absolute",
    left: 10,
    top: 10,
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: colors.cream, fontSize: 10, letterSpacing: 1.2 },
  soldOut: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "rgba(37,50,30,0.75)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { WishlistHeart } from "@/components/WishlistHeart";
import { useCart } from "@/features/cart/CartProvider";
import { formatPrice } from "@/lib/format";
import { isGift } from "@/lib/gift";
import type { Product } from "@/lib/types";
import { colors, radius, shadow } from "@/theme/tokens";

export function ProductCard({ product, width }: { product: Product; width?: number }) {
  const { add, busy } = useCart();
  const router = useRouter();
  return (
    <View style={width ? { width } : { flex: 1 }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`View ${product.name}`}
        onPress={() => router.push({ pathname: "/product/[handle]", params: { handle: product.slug } })}
        style={styles.card}
      >
        <View>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="cover"
            transition={250}
            recyclingKey={product.id}
          />
          <WishlistHeart handle={product.slug} name={product.name} size={36} style={{ position: "absolute", right: 10, top: 10 }} />
          {product.badge ? (
            <View style={[styles.badge, product.badge === "Sale" && { backgroundColor: colors.clay }]}>
              <Text variant="small" style={styles.badgeText}>
                {product.badge.toUpperCase()}
              </Text>
            </View>
          ) : null}
          {product.inStock && product.variantId && !isGift(product) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add to cart: ${product.name}`}
              disabled={busy}
              onPress={() => void add(product.variantId as string)}
              style={[styles.quickAdd, busy && { opacity: 0.6 }]}
            >
              <Ionicons name="add" size={22} color={colors.cream} />
            </Pressable>
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
          <Text variant="small" numberOfLines={1} style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            {product.category}
          </Text>
          <Text variant="title" numberOfLines={2} style={{ fontSize: 17, lineHeight: 22, marginTop: 2, minHeight: 44 }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  image: { width: "100%", aspectRatio: 4 / 5, backgroundColor: colors.sand },
  info: { flex: 1, padding: 12, justifyContent: "space-between" },
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
  quickAdd: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  soldOut: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "rgba(37,50,30,0.75)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

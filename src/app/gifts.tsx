import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { Text } from "@/components/Text";
import { FRESH_DELIVERY, OCCASIONS } from "@/lib/gift";
import { fetchCollectionProducts } from "@/lib/shopify/catalog";
import { colors, radius } from "@/theme/tokens";

export default function GiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [occasion, setOccasion] = useState<string | null>(null);
  const bouquets = useQuery({ queryKey: ["collection", "bouquets"], queryFn: () => fetchCollectionProducts("bouquets") });
  const gifts = useQuery({ queryKey: ["collection", "gifts"], queryFn: () => fetchCollectionProducts("gifts") });
  const shown = useMemo(
    () => (bouquets.data ?? []).filter((product) => !occasion || (product.occasions ?? []).includes(occasion)),
    [bouquets.data, occasion],
  );

  return (
    <ScrollView style={{ backgroundColor: colors.cream }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40, paddingHorizontal: 16, gap: 18 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={12} style={{ width: 44, height: 44, justifyContent: "center" }}>
        <Ionicons name="chevron-back" size={26} color={colors.forest} />
      </Pressable>
      <View style={styles.hero}>
        <Text variant="eyebrow" style={{ color: colors.sage }}>Gifts & bouquets</Text>
        <Text variant="title" style={{ color: colors.cream, marginTop: 6 }}>Say it with flowers</Text>
        <Text variant="small" style={{ color: colors.cream, opacity: 0.85, marginTop: 6 }}>
          Fresh bouquets delivered within {FRESH_DELIVERY.city} on the day you choose, with a message from you.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
        {[{ id: null, label: "All" }, ...OCCASIONS].map((option) => {
          const on = occasion === option.id;
          return (
            <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setOccasion(option.id)} style={[styles.chip, on && styles.chipOn]}>
              <Text variant="small" style={{ color: on ? colors.cream : colors.forest }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text variant="title">Bouquets</Text>
      {bouquets.isLoading ? <Text variant="small">Loading…</Text> : null}
      {!bouquets.isLoading && shown.length === 0 ? <Text variant="small">No bouquets for this occasion yet.</Text> : null}
      <View style={styles.grid}>
        {shown.map((product) => (
          <View key={product.id} style={{ width: "48%" }}>
            <ProductCard product={product} />
          </View>
        ))}
      </View>

      {(gifts.data ?? []).length > 0 ? (
        <>
          <Text variant="title">Plant gifts</Text>
          <View style={styles.grid}>
            {(gifts.data ?? []).map((product) => (
              <View key={product.id} style={{ width: "48%" }}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forestDeep, borderRadius: radius.xl, padding: 20 },
  chip: { paddingHorizontal: 14, minHeight: 40, justifyContent: "center", borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 },
});

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { ErrorState, Loading } from "@/components/QueryState";
import { Text } from "@/components/Text";
import { useProducts } from "@/lib/shopify/hooks";
import { colors, fonts, radius } from "@/theme/tokens";

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, refetch, isRefetching } = useProducts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set((data ?? []).map((p) => p.category).filter(Boolean))], [data]);
  const products = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (!category || p.category === category) &&
        (!needle || `${p.name} ${p.category} ${p.light}`.toLowerCase().includes(needle)),
    );
  }, [data, query, category]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Text variant="eyebrow">Fernwood</Text>
        <Text variant="display" style={{ marginTop: 4 }}>
          Shop all
        </Text>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search plants, pots, tools"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Search products"
            returnKeyType="search"
            style={styles.input}
          />
        </View>
      </View>
      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginTop: 12 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {[null, ...categories].map((name) => {
            const active = name === category;
            return (
              <Pressable
                key={name ?? "all"}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setCategory(name)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text variant="small" style={{ color: active ? colors.cream : colors.forest, fontFamily: fonts.bodyMedium }}>
                  {name ?? "All"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {isPending ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.forest} />}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: "center" }}>
              <Text variant="title">Nothing matches</Text>
              <Text variant="small">Try another word or clear the filter.</Text>
            </View>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, minHeight: 48, fontFamily: fonts.body, fontSize: 15, color: colors.text },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
});

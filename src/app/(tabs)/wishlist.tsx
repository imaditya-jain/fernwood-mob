import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { ErrorState, Loading } from "@/components/QueryState";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { useAuth } from "@/features/auth/AuthProvider";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/types";
import { colors } from "@/theme/tokens";

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status } = useAuth();
  const { handles } = useWishlist();
  const query = useQuery({
    queryKey: ["wishlist-products", handles.join(",")],
    queryFn: () => apiRequest<{ products: Product[] }>("/api/wishlist/products").then((r) => r.products),
    enabled: status === "authenticated",
    placeholderData: (previous) => previous,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Text variant="eyebrow">Fernwood</Text>
        <Text variant="display" style={{ marginTop: 4 }}>
          Wishlist
        </Text>
      </View>
      {status === "loading" ? (
        <Loading />
      ) : status === "anonymous" ? (
        <SignInPrompt icon="heart-outline" title="Keep your favourites" text="Sign in to save plants and find them again on any device." />
      ) : query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 }}>
          <Text variant="title">Nothing saved yet</Text>
          <Text variant="small" style={{ textAlign: "center" }}>
            Tap the heart on any plant to keep it here for later.
          </Text>
          <Button label="Browse plants" onPress={() => router.navigate("/shop")} />
        </View>
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.forest} />}
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  );
}

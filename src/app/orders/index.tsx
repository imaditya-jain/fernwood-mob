import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorState, Loading } from "@/components/QueryState";
import { Text } from "@/components/Text";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, apiRequest } from "@/lib/api";
import { formatDate, formatMoney, type OrderPage, statusLabel } from "@/lib/orders";
import { colors, radius, shadow } from "@/theme/tokens";

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, user } = useAuth();
  const query = useInfiniteQuery({
    queryKey: ["orders", user?.id],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      apiRequest<OrderPage>(`/api/orders${pageParam ? `?after=${encodeURIComponent(pageParam)}` : ""}`),
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? (last.pageInfo.endCursor ?? null) : null),
    enabled: status === "authenticated",
    retry: false,
  });

  const orders = query.data?.pages.flatMap((page) => page.orders) ?? [];
  const unverified = query.error instanceof ApiError && query.error.code === "email_unverified";

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 8 }}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.forest} />
        </Pressable>
        <Text variant="title">Your orders</Text>
      </View>
      {status === "anonymous" ? (
        <View style={styles.center}>
          <Text variant="title">Sign in to see your orders</Text>
          <Button label="Sign in" onPress={() => router.push("/auth/login")} />
        </View>
      ) : unverified ? (
        <View style={styles.center}>
          <Text variant="title" style={{ textAlign: "center" }}>Confirm your email to see your orders</Text>
          <Text variant="small" style={{ textAlign: "center" }}>For your security, order history appears once your email address is confirmed.</Text>
          <Button label="Go to my account" onPress={() => router.back()} />
        </View>
      ) : query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text variant="title">No orders yet</Text>
          <Text variant="small" style={{ textAlign: "center" }}>When you place an order it will appear here, with tracking once it ships.</Text>
          <Button label="Start shopping" onPress={() => router.navigate("/shop")} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.forest} />}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && void query.fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={query.isFetchingNextPage ? <Loading /> : undefined}
          renderItem={({ item: order }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View order ${order.name}`}
              onPress={() => router.push({ pathname: "/orders/[id]", params: { id: order.id } })}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
            >
              <View style={styles.strip}>
                <View>
                  <Text variant="small">Order placed</Text>
                  <Text variant="body" style={{ fontSize: 14, color: colors.forest }}>{formatDate(order.processedAt)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text variant="small">Total</Text>
                  <Text variant="body" style={{ fontSize: 14, color: colors.forest }}>{formatMoney(order.total)}</Text>
                </View>
              </View>
              <View style={{ padding: 14, gap: 10 }}>
                <Text variant="title" style={{ fontSize: 18 }}>Order {order.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row" }}>
                    {order.previewImages.map((src, index) => (
                      <Image key={src} source={{ uri: src }} contentFit="cover" style={[styles.thumb, index > 0 && { marginLeft: -14 }]} />
                    ))}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text variant="small" style={{ color: colors.forest }}>
                      {order.cancelled ? "Cancelled" : statusLabel(order.fulfillmentStatus)}
                    </Text>
                    <Text variant="small">{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  strip: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.sageLight, padding: 14 },
  thumb: { width: 56, height: 56, borderRadius: 14, borderWidth: 3, borderColor: colors.card, backgroundColor: colors.sand },
});

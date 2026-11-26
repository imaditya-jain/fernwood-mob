import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { OrderProgress } from "@/components/OrderProgress";
import { ErrorState, Loading } from "@/components/QueryState";
import { Text } from "@/components/Text";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, apiRequest } from "@/lib/api";
import { formatDate, formatMoney, type OrderDetail } from "@/lib/orders";
import { colors, radius, shadow } from "@/theme/tokens";

const safeUrl = (value?: string) => (value && /^https:\/\//i.test(value) ? value : null);

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status } = useAuth();
  const query = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiRequest<{ order: OrderDetail }>(`/api/orders/${encodeURIComponent(id)}`).then((r) => r.order),
    enabled: status === "authenticated",
    retry: false,
  });
  const notFound = query.error instanceof ApiError && query.error.status === 404;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 8 }}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.forest} />
        </Pressable>
        <Text variant="title">{query.data ? `Order ${query.data.name}` : "Order"}</Text>
      </View>
      {query.isPending ? (
        <Loading />
      ) : notFound ? (
        <View style={styles.center}>
          <Text variant="title">We couldn&apos;t find that order</Text>
          <Button label="Back to orders" onPress={() => router.back()} />
        </View>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text variant="small">Placed {formatDate(query.data.processedAt)}</Text>
            <View style={{ marginTop: 14 }}>
              <OrderProgress order={query.data} />
            </View>
          </View>

          <View style={styles.card}>
            {query.data.lines.map((line, index) => (
              <View key={`${line.title}-${index}`} style={[styles.line, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                {line.image ? <Image source={{ uri: line.image }} contentFit="cover" style={styles.thumb} /> : <View style={styles.thumb} />}
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: "600" }}>{line.title}</Text>
                  {line.variantTitle ? <Text variant="small">{line.variantTitle}</Text> : null}
                  <Text variant="small">{line.quantity} × {formatMoney(line.unitPrice)}</Text>
                </View>
                <Text variant="body" style={{ color: colors.forest, fontWeight: "600" }}>
                  {formatMoney({ ...line.unitPrice, amount: String(Number(line.unitPrice.amount) * line.quantity) })}
                </Text>
              </View>
            ))}
            <View style={styles.totals}>
              {(
                [
                  ["Subtotal", query.data.subtotal],
                  ["Shipping", query.data.shipping],
                  ["Tax", query.data.tax],
                ] as const
              ).map(([label, value]) => (
                <View key={label} style={styles.total}>
                  <Text variant="small">{label}</Text>
                  <Text variant="small" style={{ color: colors.text }}>{formatMoney(value)}</Text>
                </View>
              ))}
              <View style={[styles.total, { marginTop: 6 }]}>
                <Text variant="title" style={{ fontSize: 18 }}>Total</Text>
                <Text variant="title" style={{ fontSize: 18 }}>{formatMoney(query.data.total)}</Text>
              </View>
            </View>
          </View>

          {query.data.shippingAddress ? (
            <View style={styles.card}>
              <Text variant="title" style={{ fontSize: 18 }}>Shipping to</Text>
              <Text variant="small" style={{ marginTop: 4 }}>
                {[query.data.shippingAddress.city, query.data.shippingAddress.region, query.data.shippingAddress.country].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}

          {query.data.tracking.length > 0 ? (
            <View style={styles.card}>
              <Text variant="title" style={{ fontSize: 18 }}>Tracking</Text>
              {query.data.tracking.map((entry, index) => {
                const href = safeUrl(entry.url);
                const label = [entry.company, entry.number].filter(Boolean).join(" · ") || "Track package";
                return (
                  <Pressable key={index} disabled={!href} onPress={() => href && void WebBrowser.openBrowserAsync(href)} style={{ paddingVertical: 8 }}>
                    <Text variant="body" style={{ color: href ? colors.forest : colors.muted, textDecorationLine: href ? "underline" : "none" }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow.card },
  line: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  thumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: colors.sand },
  totals: { marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10, gap: 4 },
  total: { flexDirection: "row", justifyContent: "space-between" },
});

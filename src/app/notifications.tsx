import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorState, Loading } from "@/components/QueryState";
import { Text } from "@/components/Text";
import { useAuth } from "@/features/auth/AuthProvider";
import { type NotificationItem as Item, useNotifications } from "@/features/notifications/useUnreadCount";
import { apiRequest } from "@/lib/api";
import { colors, radius, shadow } from "@/theme/tokens";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const client = useQueryClient();
  const { status } = useAuth();
  const query = useNotifications();
  const markRead = useMutation({
    mutationFn: (body: { all: true } | { ids: string[] }) => apiRequest("/api/notifications/read", { method: "POST", json: body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const open = (item: Item) => {
    if (!item.read) markRead.mutate({ ids: [item.id] });
    const id = item.link.split("/").pop();
    if (id && /^\d+$/.test(id)) router.push({ pathname: "/orders/[id]", params: { id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 8 }}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.forest} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>Order updates</Text>
        {query.data && query.data.unreadCount > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => markRead.mutate({ all: true })}>
            <Text variant="small" style={{ color: colors.forest, textDecorationLine: "underline" }}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>
      {status === "anonymous" ? (
        <View style={styles.center}>
          <Text variant="title">Sign in to see order updates</Text>
          <Button label="Sign in" onPress={() => router.push("/auth/login")} />
        </View>
      ) : query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <View style={styles.center}>
          <Text variant="title">No updates yet</Text>
          <Text variant="small" style={{ textAlign: "center" }}>We will tell you here when an order is placed, paid or shipped.</Text>
        </View>
      ) : (
        <FlatList
          data={query.data.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.forest} />}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => open(item)} style={[styles.item, !item.read && { borderColor: colors.clay }]}>
              <View style={[styles.dot, { backgroundColor: item.read ? "transparent" : colors.clay }]} />
              <View style={{ flex: 1 }}>
                <Text variant="body" style={{ fontWeight: "600" }}>{item.title}</Text>
                <Text variant="small">{item.body}</Text>
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
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1.5, borderColor: "transparent", ...shadow.card },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});

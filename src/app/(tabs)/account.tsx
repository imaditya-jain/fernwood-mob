import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Loading } from "@/components/QueryState";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { useAuth } from "@/features/auth/AuthProvider";
import { INTRO_LABELS, type IntroStyle, readIntroStyle, saveIntroStyle } from "@/features/intro/preference";
import { useUnreadCount } from "@/features/notifications/useUnreadCount";
import { ApiError, apiRequest } from "@/lib/api";
import { colors, radius, shadow } from "@/theme/tokens";

const SITE = process.env.EXPO_PUBLIC_API_URL ?? "";
/** Reading pages stay on the website, so they are always the same as the site and never go out of date. */
const HELP = [
  { label: "Our story", path: "/about" },
  { label: "Plant care guide", path: "/care-guide" },
  { label: "Shipping & delivery", path: "/shipping-delivery" },
  { label: "Plant guarantee", path: "/plant-guarantee" },
  { label: "FAQ", path: "/faq" },
  { label: "Journal", path: "/blog" },
] as const;

type Row = { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void };

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, user, logout, logoutEverywhere } = useAuth();
  const unread = useUnreadCount();
  const [introStyle, setIntroStyle] = useState<IntroStyle>("mix");
  useEffect(() => {
    void readIntroStyle().then(setIntroStyle);
  }, []);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const header = (
    <View style={{ paddingHorizontal: 20 }}>
      <Text variant="eyebrow">Fernwood</Text>
      <Text variant="display" style={{ marginTop: 4 }}>
        Account
      </Text>
    </View>
  );

  if (status === "loading") return <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>{header}<Loading /></View>;
  if (status === "anonymous" || !user) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        {header}
        <SignInPrompt icon="person-outline" title="Welcome to Fernwood" text="Sign in to follow orders, save plants and check out faster." />
      </View>
    );
  }

  const resendVerification = async () => {
    setBusy(true);
    try {
      await apiRequest("/api/auth/verify-email/request", { method: "POST", json: {} });
      setNotice("We sent a new confirmation link. It opens in your browser.");
    } catch (caught) {
      setNotice(caught instanceof ApiError ? caught.message : "Couldn't send the email. Try again later.");
    } finally {
      setBusy(false);
    }
  };

  const rows: Row[] = [
    { icon: "receipt-outline", label: "Your orders", onPress: () => router.push("/orders") },
    { icon: "heart-outline", label: "Your wishlist", onPress: () => router.navigate("/wishlist") },
    { icon: "bag-outline", label: "Your cart", onPress: () => router.navigate("/cart") },
    { icon: "notifications-outline", label: unread > 0 ? `Order updates (${unread} new)` : "Order updates", onPress: () => router.push("/notifications") },
    { icon: "leaf-outline", label: "Gardener services", onPress: () => router.push("/gardener") },
    { icon: "briefcase-outline", label: "Wholesale", onPress: () => router.push("/wholesale") },
    {
      icon: "sparkles-outline",
      label: `Welcome style: ${INTRO_LABELS[introStyle]}`,
      onPress: () =>
        Alert.alert("How should the app open?", "You will see it the next time you open the app.", [
          ...(Object.keys(INTRO_LABELS) as IntroStyle[]).map((style) => ({
            text: INTRO_LABELS[style],
            onPress: () => {
              setIntroStyle(style);
              void saveIntroStyle(style);
            },
          })),
        ], { cancelable: true }),
    },
    { icon: "chatbubble-ellipses-outline", label: "Contact us", onPress: () => router.push("/contact") },
    ...HELP.map((page) => ({ icon: "book-outline" as const, label: page.label, onPress: () => void WebBrowser.openBrowserAsync(`${SITE}${page.path}`) })),
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      {header}
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text variant="title" style={{ color: colors.forest }}>
              {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={{ color: colors.cream }}>
              {user.firstName} {user.lastName}
            </Text>
            <Text variant="small" numberOfLines={1} style={{ color: colors.cream, opacity: 0.75 }}>
              {user.email}
            </Text>
          </View>
          <View style={[styles.chip, !user.emailVerified && { backgroundColor: "rgba(191,98,61,0.3)" }]}>
            <Text variant="small" style={{ color: colors.cream, fontSize: 11 }}>
              {user.emailVerified ? "Verified" : "Not verified"}
            </Text>
          </View>
        </View>

        {!user.emailVerified ? (
          <View style={styles.notice}>
            <Text variant="body" style={{ color: colors.forest }}>
              Confirm your email to see your order history. We sent you a link.
            </Text>
            {notice ? <Text variant="small" accessibilityRole="alert" style={{ marginTop: 6 }}>{notice}</Text> : null}
            <View style={{ marginTop: 12, alignSelf: "flex-start" }}>
              <Button label="Send the link again" variant="outline" loading={busy} onPress={() => void resendVerification()} />
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          {rows.map((row, index) => (
            <Pressable
              key={row.label}
              accessibilityRole="button"
              onPress={row.onPress}
              style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <Ionicons name={row.icon} size={22} color={colors.forest} />
              <Text variant="body" style={{ flex: 1 }}>
                {row.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <Button label="Sign out" variant="outline" onPress={() => void logout()} />
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert("Sign out of all devices?", "You will need to sign in again everywhere.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out everywhere", style: "destructive", onPress: () => void logoutEverywhere() },
            ])
          }
          style={{ alignItems: "center", padding: 8 }}
        >
          <Text variant="small" style={{ color: colors.forest, textDecorationLine: "underline" }}>
            Sign out of all devices
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.forestDeep, borderRadius: radius.xl, padding: 18, ...shadow.card },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" },
  chip: { borderRadius: radius.pill, backgroundColor: "rgba(155,171,138,0.3)", paddingHorizontal: 10, paddingVertical: 4 },
  notice: { backgroundColor: colors.sageLight, borderRadius: radius.lg, padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.card },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18 },
});

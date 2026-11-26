import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useCart } from "@/features/cart/CartProvider";
import { MAX_LINE_QUANTITY } from "@/lib/cart";
import { colors, fonts, radius } from "@/theme/tokens";

const money = (amount: string, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { cart, busy, error, setQuantity, remove } = useCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <View style={[styles.screen, styles.empty, { paddingTop: insets.top }]}>
        <Ionicons name="bag-outline" size={44} color={colors.sage} />
        <Text variant="title" style={{ color: colors.cream, marginTop: 14 }}>
          Your cart is empty
        </Text>
        <Text variant="small" style={{ color: colors.sage, marginTop: 6, textAlign: "center" }}>
          Plants you add will wait for you here.
        </Text>
        <View style={{ marginTop: 22 }}>
          <Link href="/shop" asChild>
            <Button label="Continue shopping" variant="light" />
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Text variant="display" style={{ color: colors.cream, paddingHorizontal: 20 }}>
        Your cart
      </Text>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {cart.lines.map((line) => (
          <Animated.View
            key={line.id}
            layout={LinearTransition.springify().damping(18)}
            entering={FadeInDown.duration(300)}
            style={styles.line}
          >
            <Image source={{ uri: line.image }} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text variant="title" numberOfLines={2} style={{ color: colors.cream, fontSize: 17, lineHeight: 22 }}>
                {line.name}
              </Text>
              {line.variantTitle ? (
                <Text variant="small" style={{ color: colors.sage }}>
                  {line.variantTitle}
                </Text>
              ) : null}
              <View style={styles.row}>
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease quantity of ${line.name}`}
                    disabled={busy || line.quantity <= 1}
                    onPress={() => void setQuantity(line.id, line.quantity - 1)}
                    style={[styles.stepBtn, (busy || line.quantity <= 1) && { opacity: 0.4 }]}
                  >
                    <Ionicons name="remove" size={18} color={colors.cream} />
                  </Pressable>
                  <Text variant="body" accessibilityLabel={`Quantity ${line.quantity}`} style={styles.qty}>
                    {line.quantity}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Increase quantity of ${line.name}`}
                    disabled={busy || line.quantity >= MAX_LINE_QUANTITY}
                    onPress={() => void setQuantity(line.id, line.quantity + 1)}
                    style={[styles.stepBtn, (busy || line.quantity >= MAX_LINE_QUANTITY) && { opacity: 0.4 }]}
                  >
                    <Ionicons name="add" size={18} color={colors.cream} />
                  </Pressable>
                </View>
                <Text variant="body" style={{ color: colors.cream, fontFamily: fonts.bodySemibold }}>
                  {money(line.lineTotal, cart.subtotal.currency)}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${line.name}`}
              disabled={busy}
              onPress={() => void remove(line.id)}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={colors.sage} />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: 16 }]}>
        {error ? (
          <Text accessibilityRole="alert" variant="small" style={{ color: "#f4b8a0", marginBottom: 8 }}>
            {error}
          </Text>
        ) : null}
        <View style={styles.row}>
          <Text variant="small" style={{ color: colors.sage }}>
            Subtotal
          </Text>
          <Text variant="title" style={{ color: colors.cream }}>
            {money(cart.subtotal.amount, cart.subtotal.currency)}
          </Text>
        </View>
        <Text variant="small" style={{ color: colors.sage, marginVertical: 8 }}>
          Shipping and taxes are calculated at checkout.
        </Text>
        <Button
          label="Checkout"
          variant="light"
          loading={busy}
          onPress={() => void WebBrowser.openBrowserAsync(cart.checkoutUrl)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.forest },
  empty: { alignItems: "center", justifyContent: "center", padding: 32 },
  line: { flexDirection: "row", gap: 14, backgroundColor: "rgba(250,243,229,0.07)", borderRadius: radius.lg, padding: 12 },
  thumb: { width: 84, height: 104, borderRadius: radius.md, backgroundColor: colors.sand },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  stepper: { flexDirection: "row", alignItems: "center", borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(250,243,229,0.3)" },
  stepBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 24, textAlign: "center", color: colors.cream },
  footer: { padding: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(250,243,229,0.25)" },
});

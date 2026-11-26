import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { type ColorValue, Platform } from "react-native";

import { useCart } from "@/features/cart/CartProvider";
import { colors, fonts } from "@/theme/tokens";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const tab = (title: string, icon: IconName, focused: IconName) => ({
  title,
  tabBarIcon: ({ color, focused: isFocused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={isFocused ? focused : icon} size={size} color={typeof color === "string" ? color : colors.forest} />
  ),
});

export default function TabsLayout() {
  const { cart } = useCart();
  const count = cart?.totalQuantity ?? 0;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name="index" options={tab("Home", "leaf-outline", "leaf")} />
      <Tabs.Screen name="shop" options={tab("Shop", "storefront-outline", "storefront")} />
      <Tabs.Screen
        name="cart"
        options={{
          ...tab("Cart", "bag-outline", "bag"),
          ...(count > 0 ? { tabBarBadge: count } : {}),
          tabBarBadgeStyle: { backgroundColor: colors.clay, color: colors.cream, fontFamily: fonts.bodySemibold },
        }}
      />
      <Tabs.Screen name="wishlist" options={tab("Wishlist", "heart-outline", "heart")} />
      <Tabs.Screen name="account" options={tab("Account", "person-outline", "person")} />
    </Tabs>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";

import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { colors, shadow } from "@/theme/tokens";

/** Heart that saves a plant. Visitors who are not signed in are taken to sign in first. */
export function WishlistHeart({ handle, name, style, size = 40 }: { handle: string; name: string; style?: StyleProp<ViewStyle>; size?: number }) {
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const saved = has(handle);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      hitSlop={6}
      onPress={async () => {
        if (!(await toggle(handle))) router.push("/auth/login");
      }}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }, style]}
    >
      <Ionicons name={saved ? "heart" : "heart-outline"} size={size * 0.52} color={saved ? colors.clay : colors.forest} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: "rgba(250,243,229,0.95)", alignItems: "center", justifyContent: "center", ...shadow.card },
});

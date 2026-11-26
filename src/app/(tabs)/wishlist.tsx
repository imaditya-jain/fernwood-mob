import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Text";
import { colors } from "@/theme/tokens";

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 24, paddingHorizontal: 24 }}>
      <Text variant="eyebrow">Fernwood</Text>
      <Text variant="display" style={{ marginTop: 8 }}>Wishlist</Text>
    </View>
  );
}

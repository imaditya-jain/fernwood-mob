import { ActivityIndicator, View } from "react-native";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { colors } from "@/theme/tokens";

export function Loading() {
  return (
    <View style={{ padding: 48, alignItems: "center" }}>
      <ActivityIndicator color={colors.forest} />
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ padding: 32, alignItems: "center", gap: 12 }}>
      <Text variant="title">We couldn&apos;t load this</Text>
      <Text variant="small" style={{ textAlign: "center" }}>
        Check your connection and try again.
      </Text>
      <Button label="Try again" variant="outline" onPress={onRetry} />
    </View>
  );
}

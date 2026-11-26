import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { colors } from "@/theme/tokens";

export function SignInPrompt({ title, text, icon }: { title: string; text: string; icon: React.ComponentProps<typeof Ionicons>["name"] }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.sageLight, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={30} color={colors.forest} />
      </View>
      <Text variant="title" style={{ textAlign: "center" }}>
        {title}
      </Text>
      <Text variant="small" style={{ textAlign: "center", maxWidth: 280 }}>
        {text}
      </Text>
      <View style={{ marginTop: 12, gap: 10, alignSelf: "stretch" }}>
        <Button label="Sign in" onPress={() => router.push("/auth/login")} />
        <Button label="Create account" variant="outline" onPress={() => router.push("/auth/register")} />
      </View>
    </View>
  );
}

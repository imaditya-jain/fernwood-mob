import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Text";
import { colors } from "@/theme/tokens";

/** Shared look for the sign-in screens: forest header band, cream sheet with the form. */
export function AuthFrame({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 36 }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.cream} />
          </Pressable>
          <Text variant="eyebrow" style={{ color: colors.sage, marginTop: 20 }}>
            {eyebrow}
          </Text>
          <Text variant="display" style={{ color: colors.cream, marginTop: 6 }}>
            {title}
          </Text>
          {intro ? (
            <Text variant="body" style={{ color: colors.cream, opacity: 0.8, marginTop: 8 }}>
              {intro}
            </Text>
          ) : null}
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.cream,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: insets.bottom + 24,
            gap: 16,
          }}
        >
          {children}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

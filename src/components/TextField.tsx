import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { Text } from "@/components/Text";
import { colors, fonts, radius } from "@/theme/tokens";

type Props = TextInputProps & { label: string; error?: string | undefined; hint?: string };

export function TextField({ label, error, hint, style, secureTextEntry, ...rest }: Props) {
  // A password field gets an eye button: people mistype on a phone and cannot see what they typed.
  const [shown, setShown] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" style={{ color: colors.text, fontFamily: fonts.bodyMedium }}>
        {label}
      </Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          {...rest}
          secureTextEntry={secureTextEntry ? !shown : false}
          style={[styles.input, secureTextEntry ? { paddingRight: 52 } : null, error ? { borderColor: colors.danger } : null, style]}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? "Hide password" : "Show password"}
            hitSlop={8}
            onPress={() => setShown((value) => !value)}
            style={styles.eye}
          >
            <Ionicons name={shown ? "eye-off-outline" : "eye-outline"} size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small">{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eye: { position: "absolute", right: 0, top: 0, bottom: 0, width: 52, alignItems: "center", justifyContent: "center" },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
});

import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { Text } from "@/components/Text";
import { colors, fonts, radius } from "@/theme/tokens";

type Props = TextInputProps & { label: string; error?: string | undefined; hint?: string };

export function TextField({ label, error, hint, style, ...rest }: Props) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" style={{ color: colors.text, fontFamily: fonts.bodyMedium }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...rest}
        style={[styles.input, error ? { borderColor: colors.danger } : null, style]}
      />
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

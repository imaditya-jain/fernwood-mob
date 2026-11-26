import { Text as RNText, type TextProps } from "react-native";

import { colors, fonts } from "@/theme/tokens";

type Variant = "display" | "title" | "body" | "small" | "eyebrow";

const styles = {
  display: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, color: colors.forest },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.forest },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  eyebrow: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: colors.clay,
  },
} as const;

export function Text({ variant = "body", style, ...props }: TextProps & { variant?: Variant }) {
  return <RNText {...props} style={[styles[variant], style]} />;
}

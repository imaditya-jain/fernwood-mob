/** Brand tokens. Exact sRGB conversions of the website's OKLCH tokens (src/styles.css in the storefront). */
export const colors = {
  cream: "#faf3e5",
  card: "#fdfaf4",
  sand: "#efe3cb",
  forest: "#314329",
  forestDeep: "#1a2c16",
  moss: "#526540",
  clay: "#bf623d",
  clayDeep: "#9a4729",
  sage: "#9bab8a",
  sageLight: "#e1e0c6",
  text: "#25321e",
  muted: "#59614c",
  border: "#ddd4bb",
  white: "#ffffff",
  danger: "#b3261e",
} as const;

export const radius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Loaded in the root layout (Fraunces for display, Work Sans for body, as on the website). */
export const fonts = {
  display: "Fraunces_500Medium",
  displayRegular: "Fraunces_400Regular",
  body: "WorkSans_400Regular",
  bodyMedium: "WorkSans_500Medium",
  bodySemibold: "WorkSans_600SemiBold",
} as const;

export const shadow = {
  card: {
    shadowColor: "#1a2c16",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;

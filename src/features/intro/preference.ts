import * as SecureStore from "expo-secure-store";

export type IntroStyle = "mix" | "doors" | "jungle";
const KEY = "fw_intro_style";

export const INTRO_LABELS: Record<IntroStyle, string> = {
  mix: "Surprise me",
  doors: "Greenhouse doors",
  jungle: "Walk through the plants",
};

export async function readIntroStyle(): Promise<IntroStyle> {
  try {
    const value = await SecureStore.getItemAsync(KEY);
    return value === "doors" || value === "jungle" || value === "mix" ? value : "mix";
  } catch {
    return "mix";
  }
}

export const saveIntroStyle = (style: IntroStyle) => SecureStore.setItemAsync(KEY, style).catch(() => undefined);

/** "Surprise me" alternates by chance on every launch, so the opening always feels fresh. */
export const resolveIntro = (style: IntroStyle, chance = Math.random()): "doors" | "jungle" =>
  style === "mix" ? (chance < 0.5 ? "doors" : "jungle") : style;

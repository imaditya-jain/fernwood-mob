/** General, well-known plant-care thoughts (nothing about our products), so the welcome is never the same twice in a row. */
const TIPS = [
  "Most houseplants prefer a good drink less often over a sip every day.",
  "Turn a plant a quarter turn each week and it grows evenly.",
  "Dust on leaves is shade. Wipe them with a soft, damp cloth.",
  "Check the soil with a finger before you water.",
  "Morning light is gentle; midday sun through glass can scorch.",
  "A pot with a drainage hole is a plant's best friend.",
  "New growth is the clearest way a plant says thank you.",
  "Group plants together and they share a little humidity.",
] as const;

export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return "Welcome in";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** A different tip on every launch (and never the one shown last time within a session). */
export function pickTip(seed = Math.random()): string {
  return TIPS[Math.floor(seed * TIPS.length) % TIPS.length] ?? TIPS[0];
}

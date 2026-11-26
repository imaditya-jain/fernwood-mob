import { useEffect, useState } from "react";

import { GreenhouseIntro } from "@/features/intro/GreenhouseIntro";
import { JungleIntro } from "@/features/intro/JungleIntro";
import { readIntroStyle, resolveIntro } from "@/features/intro/preference";

/** Plays the welcome the shopper chose (or a surprise) once per launch, then removes itself. */
export function IntroGate({ onDone }: { onDone: () => void }) {
  const [which, setWhich] = useState<"doors" | "jungle" | null>(null);
  useEffect(() => {
    let cancelled = false;
    void readIntroStyle().then((style) => {
      if (!cancelled) setWhich(resolveIntro(style));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!which) return null;
  return which === "jungle" ? <JungleIntro onDone={onDone} /> : <GreenhouseIntro onDone={onDone} />;
}

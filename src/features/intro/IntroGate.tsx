import { useEffect, useState } from "react";

import { GreenhouseIntro } from "@/features/intro/GreenhouseIntro";
import { JungleIntro } from "@/features/intro/JungleIntro";
import { readIntroStyle, resolveIntro } from "@/features/intro/preference";

/** Plays the welcome the shopper chose (or a surprise) once per launch, then removes itself. */
export function IntroGate({ onReady, onDone }: { onReady: () => void; onDone: () => void }) {
  const [which, setWhich] = useState<"doors" | "jungle" | null>(null);
  useEffect(() => {
    let cancelled = false;
    void readIntroStyle().then((style) => {
      if (cancelled) return;
      setWhich(resolveIntro(style));
      onReady();
    });
    return () => {
      cancelled = true;
    };
    // Reads the saved choice once at launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!which) return null;
  return which === "jungle" ? <JungleIntro onDone={onDone} /> : <GreenhouseIntro onDone={onDone} />;
}

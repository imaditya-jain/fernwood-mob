import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorState, Loading } from "@/components/QueryState";
import { SwipeDeck } from "@/components/SwipeDeck";
import { Text } from "@/components/Text";
import { WishlistHeart } from "@/components/WishlistHeart";
import { formatPrice } from "@/lib/format";
import {
  type Answers,
  BUDGET_STEPS,
  buildDeck,
  DEFAULT_ANSWERS,
  isPlant,
  LIGHT_STEPS,
  personality,
  rankPlants,
  SIZE_STEPS,
  sizeBucket,
  type SizeId,
} from "@/lib/plant-finder";
import { useProducts } from "@/lib/shopify/hooks";
import { colors, fonts, radius, shadow } from "@/theme/tokens";

type Step = "intro" | "light" | "size" | "budget" | "swipe" | "result";
const ORDER: Step[] = ["intro", "light", "size", "budget", "swipe", "result"];

export default function PlantFinderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isPending, isError, refetch } = useProducts();
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [lightPicked, setLightPicked] = useState(false);
  const [sizePicked, setSizePicked] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);

  const plants = useMemo(() => (data ?? []).filter(isPlant), [data]);
  const deck = useMemo(() => buildDeck(plants, answers), [plants, answers]);
  const matches = useMemo(() => rankPlants(plants, answers, liked, passed), [plants, answers, liked, passed]);
  const sizeImages = useMemo(() => {
    const picks: Partial<Record<SizeId, string>> = {};
    for (const plant of plants) {
      const bucket = sizeBucket(plant.size);
      if (bucket && !picks[bucket] && plant.image) picks[bucket] = plant.image;
    }
    return picks;
  }, [plants]);

  const lightIndex = Math.max(0, LIGHT_STEPS.findIndex((s) => s.id === answers.light));
  const progress = (ORDER.indexOf(step) / (ORDER.length - 1)) * 100;
  const back = () => {
    const previous = ORDER[ORDER.indexOf(step) - 1];
    if (!previous || step === "result") return router.back();
    setStep(previous === "swipe" ? "budget" : previous);
  };
  const restart = () => {
    setAnswers(DEFAULT_ANSWERS);
    setLightPicked(false);
    setSizePicked(false);
    setLiked([]);
    setPassed([]);
    setStep("intro");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={step === "intro" ? () => router.back() : back} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.cream} />
        </Pressable>
        <Text variant="eyebrow" style={{ color: colors.sage }}>Plant Finder</Text>
        <View style={{ width: 26 }} />
      </View>
      <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Progress">
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {isPending ? (
          <Loading />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : plants.length === 0 ? (
          <View style={{ padding: 24, alignItems: "center", gap: 8 }}>
            <Text variant="title">The Plant Finder is getting ready</Text>
            <Text variant="small" style={{ textAlign: "center" }}>Check back soon, or browse the shop.</Text>
          </View>
        ) : (
          <Animated.View key={step} entering={FadeInDown.duration(380)} style={{ gap: 20 }}>
            {step === "intro" ? (
              <View style={{ gap: 14, paddingTop: 12 }}>
                <Text variant="display">Find the plant that fits your life</Text>
                <Text variant="body" style={{ color: colors.muted }}>
                  Tell us about your space, then swipe through a few plants. Like the ones you love and pass on the rest, and we&apos;ll show the plants that suit you best.
                </Text>
                <Button label="Let's go" onPress={() => setStep("light")} />
                <Text variant="small" style={{ textAlign: "center" }}>Three questions, a few plants to swipe, about a minute.</Text>
              </View>
            ) : null}

            {step === "light" ? (
              <>
                <Heading title="How much light does your space get?" hint="Think about the spot where the plant will live." />
                <View style={styles.sun}>
                  <Ionicons name={(["cloudy-outline", "partly-sunny-outline", "sunny-outline", "sunny"] as const)[lightIndex] ?? "sunny-outline"} size={72} color={colors.clay} />
                </View>
                <Slider
                  accessibilityLabel="Light in your space"
                  accessibilityValue={{ text: LIGHT_STEPS[lightIndex]?.label ?? "" }}
                  minimumValue={0}
                  maximumValue={LIGHT_STEPS.length - 1}
                  step={1}
                  value={lightIndex}
                  minimumTrackTintColor={colors.clay}
                  maximumTrackTintColor={colors.sageLight}
                  thumbTintColor={colors.clay}
                  onValueChange={(value) => {
                    const chosen = LIGHT_STEPS[Math.round(value)];
                    if (chosen) {
                      setAnswers((a) => ({ ...a, light: chosen.id }));
                      setLightPicked(true);
                    }
                  }}
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text variant="small">Dim</Text>
                  <Text variant="small">Sunny</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text variant="title" accessibilityLiveRegion="polite">{LIGHT_STEPS[lightIndex]?.label}</Text>
                  <Text variant="small">{LIGHT_STEPS[lightIndex]?.hint}</Text>
                </View>
                <Button label="Next" onPress={() => setStep("size")} />
              </>
            ) : null}

            {step === "size" ? (
              <>
                <Heading title="How much room does the plant have?" hint="Pick the space it will sit in." />
                <View style={{ gap: 12 }}>
                  {SIZE_STEPS.map((option) => {
                    const selected = sizePicked && answers.size === option.id;
                    const photo = sizeImages[option.id];
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setAnswers((a) => ({ ...a, size: option.id }));
                          setSizePicked(true);
                        }}
                        style={[styles.option, selected && styles.optionOn]}
                      >
                        {photo ? <Image source={{ uri: photo }} style={styles.optionImage} contentFit="cover" /> : <View style={styles.optionImage} />}
                        <View style={{ flex: 1 }}>
                          <Text variant="title" style={{ fontSize: 17 }}>{option.label}</Text>
                          <Text variant="small">{option.hint}</Text>
                        </View>
                        {selected ? <Ionicons name="checkmark-circle" size={24} color={colors.clay} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
                <Button label="Next" disabled={!sizePicked} onPress={() => setStep("budget")} />
              </>
            ) : null}

            {step === "budget" ? (
              <>
                <Heading title="What is your budget for one plant?" hint="You can change your mind later." />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {BUDGET_STEPS.map((option) => {
                    const selected = answers.budget === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => setAnswers((a) => ({ ...a, budget: option.id }))}
                        style={[styles.budget, selected && styles.optionOn]}
                      >
                        <Text variant="title" style={{ fontSize: 17 }}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Button label="Show me plants" onPress={() => { setLiked([]); setPassed([]); setStep("swipe"); }} />
              </>
            ) : null}

            {step === "swipe" ? (
              <>
                <Heading title="Swipe through a few plants" hint="Like the ones you love. Pass on the rest." />
                {deck.length > 0 ? (
                  <SwipeDeck
                    plants={deck}
                    onDone={(l, p) => {
                      setLiked(l);
                      setPassed(p);
                      setStep("result");
                    }}
                  />
                ) : (
                  <Button label="See my matches" onPress={() => setStep("result")} />
                )}
              </>
            ) : null}

            {step === "result" ? (
              <Animated.View entering={FadeIn.duration(400)} style={{ gap: 20 }}>
                <View style={styles.personality}>
                  <Text variant="eyebrow">You are</Text>
                  <Text variant="title" style={{ fontSize: 26, marginTop: 4 }}>{personality(answers).name}</Text>
                  <Text variant="small" style={{ marginTop: 6 }}>{personality(answers).description}</Text>
                </View>
                <Heading title="Your best matches" />
                {matches.map(({ plant, reasons }) => (
                  <Pressable
                    key={plant.id}
                    accessibilityRole="link"
                    accessibilityLabel={`View ${plant.name}`}
                    onPress={() => router.push({ pathname: "/product/[handle]", params: { handle: plant.slug } })}
                    style={styles.match}
                  >
                    <View>
                      <Image source={{ uri: plant.image }} style={styles.matchImage} contentFit="cover" />
                      <WishlistHeart handle={plant.slug} name={plant.name} size={36} style={{ position: "absolute", right: 10, top: 10 }} />
                    </View>
                    <View style={{ padding: 14, gap: 6 }}>
                      <Text variant="title" style={{ fontSize: 19 }}>{plant.name}</Text>
                      <Text variant="body" style={{ color: colors.forest, fontFamily: fonts.bodySemibold }}>{formatPrice(plant.price)}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityLabel={`Why ${plant.name} suits you`}>
                        {reasons.map((reason) => (
                          <View key={reason.text} style={styles.reason}>
                            <Text variant="small" style={{ color: colors.forest }}>{reason.text}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                ))}
                <Button label="Start again" variant="outline" onPress={restart} />
              </Animated.View>
            ) : null}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function Heading({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Text variant="title" accessibilityRole="header" style={{ textAlign: "center", fontSize: 26, lineHeight: 32 }}>{title}</Text>
      {hint ? <Text variant="small" style={{ textAlign: "center" }}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.forestDeep, paddingHorizontal: 20, paddingBottom: 14 },
  progressTrack: { height: 4, backgroundColor: colors.sageLight },
  progressBar: { height: 4, backgroundColor: colors.clay },
  sun: { alignItems: "center", paddingVertical: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: radius.lg, padding: 10, borderWidth: 2, borderColor: "transparent", ...shadow.card },
  optionOn: { borderColor: colors.clay },
  optionImage: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.sand },
  budget: { width: "47%", minHeight: 64, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 2, borderColor: "transparent", ...shadow.card },
  personality: { backgroundColor: colors.sageLight, borderRadius: radius.lg, padding: 18 },
  match: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  matchImage: { width: "100%", aspectRatio: 4 / 3, backgroundColor: colors.sand },
  reason: { backgroundColor: colors.sageLight, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
});

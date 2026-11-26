import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { Loading } from "@/components/QueryState";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, apiRequest } from "@/lib/api";
import {
  type DiagnosisRecord,
  type DiagnosisSummary,
  type HealthLevel,
  MAX_NOTES_LENGTH,
  PLANT_DOCTOR_DISCLAIMER,
} from "@/lib/plant-doctor";
import { colors, fonts, radius, shadow } from "@/theme/tokens";

const HEALTH: Record<HealthLevel, { label: string; bg: string; fg: string }> = {
  healthy: { label: "Looking healthy", bg: colors.sageLight, fg: colors.forest },
  minor_issues: { label: "Minor issues", bg: colors.sand, fg: colors.forest },
  needs_attention: { label: "Needs attention", bg: "rgba(191,98,61,0.15)", fg: colors.clayDeep },
  urgent: { label: "Needs help soon", bg: "rgba(179,38,30,0.12)", fg: colors.danger },
  unclear: { label: "Can't tell yet", bg: colors.sand, fg: colors.muted },
};
const MESSAGES = ["Looking at the leaves…", "Checking colour and texture…", "Thinking about light and water…", "Looking for pests and disease…", "Putting your care plan together…"];

const friendly = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 429) return "You've reached today's limit of plant checks. Please come back tomorrow.";
    if (error.status === 404) return "The Plant Doctor isn't available on the shop yet. Please try again soon.";
    if (error.status === 0) return "We couldn't reach the shop. Check your connection and try again.";
    return error.message;
  }
  return "Something went wrong. Check your connection and try again.";
};

/** Shrinks the photo on the phone before it is sent: a camera photo is many megabytes and the Doctor needs far less. */
async function prepare(uri: string): Promise<string> {
  const result = await manipulateAsync(uri, [{ resize: { width: 1600 } }], { compress: 0.85, format: SaveFormat.JPEG });
  return result.uri;
}

function Scan() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t]);
  const style = useAnimatedStyle(() => ({ top: `${t.value * 85}%` }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(26,44,22,0.35)" }]} />
      <Animated.View style={[{ position: "absolute", left: 0, right: 0, height: 56, backgroundColor: "rgba(155,171,138,0.55)" }, style]} />
    </View>
  );
}

function Steps({ title, items, bad }: { title: string; items: string[]; bad?: boolean }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.card}>
      <Text variant="title" style={{ fontSize: 18 }}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 8, backgroundColor: bad ? colors.danger : colors.clay }} />
          <Text variant="body" style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Result({ record, onAgain }: { record: DiagnosisRecord; onAgain: () => void }) {
  const d = record.diagnosis;
  const health = HEALTH[d.health];
  const [open, setOpen] = useState(0);
  return (
    <Animated.View entering={FadeInDown.duration(450)} style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text variant="eyebrow">Your plant</Text>
        <Text variant="display" style={{ fontSize: 32, lineHeight: 36 }}>{d.plant?.commonName ?? "We couldn't identify it"}</Text>
        {d.plant?.scientificName ? <Text variant="small" style={{ fontStyle: "italic" }}>{d.plant.scientificName}</Text> : null}
        <View style={[styles.pill, { backgroundColor: health.bg }]}>
          <Text variant="small" style={{ color: health.fg, fontFamily: fonts.bodySemibold }}>{health.label}</Text>
        </View>
      </View>
      {d.photoIssue ? <View style={[styles.card, { backgroundColor: colors.sand }]}><Text variant="body" style={{ fontSize: 15 }}>{d.photoIssue}</Text></View> : null}
      <Text variant="body">{d.summary}</Text>

      {d.findings.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text variant="title">What we can see</Text>
          {d.findings.map((finding, index) => (
            <Pressable key={finding.title} accessibilityRole="button" accessibilityState={{ expanded: open === index }} onPress={() => setOpen(open === index ? -1 : index)} style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text variant="title" style={{ flex: 1, fontSize: 18 }}>{finding.title}</Text>
                <View style={[styles.pill, { backgroundColor: finding.severity === "severe" ? "rgba(179,38,30,0.12)" : finding.severity === "moderate" ? "rgba(191,98,61,0.15)" : colors.sageLight }]}>
                  <Text variant="small" style={{ textTransform: "capitalize", color: colors.forest }}>{finding.severity}</Text>
                </View>
              </View>
              {open === index ? (
                <View style={{ marginTop: 8, gap: 6 }}>
                  <Text variant="body" style={{ fontSize: 15 }}>{finding.evidence}</Text>
                  {finding.likelyCauses.map((cause) => <Text key={cause} variant="small">• {cause}</Text>)}
                  <Text variant="small" style={{ textTransform: "uppercase", letterSpacing: 1 }}>Confidence: {finding.confidence}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text variant="title">Your care plan</Text>
      <Steps title="Right now" items={d.carePlan.rightNow} />
      <Steps title="This week" items={d.carePlan.thisWeek} />
      <Steps title="Keep doing" items={d.carePlan.ongoing} />
      <Steps title="Avoid" items={d.carePlan.avoid} bad />
      <Steps title="Watch for" items={d.watchFor} />
      <Steps title="Helpful to know" items={d.questions} />
      {d.whenToGetHelp ? (
        <View style={[styles.card, { backgroundColor: "rgba(191,98,61,0.12)", flexDirection: "row", gap: 10 }]}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.clay} />
          <Text variant="body" style={{ flex: 1, fontSize: 15 }}>{d.whenToGetHelp}</Text>
        </View>
      ) : null}

      {d.research && (d.research.tips.length > 0 || d.research.treatments.length > 0) ? (
        <View style={{ gap: 12 }}>
          <Text variant="title">From the web</Text>
          <Steps title="Tips for this problem" items={d.research.tips} />
          {d.research.treatments.length > 0 ? (
            <View style={styles.card}>
              <Text variant="title" style={{ fontSize: 18 }}>Treatments gardeners use</Text>
              {d.research.treatments.map((t) => (
                <View key={t.name} style={{ marginTop: 10, gap: 2 }}>
                  <Text variant="body" style={{ fontFamily: fonts.bodySemibold, color: colors.forest }}>{t.name}</Text>
                  <Text variant="body" style={{ fontSize: 15, lineHeight: 22 }}>{t.about}</Text>
                  <Text variant="small">{t.safety}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {d.research.sources.length > 0 ? (
            <View style={{ gap: 4 }}>
              <Text variant="small">Sources</Text>
              {d.research.sources.map((source) => (
                <Pressable key={source.url} accessibilityRole="link" onPress={() => void Linking.openURL(source.url)} hitSlop={6}>
                  <Text variant="small" style={{ color: colors.forest, textDecorationLine: "underline" }}>{source.title}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {d.products.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text variant="title">From our shop, for this plan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {d.products.map(({ product, reason }) => (
              <View key={product.id} style={{ width: 200, gap: 8 }}>
                <ProductCard product={product} width={200} />
                <Text variant="small">{reason}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.sageLight, flexDirection: "row", gap: 10 }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.forest} />
        <Text variant="small" style={{ flex: 1 }}>{PLANT_DOCTOR_DISCLAIMER}</Text>
      </View>
      <Button label="Check another plant" onPress={onAgain} />
    </Animated.View>
  );
}

export default function DoctorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const client = useQueryClient();
  const { status } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<DiagnosisRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const history = useQuery({
    queryKey: ["plant-doctor"],
    queryFn: () => apiRequest<{ enabled: boolean; items: DiagnosisSummary[] }>("/api/plant-doctor"),
    enabled: status === "authenticated",
  });

  const analyse = useMutation({
    mutationFn: async () => {
      if (!photo) throw new Error("no photo");
      const uri = await prepare(photo);
      const form = new FormData();
      // React Native's FormData takes a file as { uri, name, type }; the cast is the documented way to type it.
      form.append("photo", { uri, name: "plant.jpg", type: "image/jpeg" } as unknown as Blob);
      if (notes.trim()) form.append("notes", notes.trim());
      return apiRequest<DiagnosisRecord>("/api/plant-doctor", { method: "POST", form });
    },
    onSuccess: (record) => {
      setResult(record);
      void client.invalidateQueries({ queryKey: ["plant-doctor"] });
    },
    onError: (caught) => setError(friendly(caught)),
  });

  useEffect(() => {
    if (!analyse.isPending) return;
    const timer = setInterval(() => setStep((value) => (value + 1) % MESSAGES.length), 2600);
    return () => clearInterval(timer);
  }, [analyse.isPending]);

  const pick = async (source: "camera" | "library") => {
    setError(null);
    const permission =
      source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        source === "camera" ? "Camera access is off" : "Photo access is off",
        "Allow it in your phone's settings to use the Plant Doctor.",
        [{ text: "Not now", style: "cancel" }, { text: "Open settings", onPress: () => void Linking.openSettings() }],
      );
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.9, allowsEditing: false, exif: false };
    const picked = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.canceled ? undefined : picked.assets[0];
    if (asset) setPhoto(asset.uri);
  };

  const reset = () => {
    setPhoto(null);
    setNotes("");
    setResult(null);
    setError(null);
    analyse.reset();
  };

  const open = async (id: string) => {
    try {
      setResult(await apiRequest<DiagnosisRecord>(`/api/plant-doctor/${id}`));
    } catch (caught) {
      setError(friendly(caught));
    }
  };

  const remove = async (id: string) => {
    await apiRequest(`/api/plant-doctor/${id}`, { method: "DELETE" }).catch(() => undefined);
    void client.invalidateQueries({ queryKey: ["plant-doctor"] });
  };

  // A 404 means the shop has not been updated with the Plant Doctor yet: say so, instead of letting someone take a photo for nothing.
  const missing = history.error instanceof ApiError && history.error.status === 404;
  const enabled = !missing && (history.data?.enabled ?? true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.cream} />
        </Pressable>
        <Text variant="eyebrow" style={{ color: colors.sage }}>Plant Doctor</Text>
        <View style={{ width: 26 }} />
      </View>
      <KeyboardAwareScrollView bottomOffset={96} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 18 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {status === "loading" ? (
          <Loading />
        ) : status !== "authenticated" ? (
          <SignInPrompt icon="medkit-outline" title="Sign in to check your plant" text="The Plant Doctor looks at your photo and builds a care plan. A free account keeps your checks together." />
        ) : !enabled ? (
          <View style={[styles.card, { alignItems: "center" }]}>
            <Text variant="title">Plant Doctor is coming soon</Text>
            <Text variant="small" style={{ textAlign: "center", marginTop: 6 }}>Soon you will be able to photograph a struggling plant and get a care plan. We will tell you when it is ready.</Text>
          </View>
        ) : result ? (
          <Result record={result} onAgain={reset} />
        ) : (
          <>
            <Text variant="display" style={{ fontSize: 30, lineHeight: 34 }}>Show us your plant</Text>
            <Text variant="small">Take a clear, close photo of the leaf or stem that worries you, in daylight. A photo of the whole plant helps too.</Text>
            {photo ? (
              <View style={styles.preview}>
                <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {analyse.isPending ? <Scan /> : null}
              </View>
            ) : (
              <View style={styles.drop}>
                <View style={styles.dropIcon}><Ionicons name="camera" size={30} color={colors.cream} /></View>
                <Text variant="small" style={{ textAlign: "center" }}>Daylight · In focus · Close to the problem</Text>
              </View>
            )}
            {analyse.isPending ? (
              <Text accessibilityLiveRegion="polite" variant="body" style={{ textAlign: "center", color: colors.forest }}>{MESSAGES[step]}</Text>
            ) : (
              <>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}><Button label="Take a photo" onPress={() => void pick("camera")} /></View>
                  <View style={{ flex: 1 }}><Button label="Choose a photo" variant="outline" onPress={() => void pick("library")} /></View>
                </View>
                {photo ? (
                  <>
                    <View style={{ gap: 6 }}>
                      <Text variant="small" style={{ color: colors.text, fontFamily: fonts.bodyMedium }}>Anything we should know? (optional)</Text>
                      <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        maxLength={MAX_NOTES_LENGTH}
                        multiline
                        placeholder="How often you water, how much light it gets, when you first noticed it, pets at home…"
                        placeholderTextColor={colors.muted}
                        accessibilityLabel="Notes about your plant"
                        style={styles.notes}
                      />
                      <Text variant="small" style={{ textAlign: "right" }}>{notes.length}/{MAX_NOTES_LENGTH}</Text>
                    </View>
                    <Button label="Check my plant" onPress={() => { setError(null); analyse.mutate(); }} />
                  </>
                ) : null}
              </>
            )}
            {error ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}

            {history.data && history.data.items.length > 0 && !analyse.isPending ? (
              <View style={{ gap: 10, marginTop: 10 }}>
                <Text variant="title" style={{ fontSize: 20 }}>Your recent checks</Text>
                {history.data.items.map((item) => (
                  <View key={item.id} style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
                    <Pressable accessibilityRole="button" onPress={() => void open(item.id)} style={{ flex: 1 }}>
                      <Text variant="body" numberOfLines={1} style={{ fontFamily: fonts.bodySemibold }}>{item.plantName}</Text>
                      <Text variant="small" numberOfLines={1}>{new Date(item.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })} · {HEALTH[item.health].label}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Delete the check of ${item.plantName}`} onPress={() => void remove(item.id)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={20} color={colors.muted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.forestDeep, paddingHorizontal: 20, paddingBottom: 14 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow.card },
  pill: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.xl, overflow: "hidden", backgroundColor: colors.sand, ...shadow.card },
  drop: { alignItems: "center", gap: 12, borderRadius: radius.xl, borderWidth: 2, borderStyle: "dashed", borderColor: colors.sage, backgroundColor: "rgba(225,224,198,0.3)", paddingVertical: 40 },
  dropIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  notes: { minHeight: 90, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: 14, fontFamily: fonts.body, fontSize: 15, color: colors.text, textAlignVertical: "top" },
});

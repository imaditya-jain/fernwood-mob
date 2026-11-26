import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeInDown,
  interpolate,
  LinearTransition,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorState, Loading } from "@/components/QueryState";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useCart } from "@/features/cart/CartProvider";
import { type Booking, bookingAttributes, bookingSchema, fetchGardenerService, GARDENER_CITIES, type GardenerService } from "@/lib/gardener";
import { colors, fonts, radius, shadow } from "@/theme/tokens";

const ONE_TIME = "one-time";
const toCents = (amount: string) => Math.round(Number(amount) * 100);
const money = (amount: string, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(Number(amount));
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

type Option = { value: string; label: string; price: string; note: string; saving: string | null; popular: boolean };

function options(service: GardenerService): Option[] {
  const single = toCents(service.oneTimePrice);
  return [
    { value: ONE_TIME, label: "One-time visit", price: service.oneTimePrice, note: "Pay once, no commitment", saving: null, popular: false },
    ...service.plans.map((plan) => {
      const cents = toCents(plan.price);
      const percent = single > 0 ? Math.round(((single - cents) / single) * 100) : 0;
      return {
        value: plan.id,
        label: plan.name,
        price: plan.price,
        note: "Charged each visit",
        saving: cents < single && percent > 0 ? `Save ${percent}%` : null,
        popular: plan.name.toLowerCase().includes("fortnightly"),
      };
    }),
  ];
}


const SITE = process.env.EXPO_PUBLIC_API_URL ?? "";
const INCLUDED = ["Care for your plants at your address", "You choose the first visit date", "Charged per visit, not upfront"];
const STEPS = [
  { icon: "clipboard-outline", title: "Choose a plan", text: "One visit or a regular rhythm." },
  { icon: "location-outline", title: "Tell us where", text: "Your address and the day that suits you." },
  { icon: "leaf-outline", title: "We come to you", text: "A Fernwood gardener cares for your plants." },
] as const;
const QUESTIONS = [
  { q: "Where do you offer the service?", a: "Currently in Nagpur, Pune and Mumbai." },
  { q: "How am I charged?", a: "A one-time visit is paid at checkout. Plans are charged for each visit." },
  { q: "Can I choose the day?", a: "Yes. You choose your preferred date when you book." },
] as const;

function PlanCard({ option, index, scrollX, width, selected, currency, onSelect }: {
  option: Option; index: number; scrollX: SharedValue<number>; width: number; selected: boolean; currency: string; onSelect: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * (width + 14), index * (width + 14), (index + 1) * (width + 14)];
    return { transform: [{ scale: interpolate(scrollX.value, input, [0.92, 1, 0.92], "clamp") }], opacity: interpolate(scrollX.value, input, [0.7, 1, 0.7], "clamp") };
  });
  const dark = option.popular;
  const fg = dark ? colors.cream : colors.forest;
  const sub = dark ? "rgba(250,243,229,0.78)" : colors.muted;
  return (
    <Animated.View style={[{ width }, style]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${option.label}, ${money(option.price, currency)} per visit`}
        onPress={onSelect}
        style={[styles.plan, dark && styles.planDark, selected && styles.planOn]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 26 }}>
          {option.popular ? (
            <View style={styles.popular}><Text variant="small" style={{ color: colors.cream, fontSize: 10, letterSpacing: 1.5 }}>MOST POPULAR</Text></View>
          ) : <View />}
          <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={26} color={selected ? colors.clay : dark ? "rgba(250,243,229,0.5)" : colors.border} />
        </View>
        <Text variant="title" style={{ color: fg, fontSize: 22, marginTop: 6 }}>{option.label}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 10 }}>
          <Text variant="display" style={{ fontSize: 44, lineHeight: 48, color: fg }}>{money(option.price, currency)}</Text>
          <Text variant="small" style={{ color: sub }}>/ visit</Text>
        </View>
        <Text variant="small" style={{ color: sub, marginTop: 2 }}>{option.note}</Text>
        <View style={[styles.save, { opacity: option.saving ? 1 : 0 }, dark && { backgroundColor: "rgba(250,243,229,0.15)" }]}>
          <Text variant="small" style={{ color: fg, fontFamily: fonts.bodySemibold }}>{option.saving ?? "-"} per visit</Text>
        </View>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: dark ? "rgba(250,243,229,0.25)" : colors.border, marginVertical: 14 }} />
        {INCLUDED.map((item) => (
          <View key={item} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <Ionicons name="checkmark" size={16} color={dark ? colors.sage : colors.clay} style={{ marginTop: 2 }} />
            <Text variant="small" style={{ flex: 1, color: dark ? colors.cream : colors.text }}>{item}</Text>
          </View>
        ))}
      </Pressable>
    </Animated.View>
  );
}

function Question({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View layout={LinearTransition.duration(220)} style={{ paddingVertical: 14 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text variant="title" style={{ flex: 1, fontSize: 17, lineHeight: 22 }}>{q}</Text>
        <Ionicons name={open ? "remove-circle-outline" : "add-circle-outline"} size={24} color={colors.forest} />
      </Pressable>
      {open ? <Text variant="small" style={{ marginTop: 8 }}>{a}</Text> : null}
    </Animated.View>
  );
}

export default function GardenerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.round(screenWidth * 0.78);
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });
  const { add, busy, error } = useCart();
  const query = useQuery({ queryKey: ["gardener"], queryFn: fetchGardenerService, staleTime: 5 * 60 * 1000 });
  const [plan, setPlan] = useState(ONE_TIME);
  const [values, setValues] = useState({ name: "", email: "", city: "", address: "", date: "", phone: "", notes: "" });
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof values) => (value: string) => setValues((c) => ({ ...c, [key]: value }));

  const service = query.data;
  const opts = service ? options(service) : [];
  const chosen = opts.find((o) => o.value === plan) ?? opts[0];

  const submit = async () => {
    if (!service) return;
    const parsed = bookingSchema.safeParse({ ...values, notes: values.notes || undefined });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    const booking: Booking = parsed.data;
    const ok = await add(service.variantId, {
      attributes: bookingAttributes(booking),
      buyerEmail: booking.email,
      ...(plan === ONE_TIME ? {} : { sellingPlanId: plan }),
    });
    if (ok) router.navigate("/cart");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <KeyboardAwareScrollView bottomOffset={96} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <Image source={{ uri: `${SITE}/images/promo-repotting.jpg` }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LinearGradient colors={["rgba(26,44,22,0.78)", "rgba(26,44,22,0.62)", "rgba(26,44,22,0.95)"]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.cream} />
          </Pressable>
          <Text variant="eyebrow" style={{ color: colors.sage, marginTop: 18 }}>Services</Text>
          <Text variant="display" style={{ color: colors.cream, marginTop: 6 }}>Gardener services</Text>
          <Text variant="body" style={{ color: colors.cream, opacity: 0.8, marginTop: 8 }}>
            Book a Fernwood gardener for a single visit, or keep your plants looked after on a regular schedule.
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {GARDENER_CITIES.map((city) => (
              <View key={city} style={styles.cityChip}>
                <Ionicons name="location-outline" size={14} color={colors.sage} />
                <Text variant="small" style={{ color: colors.cream }}>{city}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <View key={step.title} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={22} color={colors.cream} />
              </View>
              <Text variant="small" style={{ color: colors.clay, fontFamily: fonts.bodySemibold }}>Step {index + 1}</Text>
              <Text variant="small" style={{ color: colors.forest, textAlign: "center", fontFamily: fonts.bodyMedium }}>{step.title}</Text>
            </View>
          ))}
        </View>

        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : !service ? (
          <View style={[styles.card, { margin: 20, alignItems: "center" }]}>
            <Text variant="title">Booking opens soon</Text>
            <Text variant="small" style={{ textAlign: "center", marginTop: 6 }}>
              We are getting the gardener service ready. Ask us and we will let you know as soon as you can book.
            </Text>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} style={{ padding: 20, gap: 18 }}>
            <View style={{ marginHorizontal: -20 }}>
              <Text variant="eyebrow" style={{ paddingHorizontal: 20 }}>Plans</Text>
              <Text variant="title" style={{ paddingHorizontal: 20, fontSize: 26, marginBottom: 14 }}>Pick the rhythm that suits your plants</Text>
              <Animated.FlatList
                horizontal
                data={opts}
                keyExtractor={(option) => option.value}
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 14}
                decelerationRate="fast"
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingVertical: 8 }}
                renderItem={({ item, index }) => (
                  <PlanCard option={item} index={index} scrollX={scrollX} width={cardWidth} selected={plan === item.value} currency={service.currency} onSelect={() => setPlan(item.value)} />
                )}
              />
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 6 }}>
                {opts.map((option) => (
                  <View key={option.value} style={{ width: plan === option.value ? 20 : 7, height: 7, borderRadius: 4, backgroundColor: plan === option.value ? colors.forest : colors.border }} />
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text variant="title">Where and when</Text>
              <Text variant="small" style={{ marginTop: 2 }}>Tell us where to come and which day suits you.</Text>
              <View style={{ gap: 14, marginTop: 14 }}>
                <TextField label="Full name" value={values.name} onChangeText={set("name")} autoComplete="name" error={errors["name"]} />
                <TextField label="Email" value={values.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors["email"]} hint="We send your booking confirmation here." />
                <View style={{ gap: 6 }}>
                  <Text variant="small" style={{ color: colors.text, fontFamily: fonts.bodyMedium }}>City</Text>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                    {GARDENER_CITIES.map((city) => {
                      const on = values.city === city;
                      return (
                        <Pressable key={city} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => set("city")(city)} style={[styles.pill, on && styles.pillOn]}>
                          <Text variant="small" style={{ color: on ? colors.cream : colors.forest }}>{city}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {errors["city"] ? <Text variant="small" style={{ color: colors.danger }}>{errors["city"]}</Text> : null}
                </View>
                <TextField label="Address" value={values.address} onChangeText={set("address")} multiline autoComplete="street-address" error={errors["address"]} />
                <View style={{ gap: 6 }}>
                  <Text variant="small" style={{ color: colors.text, fontFamily: fonts.bodyMedium }}>{plan === ONE_TIME ? "Preferred visit date" : "Preferred first visit date"}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Choose a date" onPress={() => setShowPicker(true)} style={styles.dateBtn}>
                    <Ionicons name="calendar-outline" size={20} color={colors.forest} />
                    <Text variant="body" style={{ color: values.date ? colors.text : colors.muted }}>{values.date || "Choose a date"}</Text>
                  </Pressable>
                  {errors["date"] ? <Text variant="small" style={{ color: colors.danger }}>{errors["date"]}</Text> : null}
                  {showPicker ? (
                    <DateTimePicker
                      value={values.date ? new Date(`${values.date}T12:00:00`) : new Date()}
                      mode="date"
                      minimumDate={new Date()}
                      onChange={(_, picked) => {
                        setShowPicker(Platform.OS === "ios");
                        if (picked) set("date")(isoDate(picked));
                      }}
                    />
                  ) : null}
                </View>
                <TextField label="Phone" value={values.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" error={errors["phone"]} hint="So the gardener can reach you about the visit." />
                <TextField label="Notes (optional)" value={values.notes} onChangeText={set("notes")} multiline style={{ minHeight: 90, paddingTop: 12 }} error={errors["notes"]} />
              </View>
            </View>

            <View style={styles.summary}>
              <Text variant="eyebrow" style={{ color: colors.sage }}>Your plan</Text>
              <Text variant="title" style={{ color: colors.cream, marginTop: 4 }}>{chosen?.label}</Text>
              <Text variant="small" style={{ color: colors.cream, opacity: 0.8 }}>
                {chosen ? `${money(chosen.price, service.currency)} per visit · ${chosen.note}` : ""}
              </Text>
              <Text variant="small" style={{ color: colors.cream, opacity: 0.65, marginTop: 8 }}>You pay at checkout. Nothing is charged until you complete it.</Text>
            </View>
            {error ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}

            <View style={styles.card}>
              <Text variant="title">Good to know</Text>
              {QUESTIONS.map((item, index) => (
                <View key={item.q} style={index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } : undefined}>
                  <Question q={item.q} a={item.a} />
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </KeyboardAwareScrollView>
      {service && chosen ? (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={{ flex: 1 }}>
            <Text variant="small" numberOfLines={1}>{chosen.label}</Text>
            <Text variant="title" style={{ fontSize: 22 }}>{money(chosen.price, service.currency)} <Text variant="small">/ visit</Text></Text>
          </View>
          <View style={{ flex: 1.2 }}>
            <Button label="Book now" loading={busy} onPress={() => void submit()} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forestDeep, padding: 24, paddingBottom: 36, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden" },
  cityChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(250,243,229,0.12)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 20, ...shadow.card },
  plan: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 20, borderWidth: 2, borderColor: "transparent", minHeight: 400, ...shadow.card },
  planDark: { backgroundColor: colors.forest },
  planOn: { borderColor: colors.clay },
  popular: { alignSelf: "flex-start", backgroundColor: colors.clay, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  save: { alignSelf: "flex-start", backgroundColor: colors.sageLight, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card },
  pillOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16 },
  steps: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 22 },
  stepIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center", ...shadow.card },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, ...shadow.card },
  summary: { backgroundColor: colors.forestDeep, borderRadius: radius.xl, padding: 20 },
});

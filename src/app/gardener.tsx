import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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

export default function GardenerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
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
            <Text variant="title">Choose your plan</Text>
            <View style={{ gap: 14 }}>
              {opts.map((option) => {
                const selected = plan === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setPlan(option.value)}
                    style={[styles.plan, option.popular && styles.planDark, selected && styles.planOn]}
                  >
                    {option.popular ? (
                      <View style={styles.popular}><Text variant="small" style={{ color: colors.cream, fontSize: 10, letterSpacing: 1.5 }}>MOST POPULAR</Text></View>
                    ) : null}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text variant="title" style={{ fontSize: 20, color: option.popular ? colors.cream : colors.forest }}>{option.label}</Text>
                      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={24} color={selected ? colors.clay : option.popular ? colors.cream : colors.border} />
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                      <Text variant="display" style={{ fontSize: 36, lineHeight: 40, color: option.popular ? colors.cream : colors.forest }}>{money(option.price, service.currency)}</Text>
                      <Text variant="small" style={{ color: option.popular ? colors.cream : colors.muted, opacity: 0.8 }}>/ visit</Text>
                    </View>
                    <Text variant="small" style={{ color: option.popular ? colors.cream : colors.muted, opacity: 0.85, marginTop: 4 }}>{option.note}</Text>
                    {option.saving ? (
                      <View style={[styles.save, option.popular && { backgroundColor: "rgba(250,243,229,0.15)" }]}>
                        <Text variant="small" style={{ color: option.popular ? colors.cream : colors.forest, fontFamily: fonts.bodySemibold }}>{option.saving} per visit</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
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
            <Button label="Add booking to cart" loading={busy} onPress={() => void submit()} />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.forestDeep, padding: 24, paddingBottom: 32, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  cityChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(250,243,229,0.12)", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 20, ...shadow.card },
  plan: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 20, borderWidth: 2, borderColor: "transparent", ...shadow.card },
  planDark: { backgroundColor: colors.forest },
  planOn: { borderColor: colors.clay },
  popular: { alignSelf: "flex-start", backgroundColor: colors.clay, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  save: { alignSelf: "flex-start", backgroundColor: colors.sageLight, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card },
  pillOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  dateBtn: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16 },
  summary: { backgroundColor: colors.forestDeep, borderRadius: radius.xl, padding: 20 },
});

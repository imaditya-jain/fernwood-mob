import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import type { useGiftForm } from "@/features/gifts/useGiftForm";
import { FRESH_DELIVERY } from "@/lib/gift";
import { colors, fonts, radius, shadow } from "@/theme/tokens";

const MESSAGE_MAX = 300;

/** Delivery details (bouquets only, Nagpur) and the personal message, as one card on the product screen. */
export function GiftFields({ form, bouquet }: { form: ReturnType<typeof useGiftForm>; bouquet: boolean }) {
  const { values, set, errors, dates } = form;
  return (
    <View style={styles.card}>
      {bouquet ? (
        <>
          <View style={styles.note}>
            <Ionicons name="bicycle-outline" size={20} color={colors.forest} />
            <Text variant="small" style={{ flex: 1, color: colors.forest }}>
              Fresh flowers are delivered within {FRESH_DELIVERY.city}, on the day you choose.
            </Text>
          </View>
          <TextField label="Who is it for?" value={values.recipient} onChangeText={set("recipient")} error={errors["recipient"]} autoComplete="off" />
          <TextField label={`Delivery address in ${FRESH_DELIVERY.city}`} value={values.address} onChangeText={set("address")} multiline style={{ minHeight: 84, paddingTop: 12 }} error={errors["address"]} />
          <TextField label="Phone number for the delivery" value={values.phone} onChangeText={set("phone")} keyboardType="phone-pad" error={errors["phone"]} hint="The delivery person may call to find the address." />
          <View style={{ gap: 6 }}>
            <Text variant="small" style={{ color: colors.text, fontFamily: fonts.bodyMedium }}>Delivery date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
              {dates.map((option) => {
                const on = values.date === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${option.day} ${option.date}`}
                    onPress={() => set("date")(option.value)}
                    style={[styles.date, on && styles.dateOn]}
                  >
                    <Text variant="small" style={{ color: on ? colors.cream : colors.muted }}>{option.day}</Text>
                    <Text variant="body" style={{ fontFamily: fonts.bodySemibold, color: on ? colors.cream : colors.forest }}>{option.date}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {errors["date"] ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>{errors["date"]}</Text> : null}
          </View>
        </>
      ) : null}
      <TextField
        label="Your message (optional)"
        value={values.message}
        onChangeText={set("message")}
        multiline
        maxLength={MESSAGE_MAX}
        placeholder="Write something they will keep…"
        style={{ minHeight: 96, paddingTop: 12 }}
        error={errors["message"]}
        hint={`${values.message.length}/${MESSAGE_MAX}`}
      />
      <TextField label="From (name on the card, optional)" value={values.from} onChangeText={set("from")} maxLength={80} error={errors["from"]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14, backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, marginTop: 20, ...shadow.card },
  note: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: colors.sageLight, borderRadius: radius.md, padding: 12 },
  date: { alignItems: "center", minWidth: 64, paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  dateOn: { backgroundColor: colors.forest, borderColor: colors.forest },
});

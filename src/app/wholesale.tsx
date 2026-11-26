import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { z } from "zod";

import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { ApiError, publicRequest } from "@/lib/api";
import { colors, radius } from "@/theme/tokens";

const BUSINESS_TYPES = [
  "Café or restaurant",
  "Florist",
  "Garden centre or retailer",
  "Interior designer or office",
  "Hotel or events",
  "Other",
] as const;

const noControl = (value: string) => [...value].every((c) => c.charCodeAt(0) > 31 && c !== "\u007f");
const line = (max: number) => z.string().trim().min(1, "This field is required").max(max, `Keep this under ${max} characters`).refine(noControl, "Remove special characters");

/** Same rules as the website's wholesale form; the server checks them again. */
const schema = z.object({
  businessName: line(120),
  contactName: line(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254)),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a phone number we can reach you on"),
  businessType: z.enum(BUSINESS_TYPES, { message: "Choose a business type" }),
  location: line(120),
  taxId: z.string().trim().max(40, "Keep this under 40 characters").refine(noControl, "Remove special characters"),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(3000, "Keep your message under 3,000 characters"),
});

export default function WholesaleScreen() {
  const router = useRouter();
  const [values, setValues] = useState({ businessName: "", contactName: "", email: "", phone: "", businessType: "", location: "", taxId: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (key: keyof typeof values) => (value: string) => setValues((c) => ({ ...c, [key]: value }));

  const submit = async () => {
    setFailure(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      return setErrors(next);
    }
    setErrors({});
    setBusy(true);
    try {
      await publicRequest("/api/wholesale", "POST", { ...parsed.data, website: "" });
      setSent(true);
    } catch (caught) {
      setFailure(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame eyebrow="Wholesale" title="Trade accounts" intro="Cafés, florists, designers and retailers: tell us about your business and we will be in touch.">
      {sent ? (
        <View style={{ gap: 12 }}>
          <Text variant="title" accessibilityRole="alert">Thank you, we have your application</Text>
          <Text variant="body" style={{ color: colors.muted }}>
            We will review it and reply by email. Wholesale pricing is set up on your account by our team, so you will not see it in the app.
          </Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      ) : (
        <>
          <TextField label="Business name" value={values.businessName} onChangeText={set("businessName")} error={errors["businessName"]} />
          <TextField label="Your name" value={values.contactName} onChangeText={set("contactName")} autoComplete="name" error={errors["contactName"]} />
          <TextField label="Email" value={values.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors["email"]} />
          <TextField label="Phone" value={values.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" error={errors["phone"]} />
          <View style={{ gap: 6 }}>
            <Text variant="small" style={{ color: colors.text }}>Type of business</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {BUSINESS_TYPES.map((type) => {
                const on = values.businessType === type;
                return (
                  <Pressable
                    key={type}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    onPress={() => set("businessType")(type)}
                    style={{ borderWidth: 1, borderColor: on ? colors.forest : colors.border, backgroundColor: on ? colors.forest : colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 }}
                  >
                    <Text variant="small" style={{ color: on ? colors.cream : colors.forest }}>{type}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors["businessType"] ? <Text variant="small" style={{ color: colors.danger }}>{errors["businessType"]}</Text> : null}
          </View>
          <TextField label="Location (city, country)" value={values.location} onChangeText={set("location")} error={errors["location"]} />
          <TextField label="Tax or business registration number (optional)" value={values.taxId} onChangeText={set("taxId")} autoCapitalize="characters" error={errors["taxId"]} />
          <TextField label="Tell us what you need" value={values.message} onChangeText={set("message")} multiline style={{ minHeight: 120, paddingTop: 12 }} error={errors["message"]} />
          {failure ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>{failure}</Text> : null}
          <Button label="Send application" loading={busy} onPress={() => void submit()} />
        </>
      )}
    </AuthFrame>
  );
}

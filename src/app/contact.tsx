import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { z } from "zod";

import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, publicRequest } from "@/lib/api";
import { colors, radius } from "@/theme/tokens";

const TOPICS = ["Order or delivery", "Plant care advice", "Returns or guarantee", "Wholesale", "Careers", "Press and partnerships", "Something else"] as const;
const noControl = (value: string) => [...value].every((c) => c.charCodeAt(0) > 31 && c !== "\u007f");

const schema = z.object({
  name: z.string().trim().min(1, "This field is required").max(80, "Keep this under 80 characters").refine(noControl, "Remove special characters"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254)),
  topic: z.enum(TOPICS, { message: "Choose a topic" }),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(3000, "Keep your message under 3,000 characters"),
});

export default function ContactScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [values, setValues] = useState({ name: user ? `${user.firstName} ${user.lastName}` : "", email: user?.email ?? "", topic: "", message: "" });
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
      await publicRequest("/api/contact", "POST", { ...parsed.data, website: "" });
      setSent(true);
    } catch (caught) {
      setFailure(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame eyebrow="We're here to help" title="Contact us" intro="Questions about an order, a plant or anything else? Send us a note.">
      {sent ? (
        <View style={{ gap: 12 }}>
          <Text variant="title" accessibilityRole="alert">Thank you, we have your message</Text>
          <Text variant="body" style={{ color: colors.muted }}>We will reply by email.</Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      ) : (
        <>
          <TextField label="Your name" value={values.name} onChangeText={set("name")} autoComplete="name" error={errors["name"]} />
          <TextField label="Email" value={values.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors["email"]} />
          <View style={{ gap: 6 }}>
            <Text variant="small" style={{ color: colors.text }}>Topic</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TOPICS.map((topic) => {
                const on = values.topic === topic;
                return (
                  <Pressable key={topic} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => set("topic")(topic)} style={{ borderWidth: 1, borderColor: on ? colors.forest : colors.border, backgroundColor: on ? colors.forest : colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 }}>
                    <Text variant="small" style={{ color: on ? colors.cream : colors.forest }}>{topic}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors["topic"] ? <Text variant="small" style={{ color: colors.danger }}>{errors["topic"]}</Text> : null}
          </View>
          <TextField label="Message" value={values.message} onChangeText={set("message")} multiline style={{ minHeight: 130, paddingTop: 12 }} error={errors["message"]} />
          {failure ? <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>{failure}</Text> : null}
          <Button label="Send message" loading={busy} onPress={() => void submit()} />
        </>
      )}
    </AuthFrame>
  );
}

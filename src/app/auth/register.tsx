import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { colors } from "@/theme/tokens";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setFailure(null);
    const next: Record<string, string> = {};
    if (!values.firstName.trim()) next["firstName"] = "Required";
    if (!values.lastName.trim()) next["lastName"] = "Required";
    if (!values.email.includes("@")) next["email"] = "Enter a valid email address";
    if (values.password.length < 10) next["password"] = "Use at least 10 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      await register({ ...values, email: values.email.trim().toLowerCase(), acceptsMarketing: marketing });
      router.dismissAll();
      router.replace("/account");
    } catch (caught) {
      setFailure(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame eyebrow="Join Fernwood" title="Create account" intro="Save plants, follow orders and check out faster.">
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="First name" value={values.firstName} onChangeText={set("firstName")} autoComplete="given-name" error={errors["firstName"]} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Last name" value={values.lastName} onChangeText={set("lastName")} autoComplete="family-name" error={errors["lastName"]} />
        </View>
      </View>
      <TextField label="Email" value={values.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors["email"]} />
      <TextField label="Password" value={values.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" error={errors["password"]} hint="At least 10 characters." />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marketing }}
        onPress={() => setMarketing((value) => !value)}
        style={{ flexDirection: "row", gap: 10, alignItems: "center", minHeight: 44 }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.forest, backgroundColor: marketing ? colors.forest : "transparent" }} />
        <Text variant="small" style={{ flex: 1 }}>
          Send me care tips and early access to new arrivals.
        </Text>
      </Pressable>
      {failure ? (
        <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>
          {failure}
        </Text>
      ) : null}
      <Button label="Create account" onPress={() => void submit()} loading={busy} />
    </AuthFrame>
  );
}

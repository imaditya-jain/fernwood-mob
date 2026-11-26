import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { colors } from "@/theme/tokens";

export default function LoginScreen() {
  const { startLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.includes("@") || !password) return setError("Enter your email and password.");
    setBusy(true);
    try {
      const challenge = await startLogin(email.trim().toLowerCase(), password);
      router.push({ pathname: "/auth/verify", params: { ref: challenge.ref, email: email.trim().toLowerCase(), resendAfter: String(challenge.resendAfter) } });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame eyebrow="Welcome back" title="Sign in" intro="We will email you a code to finish signing in.">
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={() => void submit()} />
      {error ? (
        <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
      <Button label="Continue" onPress={() => void submit()} loading={busy} />
      <View style={{ alignItems: "center", gap: 10, marginTop: 4 }}>
        <Link href="/auth/forgot-password">
          <Text variant="small" style={{ color: colors.forest, textDecorationLine: "underline" }}>
            Forgot your password?
          </Text>
        </Link>
        <Link href="/auth/register">
          <Text variant="small">
            New to Fernwood? <Text variant="small" style={{ color: colors.forest, textDecorationLine: "underline" }}>Create an account</Text>
          </Text>
        </Link>
      </View>
    </AuthFrame>
  );
}

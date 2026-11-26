import { useState } from "react";

import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { ApiError, publicRequest } from "@/lib/api";
import { colors } from "@/theme/tokens";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.includes("@")) return setError("Enter a valid email address.");
    setBusy(true);
    try {
      await publicRequest("/api/auth/forgot-password", "POST", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame eyebrow="Account help" title="Reset password" intro="We will email you a link to choose a new one.">
      {sent ? (
        <Text variant="body" accessibilityRole="alert" style={{ color: colors.forest }}>
          If that email has an account, a reset link is on its way. The link opens in your browser; afterwards come back here and sign in.
        </Text>
      ) : (
        <>
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          {error ? (
            <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Text>
          ) : null}
          <Button label="Send reset link" onPress={() => void submit()} loading={busy} />
        </>
      )}
    </AuthFrame>
  );
}

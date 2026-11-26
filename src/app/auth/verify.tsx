import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { AuthFrame } from "@/components/AuthFrame";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { colors } from "@/theme/tokens";

export default function VerifyScreen() {
  const { ref: initialRef, email, resendAfter } = useLocalSearchParams<{ ref: string; email: string; resendAfter: string }>();
  const { verifyCode, resendCode } = useAuth();
  const router = useRouter();
  const [ref, setRef] = useState(initialRef);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(Number(resendAfter) || 0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const submit = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code.");
    setBusy(true);
    try {
      await verifyCode(ref, code.trim());
      router.dismissAll();
      router.replace("/account");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const next = await resendCode(ref);
      setRef(next.ref);
      setWait(next.resendAfter);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Couldn't send a new code.");
    }
  };

  return (
    <AuthFrame eyebrow="Check your email" title="Enter your code" intro={`We sent a 6-digit code to ${email ?? "your email"}.`}>
      <TextField
        label="6-digit code"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        onSubmitEditing={() => void submit()}
        style={{ letterSpacing: 8, fontSize: 22, textAlign: "center" }}
      />
      {error ? (
        <Text variant="small" accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}
      <Button label="Sign in" onPress={() => void submit()} loading={busy} />
      <Button label={wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"} variant="outline" disabled={wait > 0} onPress={() => void resend()} />
    </AuthFrame>
  );
}

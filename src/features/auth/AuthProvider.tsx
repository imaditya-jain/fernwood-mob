import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { unregisterPush } from "@/features/push/state";
import {
  apiRequest,
  bindSignedOut,
  clearRefreshToken,
  publicRequest,
  readRefreshToken,
  refreshAccessToken,
  saveRefreshToken,
  setAccessToken,
} from "@/lib/api";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptsMarketing: boolean;
  emailVerified: boolean;
};

export type Challenge = { ref: string; expiresIn: number; resendAfter: number };
type Session = { user: User; accessToken: string; refreshToken: string };

type AuthState = {
  status: "loading" | "anonymous" | "authenticated";
  user: User | null;
  /** Step 1 of sign-in: password. Emails a code. */
  startLogin: (email: string, password: string) => Promise<Challenge>;
  resendCode: (ref: string) => Promise<Challenge>;
  /** Step 2: the emailed code. Opens the session. */
  verifyCode: (ref: string, code: string) => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName: string; acceptsMarketing: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<User | null>(null);

  const adopt = useCallback(async (session: Session) => {
    setAccessToken(session.accessToken);
    await saveRefreshToken(session.refreshToken);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const drop = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    bindSignedOut(drop);
    let cancelled = false;
    (async () => {
      const token = await readRefreshToken().catch(() => null);
      if (!token) return cancelled ? undefined : setStatus("anonymous");
      if (!(await refreshAccessToken())) {
        // Offline at start-up keeps the token for the next try; a rejected token was already cleared.
        return cancelled ? undefined : setStatus("anonymous");
      }
      try {
        const { user: me } = await apiRequest<{ user: User }>("/api/me");
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drop]);

  const startLogin = useCallback(
    (email: string, password: string) =>
      publicRequest<Challenge>("/api/auth/login", "POST", { email, password }),
    [],
  );
  const resendCode = useCallback(
    (ref: string) => publicRequest<Challenge>("/api/auth/otp/resend", "POST", { challenge: ref }),
    [],
  );
  const verifyCode = useCallback(
    async (ref: string, code: string) => {
      await adopt(await publicRequest<Session>("/api/mobile/auth/verify", "POST", { challenge: ref, code }));
    },
    [adopt],
  );
  const register = useCallback<AuthState["register"]>(
    async (input) => {
      await adopt(await publicRequest<Session>("/api/mobile/auth/register", "POST", input));
    },
    [adopt],
  );

  const logout = useCallback(async () => {
    await unregisterPush();
    const token = await readRefreshToken().catch(() => null);
    if (token) await publicRequest("/api/mobile/auth/logout", "POST", { refreshToken: token }).catch(() => undefined);
    await clearRefreshToken().catch(() => undefined);
    drop();
  }, [drop]);

  const logoutEverywhere = useCallback(async () => {
    await unregisterPush();
    await apiRequest("/api/auth/logout-all", { method: "POST" }).catch(() => undefined);
    await clearRefreshToken().catch(() => undefined);
    drop();
  }, [drop]);

  const reloadUser = useCallback(async () => {
    const { user: me } = await apiRequest<{ user: User }>("/api/me");
    setUser(me);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, user, startLogin, resendCode, verifyCode, register, logout, logoutEverywhere, reloadUser }),
    [status, user, startLogin, resendCode, verifyCode, register, logout, logoutEverywhere, reloadUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

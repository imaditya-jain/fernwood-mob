import { apiRequest } from "@/lib/api";

/** The push token this phone registered, kept in memory so sign-out can unregister exactly that phone. */
let registeredToken: string | null = null;

export const setRegisteredToken = (token: string | null) => {
  registeredToken = token;
};

/** Stops order pushes to this phone. Call while the session is still valid; failures are ignored. */
export async function unregisterPush(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;
  await apiRequest("/api/mobile/push", { method: "DELETE", json: { token } }).catch(() => undefined);
}

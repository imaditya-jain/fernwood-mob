import * as SecureStore from "expo-secure-store";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "";
const REFRESH_KEY = "fw_refresh_token";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Envelope<T> = { data?: T; error?: { code: string; message: string } };

/** Session state lives here (memory) so the API client works outside React. */
let accessToken: string | null = null;
let onSignedOut: (() => void) | null = null;
let inflightRefresh: Promise<boolean> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const bindSignedOut = (handler: () => void) => {
  onSignedOut = handler;
};

export const saveRefreshToken = (token: string) => SecureStore.setItemAsync(REFRESH_KEY, token);
export const readRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);
export const clearRefreshToken = () => SecureStore.deleteItemAsync(REFRESH_KEY);

/** Every request says it comes from the app; the server accepts that in place of a browser Origin. */
const baseHeaders = { "Content-Type": "application/json", "X-Fernwood-Client": "app" } as const;

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  // 202/204 answers carry no body: success without data.
  if (response.ok && text === "") return undefined as T;
  let body: Envelope<T> | null = null;
  try {
    body = JSON.parse(text) as Envelope<T>;
  } catch {
    body = null;
  }
  if (!response.ok || !body || body.data === undefined) {
    const retry = Number(response.headers.get("retry-after")) || undefined;
    throw new ApiError(
      response.status,
      body?.error?.code ?? "request_failed",
      body?.error?.message ?? "Something went wrong. Please try again.",
      retry,
    );
  }
  return body.data;
}

/** Calls that need no session (sign-in steps, forgot password). */
export async function publicRequest<T>(path: string, method: "GET" | "POST", json?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: baseHeaders,
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    });
  } catch {
    throw new ApiError(0, "network_error", "Network problem. Check your connection and try again.");
  }
  return parse<T>(response);
}

/** Exchanges the stored refresh token for a new access token (single flight, so parallel calls share one). */
export function refreshAccessToken(): Promise<boolean> {
  inflightRefresh ??= (async () => {
    try {
      const token = await readRefreshToken();
      if (!token) return false;
      const result = await publicRequest<{ accessToken: string; refreshToken?: string }>(
        "/api/mobile/auth/refresh",
        "POST",
        { refreshToken: token },
      );
      accessToken = result.accessToken;
      if (result.refreshToken) await saveRefreshToken(result.refreshToken);
      return true;
    } catch (error) {
      // Only a rejected token ends the session; a dropped connection must not sign anyone out.
      if (error instanceof ApiError && error.status === 401) {
        accessToken = null;
        await clearRefreshToken();
        onSignedOut?.();
      }
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

/** Authenticated call: Bearer on every request; on 401 refresh once and retry. */
export async function apiRequest<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; json?: unknown } = {},
): Promise<T> {
  const send = async () => {
    try {
      return await fetch(`${BASE}${path}`, {
        method: options.method ?? "GET",
        headers: { ...baseHeaders, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        ...(options.json !== undefined ? { body: JSON.stringify(options.json) } : {}),
      });
    } catch {
      throw new ApiError(0, "network_error", "Network problem. Check your connection and try again.");
    }
  };
  if (!accessToken && !(await refreshAccessToken())) {
    throw new ApiError(401, "unauthorized", "Please sign in.");
  }
  let response = await send();
  if (response.status === 401 && (await refreshAccessToken())) response = await send();
  return parse<T>(response);
}

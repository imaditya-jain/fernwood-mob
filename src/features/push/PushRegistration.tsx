import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/features/auth/AuthProvider";
import { apiRequest } from "@/lib/api";
import { setRegisteredToken } from "@/features/push/state";
import { colors } from "@/theme/tokens";

/** Show a banner while the app is open too, without sound or a badge. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const projectId = (): string | undefined =>
  (Constants.expoConfig?.extra?.["eas"] as { projectId?: string } | undefined)?.projectId ??
  Constants.easConfig?.projectId;

/** Asks for permission and returns this phone's Expo push token, or null if push is not available here. */
async function getPushToken(): Promise<string | null> {
  const id = projectId();
  // Push needs a real device and an Expo project id (set up once with EAS); without either there is nothing to do.
  if (!Device.isDevice || !id) return null;
  if (Platform.OS === "android") {
    // Must exist before the permission prompt on Android 13+.
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Order updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: colors.forest,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.status === "granted" || (await Notifications.requestPermissionsAsync()).status === "granted";
  if (!granted) return null;
  return (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
}

/**
 * While someone is signed in, registers this phone for order-update pushes; unregisters it on sign-out.
 * Tapping a notification opens the order it is about. Renders nothing.
 */
export function PushRegistration() {
  const { status, user } = useAuth();
  const router = useRouter();
  const registered = useRef<{ token: string; userId: string } | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (status === "authenticated" && userId) {
      if (registered.current?.userId === userId) return;
      let cancelled = false;
      (async () => {
        try {
          const token = await getPushToken();
          if (!token || cancelled) return;
          await apiRequest("/api/mobile/push", { method: "POST", json: { token, platform: Platform.OS === "ios" ? "ios" : "android" } });
          registered.current = { token, userId };
          setRegisteredToken(token);
        } catch {
          // Push is a convenience; the in-app order updates screen still works without it.
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [status, userId]);

  useEffect(() => {
    if (status === "anonymous") registered.current = null;
  }, [status]);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const link = response?.notification.request.content.data?.["link"];
      const id = typeof link === "string" ? link.split("/").pop() : undefined;
      if (id && /^\d+$/.test(id)) router.push({ pathname: "/orders/[id]", params: { id } });
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (last) {
        open(last);
        void Notifications.clearLastNotificationResponseAsync();
      }
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}

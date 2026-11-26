import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/AuthProvider";
import { apiRequest } from "@/lib/api";

export type NotificationItem = { id: string; kind: string; title: string; body: string; link: string; createdAt: string; read: boolean };
export type NotificationsData = { unreadCount: number; items: NotificationItem[] };

/** Same query the Order updates screen uses, so the count on the Account tab and the list stay in step. */
export const useNotifications = () => {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<NotificationsData>("/api/notifications?limit=20"),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
  });
};

export const useUnreadCount = () => useNotifications().data?.unreadCount ?? 0;

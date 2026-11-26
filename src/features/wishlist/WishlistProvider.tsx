import * as Haptics from "expo-haptics";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { apiRequest } from "@/lib/api";

type WishlistState = {
  handles: string[];
  has: (handle: string) => boolean;
  /** Saves or removes a plant. Returns false when the visitor must sign in first. */
  toggle: (handle: string) => Promise<boolean>;
};

const WishlistContext = createContext<WishlistState | null>(null);

export function useWishlist(): WishlistState {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}

type HandlesResponse = { handles: string[] };

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const [handles, setHandles] = useState<string[]>([]);
  const ref = useRef<string[]>([]);
  ref.current = handles;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (status === "anonymous") {
      setHandles([]);
      return;
    }
    if (status !== "authenticated") return;
    let cancelled = false;
    apiRequest<HandlesResponse>("/api/wishlist")
      .then((result) => {
        if (!cancelled) setHandles(result.handles);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  const toggle = useCallback(
    async (handle: string) => {
      if (status !== "authenticated") return false;
      const before = ref.current;
      const saved = before.includes(handle);
      setHandles(saved ? before.filter((h) => h !== handle) : [handle, ...before]);
      void Haptics.selectionAsync();
      try {
        const next = await apiRequest<HandlesResponse>("/api/wishlist/items", {
          method: saved ? "DELETE" : "POST",
          json: { handle },
        });
        setHandles(next.handles);
      } catch {
        setHandles(before);
      }
      return true;
    },
    [status],
  );

  const value = useMemo<WishlistState>(
    () => ({ handles, has: (handle) => handles.includes(handle), toggle }),
    [handles, toggle],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

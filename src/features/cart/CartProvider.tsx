import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { type Cart, MAX_CART_LINES } from "@/lib/cart";
import { useAuth } from "@/features/auth/AuthProvider";
import { addLine, CartError, createCart, type LineExtras, setBuyerEmail, fetchCart, removeLine, setLineQuantity } from "@/lib/shopify/cart";

const KEY = "fw_cart_id";

type CartState = {
  cart: Cart | null;
  /** True while a change is in flight; buttons disable themselves. */
  busy: boolean;
  /** Plain message for the last failure, cleared by the next action. */
  error: string | null;
  add: (variantId: string, extras?: LineExtras) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
  clearError: () => void;
};

const CartContext = createContext<CartState | null>(null);

export function useCart(): CartState {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

const messageOf = (error: unknown) =>
  error instanceof CartError && !error.gone
    ? error.message
    : "We couldn't reach the shop. Check your connection and try again.";

/**
 * The shopper's Shopify cart. Only the cart id is stored (in secure storage); everything else is read from
 * Shopify, so prices and stock are always current. A cart that has expired or been ordered is dropped.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartRef = useRef<Cart | null>(null);
  cartRef.current = cart;
  const { status, user } = useAuth();
  // One attempt per cart + account, so a failing request can never turn into a retry loop.
  const linkAttempt = useRef<string | null>(null);

  const adopt = useCallback(async (next: Cart | null) => {
    setCart(next);
    try {
      if (next) await SecureStore.setItemAsync(KEY, next.id);
      else await SecureStore.deleteItemAsync(KEY);
    } catch {
      // The cart still works for this session; it just will not be remembered after a restart.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await SecureStore.getItemAsync(KEY);
        if (!id) return;
        const loaded = await fetchCart(id);
        if (cancelled) return;
        if (loaded && loaded.totalQuantity >= 0) setCart(loaded);
        else await SecureStore.deleteItemAsync(KEY);
      } catch {
        // Offline at start-up: no cart is shown until the next successful action.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cart || busy) return;
    const key = `${status}:${user?.id ?? ""}:${cart.id}`;
    if (linkAttempt.current === key) return;
    if (status === "authenticated" && user) {
      linkAttempt.current = key;
      setBuyerEmail(cart.id, user.email).then(setCart).catch(() => undefined);
    } else if (status === "anonymous" && linkAttempt.current?.startsWith("authenticated:")) {
      // Signing out: stop pre-filling checkout with the previous account's email.
      linkAttempt.current = key;
      setBuyerEmail(cart.id, null).then(setCart).catch(() => undefined);
    }
  }, [cart, busy, status, user]);

  const run = useCallback(
    async (action: (current: Cart | null) => Promise<Cart | null>, retryWithoutCart?: () => Promise<Cart>) => {
      setBusy(true);
      setError(null);
      try {
        await adopt(await action(cartRef.current));
        return true;
      } catch (caught) {
        if (caught instanceof CartError && caught.gone && retryWithoutCart) {
          try {
            await adopt(await retryWithoutCart());
            return true;
          } catch (second) {
            setError(messageOf(second));
          }
        } else {
          setError(messageOf(caught));
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [adopt],
  );

  const add = useCallback(
    async (variantId: string, extras?: LineExtras) => {
      if ((cartRef.current?.lines.length ?? 0) >= MAX_CART_LINES) {
        setError("Your cart is full. Check out first, then add more.");
        return false;
      }
      const ok = await run(
        (current) => (current ? addLine(current.id, variantId, 1, extras) : createCart(variantId, 1, extras)),
        () => createCart(variantId, 1, extras),
      );
      if (ok) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return ok;
    },
    [run],
  );

  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      await run(async (current) => (current ? setLineQuantity(current.id, lineId, quantity) : null));
    },
    [run],
  );

  const remove = useCallback(
    async (lineId: string) => {
      await run(async (current) => {
        if (!current) return null;
        const next = await removeLine(current.id, lineId);
        return next.lines.length === 0 ? null : next;
      });
    },
    [run],
  );

  const value = useMemo<CartState>(
    () => ({ cart, busy, error, add, setQuantity, remove, clearError: () => setError(null) }),
    [cart, busy, error, add, setQuantity, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

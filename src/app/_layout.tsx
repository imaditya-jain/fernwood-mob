import {
  Fraunces_400Regular,
  Fraunces_500Medium,
} from "@expo-google-fonts/fraunces";
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from "@expo-google-fonts/work-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { IntroGate } from "@/features/intro/IntroGate";
import { prefetchStorefront } from "@/lib/shopify/prefetch";
import { PushRegistration } from "@/features/push/PushRegistration";
import { CartProvider } from "@/features/cart/CartProvider";
import { WishlistProvider } from "@/features/wishlist/WishlistProvider";
import { colors } from "@/theme/tokens";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  const [introDone, setIntroDone] = useState(false);
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    // The launch screen stays up until the welcome itself is on screen, so the home page is never seen first.
    if (introReady) {
      void SplashScreen.hideAsync();
      return undefined;
    }
    // Safety net: never leave the launch screen up if the welcome could not start.
    const timer = setTimeout(() => void SplashScreen.hideAsync(), 6000);
    return () => clearTimeout(timer);
  }, [introReady]);

  // The welcome plays while the shop loads, so the home screen is ready the moment the doors open.
  useEffect(() => {
    void prefetchStorefront(queryClient);
  }, []);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <WishlistProvider>
      <CartProvider>
      <PushRegistration />
      <StatusBar style="dark" />
      <View
        style={{ flex: 1 }}
        accessibilityElementsHidden={!introDone}
        importantForAccessibility={introDone ? "auto" : "no-hide-descendants"}
      >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[handle]" />
        <Stack.Screen name="plant-finder" />
        <Stack.Screen name="gardener" />
        <Stack.Screen name="wholesale" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="orders/index" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="auth/login" options={{ presentation: "modal" }} />
        <Stack.Screen name="auth/verify" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />
      </Stack>
      </View>
      </CartProvider>
      </WishlistProvider>
      </AuthProvider>
      {introDone ? null : <IntroGate onReady={() => setIntroReady(true)} onDone={() => setIntroDone(true)} />}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

# Fernwood mobile app

Expo (SDK 58) + Expo Router + TypeScript. Separate repository from the storefront (`token-session-visuals`).
Same brand as the website: forest / cream / clay colours (`src/theme/tokens.ts`), Fraunces for display, Work Sans for body.

## Run
```bash
npm install
npx expo start        # then press a (Android) / i (iOS) or scan with Expo Go
npm run typecheck
```
Use `npx expo install <pkg>` (never `npm i`) so versions match the SDK.

## Structure
- `src/app` Expo Router screens (`(tabs)`: Home, Shop, Wishlist, Account)
- `src/components` shared UI (`Text`, `Button` with spring press + haptics)
- `src/theme/tokens.ts` colours, radius, spacing, font names

## Backend (the storefront's API)
`EXPO_PUBLIC_API_URL` (see `.env.example`). The app needs these from the storefront, none built yet:
1. Mobile sign-in: the website keeps its refresh token in an httpOnly cookie scoped to `/api/auth`, which an app cannot use. The app needs the same flow with the refresh token returned in the response body and stored in `expo-secure-store`.
2. Catalogue reads for the app (the website reads Shopify on the server by design and exposes no public product API).
3. Wishlist, orders and cart already exist as authenticated endpoints.

## Push notifications (order updates)
The app registers this phone's Expo push token after sign-in (`src/features/push`) and the website sends a push when an order is placed, paid, shipped or cancelled.
One-time setup (cannot be done from code):
1. `npx eas-cli login`, then `npx eas-cli init` in this folder. It writes `extra.eas.projectId` into `app.json`; without it the app skips push registration silently.
2. Remote push does not work in Expo Go on Android (SDK 53+). Use a development build: `npx eas-cli build --profile development --platform android`.
3. Add Firebase (FCM v1) credentials for Android and an Apple push key for iOS in the Expo dashboard (`eas credentials`).
4. On the website's host set `EXPO_ACCESS_TOKEN` and turn on "enhanced security" for push in the Expo dashboard, so only the website can send to your customers' phones.

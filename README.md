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

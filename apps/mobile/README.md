# Mobile app (Expo) scaffold

This is a lightweight Expo scaffold for the mobile POS app. It includes a login screen and a basic sales screen that fetches products and creates sales via the backend.

How to run
1. From repo root, install dependencies: `pnpm install`
2. From repo root, run the mobile app with pnpm workspace filter:
   - pnpm --filter ./apps/mobile start
3. Open the app in Expo Go (Android/iOS) or run on simulator/emulator.

Notes
- The mobile app uses the backend at http://localhost:4000 by default. On a device, replace API_BASE with your machine's LAN IP or use ngrok.
- Current app uses AsyncStorage to store auth token. For production, consider secure storage.

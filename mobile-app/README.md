# Mindfulness Avatar — mobile client

This folder is the isolated Expo/React Native client copied from the original
`Mindfulness-App` project and adapted to the services in the parent `Chatbot`
project. It does not contain or modify the web client or Python backend.

## Service contract

- Firebase Authentication supplies the bearer token for protected API calls.
- The client creates an opaque conversation ID locally and sends it as
  `session_id`; the current server no longer exposes `/session/start` or client
  session tokens.
- Chat uses `POST /chat` with `{ message, session_id }`.
- The embedded avatar uses the same bearer-authenticated `/chat`, `/chat/stream`,
  `/tts`, and `/session/end` endpoints.
- Completed practices are stored under the signed-in user's Firestore document
  and `sessions` subcollection.

## Local setup

1. Copy `.env.example` to `.env` and enter the Firebase public client values.
2. For a physical phone, set `EXPO_PUBLIC_MINDFULNESS_API_BASE_URL` to an HTTPS
   server or your computer's LAN address, such as `http://192.168.1.20:8000`.
   `127.0.0.1` on a phone refers to the phone itself.
3. Install and verify:

   ```bash
   npm ci
   npx expo-doctor
   npm start
   ```

Use `npm run start:lan` for a device on the same network. After changing `.env`,
restart Metro with `npx expo start --clear`.

## Security notes

- `EXPO_PUBLIC_*` values are bundled into the app and must never contain server
  secrets, private keys, service-account JSON, or Gemini credentials.
- The WebView may navigate only within the configured API origin.
- The live avatar is loaded only from the configured API origin; the copied
  local avatar asset is retained as a source reference and is not bundled by
  the current app entry point.
- Production API URLs must use HTTPS. Plain HTTP is accepted only in development
  for local/LAN testing.
- The optional support form is disabled unless
  `EXPO_PUBLIC_SUPPORT_FORM_ENDPOINT` is configured with an HTTPS endpoint.

See `SECURITY.md` for the completed review, remaining risks, and verification
commands.

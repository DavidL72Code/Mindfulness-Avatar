# Mobile Mindfulness React

This folder contains a separate React Native Expo client for the mindfulness assistant.

## Run locally

1. `cd Mobile_Mindfulness_React`
2. `npm install`
3. Set the backend URL for the mobile app:
   `export EXPO_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com`
4. `npx expo start`
5. Open the Expo Go app on a phone or launch an iOS/Android simulator

## Notes

- The mobile client talks to the same Render backend used by the web version.
- Set `EXPO_PUBLIC_API_BASE_URL` before launching Expo if the backend URL changes.
- The original static web client in `Web_Mindfulness_Chatbot/` is unchanged.

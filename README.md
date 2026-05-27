# Mindfulness Connected

A multilingual mindfulness web and mobile app with an AI avatar guide, real-time voice chat, per-sentence streaming TTS, and cross-platform session tracking.

---

## What the App Does

### Authentication
Users sign in or create an account through Firebase Authentication (email/password). On first load the app shows a language selection screen — choosing a language sets the locale for all UI strings and instructs the AI to respond in that language. The authenticated session is persisted across page reloads via Firebase's own token management.

### Home & Session Catalog
After signing in users land on the home screen which lists all mindfulness sessions. Each tile shows the session title, a short description, duration, and whether it is a guided, scripted, or placeholder session. Tapping a tile opens the session detail page where a Start Session / End Session pair controls an active session timer. A floating mini guide avatar (the home-dock avatar) is accessible from the home screen at any time — it docks to the bottom-right corner and can be dragged anywhere on screen.

### AI Avatar — The Guide
Two instances of the avatar run as iframes loaded from `avatar.html`:

- **Mini guide (home-dock)** — a compact floating window available on the home screen for general mindfulness help.
- **Session avatar (session-panel)** — overlaid on the session detail card during an active session; it speaks the scripted or guided session content.

`app.js` communicates with each iframe via `postMessage`. Commands include:

| Command | Effect |
|---|---|
| `host-speak-script` | Queue a scripted TTS segment for the avatar to speak |
| `host-speak-text` | Speak arbitrary text (used for guided activity steps) |
| `host-idle` | Return the avatar to its idle animation |
| `host-send-text` | Pass a chat message into the avatar's conversation |

The avatar iframe queues commands until it signals `avatar-ready`, at which point the backlog is flushed in order.

### How the Avatar Was Built — Three.js + GLB
`avatar.html` loads a `.glb` character model (created in **Avaturn**, which exports Ready Player Me-compatible `.glb` files with ARKit/52-blendshape morph targets). The scene is rendered with **Three.js r0.162**:

- `GLTFLoader` parses the binary GLB, extracting the skinned mesh and its morph target dictionary.
- `OrbitControls` handles camera interaction.
- A custom animation loop drives the idle breath cycle by lerping the morph target influences each frame.

For lip-sync, the TTS audio is played through the Web Audio API. The raw PCM amplitude is sampled in real time and mapped to the `viseme_sil`, `viseme_PP`, `viseme_aa`, and related ARKit morph targets so the mouth moves in rough sync with the speech.

### TTS + Gemini Working in Tandem
The pipeline has two layers:

**1. Text generation — Gemini (Google Generative AI)**
`chatbot.py` calls `google-generativeai` via `call_gemini_stream()`, which yields text fragments as Gemini streams its response. `server.py` accumulates those fragments and splits on sentence boundaries (`.`, `!`, `?`, `;`, `:`).

**2. Per-sentence TTS streaming — Edge TTS (Microsoft)**
Each completed sentence is immediately dispatched to a `ThreadPoolExecutor` worker that calls `synthesize_edge_tts_streaming()`. This generator yields raw MP3 bytes as they arrive off the Microsoft TTS WebSocket — the first bytes appear in roughly 300 ms.

**3. SSE delivery to the browser**
Three event types arrive over a single Server-Sent Events connection:

| SSE event field | Meaning |
|---|---|
| `chunk` | A sentence of Gemini text (shown in the chat bubble immediately) |
| `audio_chunk` | A base64-encoded slice of MP3 for the corresponding sentence |
| `audio_end` | Signals that a sentence's audio stream is complete |

**4. MediaSource playback in the browser**
`app.js` feeds `audio_chunk` bytes into a per-sentence `MediaSource` / `SourceBuffer` pipeline. Chrome and Firefox start decoding and playing the first sentence before the second sentence has even been generated. Safari (which does not support `audio/mpeg` in MSE) falls back to collecting all chunks for a sentence then playing them as a single blob URL.

The result: the first word of the avatar's voice is audible within about 300 ms of the AI starting to generate, versus the previous ~2 s wait for the full sentence to synthesise.

**Language routing**
When a non-English locale is selected, `server.py` prepends `"Always respond in [Language]. Do not switch languages."` to the Gemini system prompt via `build_chat_prompt(language=lang)`. Voice recognition (`SpeechRecognition` API) uses the `srLang` code from the `LANGUAGES` table (e.g. `ar-SA`, `zh-CN`, `hi-IN`).

### Microphone Voice Input
A mic button appears in three places: the mini guide strip, the session avatar strip, and the left side of the chat composer (opposite the Send button). Pressing it calls the browser's `SpeechRecognition` API. While recording, the button animates with five bouncing bars. Pressing again (or silence detection) stops recording, transcribes the audio, populates the chat draft, opens the chat modal if closed, and auto-sends the message to Gemini.

### Chat Interface
The chat modal (`/chat/stream` endpoint) is a standard streaming chat backed by Gemini. The session's conversation history is summarised in rolling batches by a separate Gemini call whenever the history exceeds 20 messages, so the effective context never goes stale. A fallback path hits the non-streaming `/chat` endpoint if the stream connection fails.

### Profile Section
The Profile tab has three sub-screens:

- **Personal Information** — displays the account email, creation date, date of birth, name, and current language preference, all pulled from Firestore.
- **Settings** — theme toggle (light/dark via a CSS custom-property swap), notification preference toggle, language selector, and a password-reset button that emails a Firebase reset link.
- **Support** — opens a pre-filled `mailto:` link to submit a support ticket.

### Stats Section — How Tracking Works
Every time the user ends a session a Firestore transaction atomically:

1. Writes a new document to `users/{uid}/sessions/` with the session ID, title, duration in seconds, and a local date key.
2. Updates the top-level `users/{uid}` document with:

| Field | What it stores |
|---|---|
| `sessionsFinished` | Cumulative count of completed sessions |
| `totalSessionSeconds` | Raw seconds across all sessions |
| `totalSessionMinutes` | Rounded minute total shown in the UI |
| `currentStreak` | Consecutive days with at least one 3-minute session |
| `longestStreak` | All-time best streak |
| `totalActiveDays` | Number of distinct calendar days with activity |
| `lastActiveDate` | ISO date string of the most recent active day |

A "day" only counts if the session lasted at least 3 minutes. Streak logic checks the gap between `lastActiveDate` and today: gap = 0 (same day, streak unchanged), gap = 1 (consecutive day, streak + 1), gap > 1 (streak resets to 1).

The Stats screen reads these fields live via a Firestore `onSnapshot` listener so numbers update in real time across browser tabs and between the web and mobile apps.

---

## Language Support

The app ships with 11 built-in locales. UI strings (buttons, labels, form fields) are pre-translated in the `translations` object in `app.js`. A hidden Google Translate widget handles any remaining static content (session descriptions, welcome card text). After each re-render the widget is re-triggered with a debounced call so dynamically rendered content is also translated.

| Code | Language | Code | Language |
|---|---|---|---|
| `en` | English | `ar` | Arabic (RTL) |
| `ko` | 한국어 | `pt` | Português |
| `es` | Español | `hi` | हिन्दी |
| `fr` | Français | `de` | Deutsch |
| `ja` | 日本語 | `vi` | Tiếng Việt |
| `zh` | 中文 | | |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Vanilla JS (no framework), CSS custom properties |
| 3D avatar rendering | Three.js r0.162, GLTFLoader, OrbitControls |
| Avatar model | Avaturn-exported `.glb` with ARKit 52 blendshapes |
| AI text generation | Google Gemini (`gemini-3.1-flash-lite`) via `google-generativeai` |
| TTS | Microsoft Edge TTS (`edge-tts`) — streaming MP3 over WebSocket |
| Audio playback | MediaSource Extensions (MSE) — Chrome/Firefox; Blob URL — Safari |
| Voice input | Web Speech API (`SpeechRecognition`) |
| Backend | Python `http.server.ThreadingHTTPServer`, `ThreadPoolExecutor` for TTS workers |
| Auth & database | Firebase Authentication + Firestore |
| Mobile | React Native + Expo |

---

## Deployment

### Web App — Render

The Python backend (`server.py`) serves the static web files from `Web_mindfulnessconnected/` and exposes the API endpoints on the same origin. It is deployed as a single **Render web service**.

**Steps:**

1. Push to the `main` branch on GitHub. Render picks up the commit automatically (`autoDeployTrigger: commit` in `render.yaml`).
2. Render runs `pip install -r requirements.txt` then `python3 server.py`.
3. Set the following environment variables in the Render dashboard:

| Variable | Value |
|---|---|
| `GOOGLE_API_KEY` | Your Google / Gemini API key |
| `GEMINI_TTS_MODEL` | `gemini-3.1-flash-tts-preview` (optional override) |
| `GEMINI_TTS_VOICE` | `Iapetus` (optional override) |
| `EDGE_TTS_VOICE` | `en-US-AndrewMultilingualNeural` (optional override) |
| `PORT` | Set automatically by Render |

4. The `/health` endpoint is used by Render's health check. Once it returns `{"status":"ok"}` the service is live.
5. Point your custom domain (if any) at the Render service URL in the Render dashboard.

**Firebase config** is fetched at runtime from the `/firebase-config` endpoint, which reads `EXPO_PUBLIC_FIREBASE_*` environment variables set in Render. No secrets are baked into the static files.

---

### Mobile App — Expo Go

The mobile app is built with **React Native + Expo** and talks to the same Python backend.

**Development (Expo Go):**

1. Copy `.env.example` to `.env` and fill in your Firebase keys and backend URL.
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm start          # tunnel mode (works when phone and Mac are on different networks)
npm run start:lan  # LAN mode (phone and Mac must be on the same Wi-Fi)
```

4. Install **Expo Go** on your iOS or Android device.
5. Scan the QR code shown in the terminal with your camera (iOS) or the Expo Go app (Android).

**Notes for Mac developers:**
- You do not need Xcode for Expo Go testing on a physical device.
- If Expo Go shows "Taking longer than expected", switch to tunnel mode (`npm start`).
- Ignore `unable to run simctl` warnings as long as Metro starts and the QR code appears.
- Only set up Xcode if you need the iOS Simulator.

**Production build (EAS):**

```bash
npx eas build --platform ios     # submit to App Store
npx eas build --platform android # submit to Google Play
```

EAS configuration is in `eas.json`. App metadata is in `app.json`.

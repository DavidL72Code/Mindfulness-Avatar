# Mobile security review

Review date: 2026-08-09

## Scope

This review covers only the isolated Expo client in this directory and safe,
non-destructive checks against the local development server. The parent web
client and backend were treated as read-only, and the source
`Mindfulness-App` directory was not changed.

No real environment values, credentials, Firebase service-account data, or API
keys were copied into this directory. Only placeholder names are present in
`.env.example`.

## Fixed in this copy

- Removed the obsolete `/session/start` and client session-token flow. Chat now
  matches the current bearer-authenticated API contract and uses a client-side
  opaque conversation ID that the server binds to the authenticated user.
- Restricted production API configuration to HTTPS. Local or LAN HTTP is
  accepted only in development.
- Restricted avatar WebView navigation to the configured API origin, disabled
  file access, and removed the live dependency on remotely executable CDN
  scripts from the mobile WebView.
- Added limits and validation for chat, native speech messages, sign-up fields,
  and support-form input. Raw Firebase errors are no longer shown to users.
- Removed email duplication from session records and corrected Firestore
  snapshot existence checks.
- Made mood-calendar days accessible by tap and keyboard focus instead of
  hover alone, enlarged touch targets, and fixed small-screen/keyboard layouts.
- Upgraded to Expo SDK 57 and aligned React Native dependencies. Expo Doctor
  passes all checks, and the production export succeeds for iOS, Android, and
  web.
- Reduced the dependency audit from 33 advisories (including four critical) to
  21 advisories with no critical findings.

## Remaining risks and follow-up

- `npm audit` still reports 21 transitive development-toolchain advisories: 14
  high and 7 moderate, primarily through Expo/Metro packages. The suggested
  forced resolution downgrades the app to incompatible Expo/React Native
  versions, so it was not applied. Recheck after future Expo SDK releases.
- Firebase Auth web persistence uses the official AsyncStorage integration.
  This is appropriate for this stack, but a rooted or compromised device may
  still access local app storage. Avoid storing backend secrets on-device.
- Firestore rules isolate user documents by authenticated UID, but user-written
  activity metrics are not tamper-proof analytics. Validate them server-side if
  they are ever used for rewards, billing, research, or clinical decisions.
- Firebase App Check is not enabled in this client. Add it before treating API
  or Firestore access as resistant to scripted abuse.
- The server-hosted 3D avatar remains a large WebGL workload. The client mounts
  only one avatar WebView at a time, but lower-end devices still need real-device
  memory and thermal testing.
- A full platform-native dark theme and native-stack migration remain design
  improvements, not release-blocking security fixes.

## Verification commands

```bash
npm ci
npm run doctor
npm audit
npm run export:all -- --output-dir /tmp/mindfulness-mobile-export
```

Penetration testing should remain authorized and scoped. Do not run load,
credential, or destructive tests against the public deployment without explicit
permission and a maintenance window.

## Safe local endpoint checks

The running local server returned:

- `GET /health`: `200` with CSP, referrer policy, content-type protection,
  frame protection, and permissions-policy headers.
- Unauthenticated `POST /chat`: `401`.
- Cross-origin `POST /chat` from an unapproved origin: `403`.
- Path traversal request for `../server.py`: `404` with no source disclosure.

---
target: formal critique of the local mindfulness home and stats surfaces
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-08T04-56-25Z
slug: web-mindfulnessconnected-index-html
---
# Formal critique

## Heuristic scores

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 2 | Loading and auth states exist, but sign-in feedback is visually quiet and the authenticated state was not browser-verified without credentials. |
| 2 | Match system / real world | 3 | Practice language and the month activity map are recognizable; some legacy copy still reads like implementation language. |
| 3 | User control and freedom | 3 | Clear navigation and session controls; calendar navigation is direct. |
| 4 | Consistency and standards | 2 | The new quiet-studio system coexists with older blue/card treatments across the app. |
| 5 | Error prevention | 2 | Basic validation exists, but disabled/loading states and field-level guidance are inconsistent. |
| 6 | Recognition rather than recall | 3 | Session tiles, stats labels, and calendar legend are scannable. |
| 7 | Flexibility and efficiency | 3 | Month navigation and direct session entry reduce friction; keyboard shortcuts are not present. |
| 8 | Aesthetic and minimalist design | 3 | Home is substantially less crowded, with a product-specific green/sage visual language. |
| 9 | Error recovery | 2 | Recovery copy exists, but some failures only render generic messages. |
| 10 | Help and documentation | 2 | Support/FAQ exists, but the primary home surface does not explain the calendar interaction. |

Total: 25/40.

## Priority issues

- [P1] Broken sign-in logo asset: `renderSignInScreen` references `../assets/multi-lang-wellness.png`, which is not served by the local static root. The browser screenshot shows a broken image. Fix the asset path or serve the asset directory.
- [P1] Authenticated home and stats states need a signed-in browser verification pass. The available local session was unauthenticated, so the new calendar and home animations were source-verified but not visually exercised with real data.
- [P2] The new visual system is not yet applied to every surface. Legacy session/profile/modal styles retain the previous blue-heavy card language, which weakens product coherence.
- [P2] The calendar loads the entire user session collection to support multi-year navigation. This is functionally correct but should be paginated or aggregated for accounts with large histories.
- [P2] Activity cells use native `title` tooltips. They work on desktop hover, but touch and keyboard users need an inline selected-day detail state.

## Positive findings

- User-controlled content is escaped before `innerHTML` rendering.
- The activity calendar has semantic grid roles, labels, focusable cells, and reduced-motion support.
- Local security checks returned 401 for unauthenticated chat, 403 for disallowed CORS, and confirmed CSP, X-Frame-Options, nosniff, Referrer-Policy, and Permissions-Policy headers.

## Deterministic detector findings

- `avatar.html:2118`: pre-existing width transition warning.
- `avatar.html:2023`: pre-existing zero-offset glow warning.

These findings are outside the redesigned home/stats surface.

## Persona red flags

- First-timer: broken logo reduces trust before sign-in; generic auth error copy does not always explain the recovery step.
- Power user: historical activity is available but requires repeated month clicks; no year jump or selected-day detail panel exists.

## Provocative questions

- Should a day selection open a compact detail drawer instead of relying on hover?
- At what history size should the calendar switch from raw session reads to a monthly aggregate?
- Should the blue legacy surfaces be fully migrated into the quiet-studio system before adding more features?

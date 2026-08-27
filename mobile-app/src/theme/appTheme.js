/**
 * Shared UI tokens. Plain JS has no `enum`; frozen objects give the same
 * fixed key set for imports across screens.
 */

const signInBackdrop = ['#FBFAFF', '#F7F5FF', '#EEEAFB'];
Object.freeze(signInBackdrop);

const primaryCta = ['#5046b6', '#6760d4', '#756edb'];
Object.freeze(primaryCta);

export const ThemeColor = Object.freeze({
  BRAND: '#6760d4',
  INPUT_BG: '#F1EFFA',
  INPUT_BORDER: '#DED9EE',
  TEXT_PRIMARY: '#292541',
  TEXT_MUTED: '#746F88',
  PLACEHOLDER: '#918BA4',
  WHITE: '#ffffff',
  SHADOW_SLATE: '#0f172a',
  SCREEN_BG: '#F7F5FF',
  INPUT_BORDER_SOFT: '#DED9EE',
  HOME_SUBTITLE: '#67617D',
  HOME_CHAT_MUTED: '#817B94',
  HOME_CARD_TEXT: '#625D73',
  FOOTER_MUTED: 'rgba(98, 93, 115, 0.86)',
});

export const ThemeGradient = Object.freeze({
  SIGN_IN_BACKDROP: signInBackdrop,
  PRIMARY_CTA: primaryCta,
});

export const ThemeRadius = Object.freeze({
  SM: 10,
  MD: 12,
});

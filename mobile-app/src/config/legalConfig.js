export const PUBLIC_SITE_URL = String(
  process.env.EXPO_PUBLIC_PUBLIC_SITE_URL || 'https://mindfulness-avatar.vercel.app',
).replace(/\/$/, '');

export const PRIVACY_POLICY_URL = `${PUBLIC_SITE_URL}/privacy`;
export const ACCOUNT_DELETION_URL = `${PUBLIC_SITE_URL}/delete-account`;
export const SUPPORT_EMAIL = 'support@mindfulnessconnected.app';

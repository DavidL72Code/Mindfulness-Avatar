const DEFAULT_API_BASE_URL = 'https://mindfulness-avatar.onrender.com';

const LOCAL_HTTP_HOST_PATTERN =
  /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+)/i;

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

export function resolveApiBaseUrl(value = process.env.EXPO_PUBLIC_MINDFULNESS_API_BASE_URL) {
  const candidate = normalizeBaseUrl(value);
  if (!candidate) return DEFAULT_API_BASE_URL;
  if (candidate.startsWith('https://')) return candidate;
  if (__DEV__ && LOCAL_HTTP_HOST_PATTERN.test(candidate)) return candidate;
  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const WEBVIEW_ORIGIN_WHITELIST = [
  'about:blank',
  `${API_BASE_URL}/*`,
];

export function isAllowedWebViewNavigation(url) {
  const candidate = String(url || '');
  return (
    candidate === 'about:blank' ||
    candidate === API_BASE_URL ||
    candidate.startsWith(`${API_BASE_URL}/`)
  );
}

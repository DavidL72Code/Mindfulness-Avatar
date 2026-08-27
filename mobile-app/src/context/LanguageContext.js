import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebaseConfig';
import { LOCALIZED_CONTENT, SUPPORTED_LOCALES } from '../i18n/generated/content';

/** @typedef {'en'|'ko'|'es'|'fr'|'ja'|'zh'|'ar'|'pt'|'hi'|'de'|'vi'} AppLocale */

const LanguageContext = createContext(
  /** @type {{ locale: AppLocale; setLocale: (l: AppLocale) => Promise<void>; hydrateLocale: (l: AppLocale) => void; t: (key: string, vars?: Record<string, string | number>) => string; }} */ (
    null
  ),
);

/** @param {string} template @param {Record<string, string | number> | undefined} vars */
function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) && vars[k] != null && String(vars[k]) !== ''
      ? String(vars[k])
      : `{${k}}`,
  );
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(/** @type {AppLocale} */ ('en'));

  useEffect(() => {
    AsyncStorage.getItem('mindfulness-language-preference')
      .then((stored) => {
        if (SUPPORTED_LOCALES.includes(stored)) setLocaleState(stored);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Keep guest UI language (e.g. Korean on sign-in) until the user signs in.
        return;
      }
      let snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        await new Promise((r) => setTimeout(r, 400));
        snap = await getDoc(doc(db, 'users', user.uid));
      }
      if (snap.exists()) {
        const pref = snap.data()?.languagePreference;
        if (SUPPORTED_LOCALES.includes(pref)) {
          setLocaleState(pref);
          void AsyncStorage.setItem('mindfulness-language-preference', pref);
        }
      }
    });
  }, []);

  const hydrateLocale = useCallback((/** @type {AppLocale} */ next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setLocaleState(next);
    void AsyncStorage.setItem('mindfulness-language-preference', next);
  }, []);

  const setLocale = useCallback(async (/** @type {AppLocale} */ next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setLocaleState(next);
    await AsyncStorage.setItem('mindfulness-language-preference', next).catch(() => {});
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { languagePreference: next, locale: next },
        { merge: true },
      );
    } catch {
      // Profile may be missing; ignore so UI still switches.
    }
  }, []);

  const t = useCallback(
    (/** @type {string} */ key, /** @type {Record<string, string | number> | undefined} */ vars) => {
      const table = LOCALIZED_CONTENT[locale]?.ui ?? LOCALIZED_CONTENT.en.ui;
      const template = table[key] ?? LOCALIZED_CONTENT.en.ui[key] ?? key;
      return interpolate(template, vars);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, hydrateLocale, t }),
    [locale, setLocale, hydrateLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { KOREAN_NATIVE_LABEL } from '../i18n/labels';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { ThemeColor, ThemeGradient, ThemeRadius } from '../theme/appTheme';
import { setRememberMePreference } from '../utils/authPreferences';

/** Kept for any link styles; avoids ReferenceError if Metro serves a stale bundle. */
const SIGN_IN_LINK_BLUE = '#2563eb';
const WELLNESS_LOGO = require('../../assets/multi-lang-wellness.png');

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export default function SignInScreen({ navigation }) {
  const { locale, setLocale, t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const logoSize = Math.round(clamp(windowWidth * 0.572, 154, 242));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoReady, setLogoReady] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    let active = true;

    Asset.loadAsync([WELLNESS_LOGO])
      .then(() => {
        if (active) setLogoReady(true);
      })
      .catch(() => {
        if (active) setLogoReady(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleUILanguage = () => {
    void setLocale(locale === 'en' ? 'ko' : 'en');
  };

  const cornerLabel = locale === 'en' ? KOREAN_NATIVE_LABEL : 'English';

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t('errorTitle'), t('signInErrorBothFields'));
      return;
    }

    try {
      await setRememberMePreference(rememberMe);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert(t('signInFailedTitle'), t('signInFailedBody'));
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert(t('errorTitle'), t('forgotPasswordEnterEmail'));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      Alert.alert(t('forgotPasswordSentTitle'), t('forgotPasswordSentBody'));
    } catch (error) {
      Alert.alert(t('forgotPasswordFailedTitle'), t('forgotPasswordFailedBody'));
    }
  };

  return (
    <LinearGradient
      colors={[...ThemeGradient.SIGN_IN_BACKDROP]}
      locations={[0, 0.55, 1]}
      style={styles.screenGradient}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.langCorner}>
          <Pressable
            onPress={toggleUILanguage}
            style={({ pressed }) => [
              styles.langCornerBtn,
              pressed && styles.langCornerBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              locale === 'en'
                ? 'Switch to Korean'
                : 'Switch to English'
            }
          >
            <Text style={styles.langCornerText}>{cornerLabel}</Text>
          </Pressable>
        </View>
        <View style={styles.layout}>
          <View style={styles.content}>
            <View style={styles.logoSlot}>
              {logoReady ? (
                <Image
                  source={WELLNESS_LOGO}
                  style={{ width: logoSize, height: logoSize }}
                  resizeMode="contain"
                  onError={() => setLogoReady(false)}
                />
              ) : (
                <View style={[styles.logoFallback, { width: logoSize, height: logoSize }]}>
                  <Ionicons
                    name="leaf-outline"
                    size={Math.round(logoSize * 0.28)}
                    color={ThemeColor.BRAND}
                  />
                  <Text style={styles.logoFallbackText}>Mindfulness</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{t('signInWelcome')}</Text>
            <Text style={styles.subtitle}>{t('signInSubtitle')}</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.inputShell}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={ThemeColor.TEXT_MUTED}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('email')}
                  placeholderTextColor={ThemeColor.PLACEHOLDER}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  style={styles.inputInner}
                />
              </View>

              <View style={styles.inputShell}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={ThemeColor.TEXT_MUTED}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('password')}
                  placeholderTextColor={ThemeColor.PLACEHOLDER}
                  secureTextEntry
                  style={styles.inputInner}
                />
              </View>
            </View>

            <Pressable
              onPress={() => setRememberMe((prev) => !prev)}
              style={({ pressed }) => [
                styles.rememberRow,
                pressed && styles.signUpPressed,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.rememberBox, rememberMe && styles.rememberBoxChecked]}>
                {rememberMe ? (
                  <Ionicons name="checkmark" size={16} color={ThemeColor.WHITE} />
                ) : null}
              </View>
              <Text style={styles.rememberText}>{t('rememberMe')}</Text>
            </Pressable>

            <View style={styles.buttonShadow}>
              <Pressable
                onPress={handleSignIn}
                style={({ pressed }) => [
                  styles.buttonPressable,
                  pressed && styles.buttonPressed,
                ]}
              >
                <LinearGradient
                  colors={[...ThemeGradient.PRIMARY_CTA]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonInner}>
                    <Text style={styles.primaryButtonText}>
                      {t('signInButton')}
                    </Text>
                    <View style={styles.buttonChevron}>
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="rgba(255,255,255,0.95)"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            <Pressable
              onPress={handleForgotPassword}
              style={({ pressed }) => [
                styles.forgotPasswordRow,
                pressed && styles.signUpPressed,
              ]}
            >
              <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('SignUp')}
              style={({ pressed }) => [
                styles.signUpRow,
                pressed && styles.signUpPressed,
              ]}
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color={ThemeColor.BRAND}
                style={styles.signUpIcon}
              />
              <Text style={styles.link}>{t('signUpPrompt')}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('signInFooter')}</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screenGradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  langCorner: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 4,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  langCornerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: ThemeRadius.SM,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  langCornerBtnPressed: {
    opacity: 0.82,
  },
  langCornerText: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColor.BRAND,
  },
  layout: {
    flex: 1,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 4,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    width: '100%',
  },
  logoSlot: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.14)',
    gap: 10,
  },
  logoFallbackText: {
    color: ThemeColor.BRAND,
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 10,
    lineHeight: 14,
    color: ThemeColor.FOOTER_MUTED,
    textAlign: 'center',
    fontWeight: '400',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: ThemeColor.BRAND,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: ThemeColor.TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 6,
  },
  rememberBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: ThemeColor.INPUT_BORDER,
    backgroundColor: ThemeColor.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rememberBoxChecked: {
    backgroundColor: ThemeColor.BRAND,
    borderColor: ThemeColor.BRAND,
  },
  rememberText: {
    color: ThemeColor.TEXT_MUTED,
    fontSize: 15,
    fontWeight: '500',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColor.INPUT_BG,
    borderWidth: 1,
    borderColor: ThemeColor.INPUT_BORDER,
    borderRadius: ThemeRadius.SM,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputInner: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: ThemeColor.TEXT_PRIMARY,
    fontWeight: '400',
  },
  buttonShadow: {
    marginTop: 10,
    marginBottom: 28,
    borderRadius: ThemeRadius.SM,
    ...Platform.select({
      ios: {
        shadowColor: ThemeColor.SHADOW_SLATE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonPressable: {
    borderRadius: ThemeRadius.SM,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonGradient: {
    borderRadius: ThemeRadius.SM,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'relative',
  },
  primaryButtonText: {
    color: ThemeColor.WHITE,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  buttonChevron: {
    position: 'absolute',
    right: 16,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signUpIcon: {
    marginRight: 8,
  },
  signUpPressed: {
    opacity: 0.65,
  },
  link: {
    color: ThemeColor.BRAND,
    fontWeight: '600',
    fontSize: 15,
  },
  forgotPasswordRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    paddingBottom: 12,
  },
  forgotPasswordText: {
    color: SIGN_IN_LINK_BLUE,
    fontWeight: '600',
    fontSize: 14,
  },
});

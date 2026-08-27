import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebaseConfig';
import { API_BASE_URL } from '../config/apiConfig';
import {
  ACCOUNT_DELETION_URL,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
} from '../config/legalConfig';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';
import { useLanguage } from '../context/LanguageContext';

function requestErrorCopy(status, t) {
  if (status === 429) return t('deleteAccountTooManyAttempts');
  if (status === 401) return t('deleteAccountRecentLogin');
  if (status === 503) return t('deleteAccountEmailUnavailable');
  return t('deleteAccountGenericError');
}

export default function DeleteAccountScreen({ navigation }) {
  const { t } = useLanguage();
  const accountEmail = auth.currentUser?.email || '';
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const requestDeletionEmail = async () => {
    const user = auth.currentUser;
    if (!user?.email || sending) return;
    setSending(true);
    setError('');

    try {
      const token = await user.getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/account-deletion/request`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setError(requestErrorCopy(response.status, t));
        return;
      }
      setSent(true);
    } catch {
      setError(t('deleteAccountNetworkError'));
    } finally {
      setSending(false);
    }
  };

  const openSupportEmail = () => {
    const subject = encodeURIComponent('Help with account deletion');
    const body = encodeURIComponent(
      `I need help deleting the Mindfulness Connected account associated with ${accountEmail || '[my account email]'}.`,
    );
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('personalInfoBack')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color="#24465f" />
          <Text style={styles.backText}>{t('personalInfoBack')}</Text>
        </Pressable>

        <View style={[styles.icon, sent && styles.sentIcon]}>
          <Ionicons
            name={sent ? 'mail-open-outline' : 'mail-outline'}
            size={28}
            color={sent ? '#2d6b62' : '#a33a3a'}
          />
        </View>
        <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
          {sent ? t('deleteAccountEmailSentTitle') : t('deleteAccountTitle')}
        </Text>
        <Text style={styles.intro}>
          {sent
            ? t('deleteAccountEmailSentBody', { email: accountEmail })
            : t('deleteAccountIntro')}
        </Text>

        {!sent ? (
          <>
            <View style={styles.emailCard}>
              <View style={styles.emailIcon}>
                <Ionicons name="person-outline" size={20} color="#2d6b62" />
              </View>
              <View style={styles.emailCopy}>
                <Text style={styles.emailLabel}>{t('deleteAccountEmailDestination')}</Text>
                <Text style={styles.emailValue} selectable>{accountEmail}</Text>
              </View>
            </View>

            <View style={styles.consequenceCard}>
              <Text style={styles.consequenceTitle}>{t('deleteAccountRemoves')}</Text>
              {[t('deleteAccountProfileData'), t('deleteAccountActivityData')].map((item) => (
                <View key={item} style={styles.consequenceRow}>
                  <View style={styles.dot} />
                  <Text style={styles.consequenceText}>{item}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={requestDeletionEmail}
              disabled={sending || !accountEmail}
              accessibilityRole="button"
              accessibilityState={{ disabled: sending || !accountEmail, busy: sending }}
              style={({ pressed }) => [
                styles.primaryButton,
                (sending || !accountEmail) && styles.disabled,
                pressed && !sending && styles.primaryPressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>{t('deleteAccountSendEmail')}</Text>
              )}
            </Pressable>
            <Text style={styles.expiryText}>{t('deleteAccountLinkExpiry')}</Text>
          </>
        ) : null}

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color="#8d3030" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {sent ? (
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>{t('deleteAccountNextSteps')}</Text>
            <Text style={styles.nextStepsBody}>{t('deleteAccountNextStepsBody')}</Text>
            <Pressable
              onPress={requestDeletionEmail}
              disabled={sending}
              accessibilityRole="button"
              style={styles.resendButton}
            >
              {sending ? <ActivityIndicator color="#315f7c" /> : <Text style={styles.resendText}>{t('deleteAccountResend')}</Text>}
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={openSupportEmail} accessibilityRole="link" style={styles.textLinkButton}>
          <Text style={styles.textLink}>{t('deleteAccountNeedHelp')}</Text>
        </Pressable>
        <View style={styles.legalLinks}>
          <Pressable onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} accessibilityRole="link">
            <Text style={styles.legalLink}>{t('privacyPolicy')}</Text>
          </Pressable>
          <Text style={styles.linkSeparator}>·</Text>
          <Pressable onPress={() => void Linking.openURL(ACCOUNT_DELETION_URL)} accessibilityRole="link">
            <Text style={styles.legalLink}>{t('accountDeletionInfo')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ThemeColor.SCREEN_BG },
  container: { padding: 24, paddingBottom: 48, maxWidth: 520, width: '100%', alignSelf: 'center' },
  backButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, marginBottom: 24 },
  backText: { color: '#24465f', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.65 },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff0f0', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  sentIcon: { backgroundColor: '#e8f2ee' },
  title: { color: '#162846', fontSize: 32, lineHeight: 38, fontWeight: '800' },
  intro: { color: '#526477', fontSize: 15, lineHeight: 23, marginTop: 10, marginBottom: 22 },
  emailCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#edf5f2', borderRadius: ThemeRadius.MD, marginBottom: 18 },
  emailIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  emailCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  emailLabel: { color: '#60766f', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  emailValue: { color: '#1d453e', fontSize: 14, fontWeight: '750', marginTop: 3, flexShrink: 1 },
  consequenceCard: { backgroundColor: '#fff7f5', borderWidth: 1, borderColor: '#f0d7d2', borderRadius: ThemeRadius.MD, padding: 17, marginBottom: 20 },
  consequenceTitle: { color: '#6e2929', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  consequenceRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#b44b4b', marginTop: 7, marginRight: 10 },
  consequenceText: { flex: 1, color: '#724848', fontSize: 13, lineHeight: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fff0f0', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { flex: 1, color: '#8d3030', fontSize: 13, lineHeight: 19 },
  primaryButton: { minHeight: 54, borderRadius: 15, backgroundColor: '#2d6b62', alignItems: 'center', justifyContent: 'center' },
  primaryPressed: { backgroundColor: '#24574f' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  expiryText: { color: '#71818d', textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 11 },
  nextStepsCard: { padding: 18, borderRadius: ThemeRadius.MD, backgroundColor: '#eaf4f0', borderWidth: 1, borderColor: '#cee3db' },
  nextStepsTitle: { color: '#225047', fontSize: 15, fontWeight: '800' },
  nextStepsBody: { color: '#58716a', fontSize: 13, lineHeight: 20, marginTop: 7 },
  resendButton: { minHeight: 46, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  resendText: { color: '#315f7c', fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
  textLinkButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  textLink: { color: '#315f7c', fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
  legalLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4 },
  legalLink: { color: '#536d7f', fontSize: 12, textDecorationLine: 'underline' },
  linkSeparator: { color: '#8b9aa5' },
});

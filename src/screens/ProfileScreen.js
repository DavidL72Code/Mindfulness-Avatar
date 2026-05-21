import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';
import { useLanguage } from '../context/LanguageContext';

const SUPPORT_EMAIL = 'davebro876@gmail.com';




function ProfileButton({ label, onPress, isDanger }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardInner}>
        <Text style={[styles.cardText, isDanger && styles.dangerText]}>{label}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t } = useLanguage();
  const [ticketVisible, setTicketVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {}
  }, []);

  const openTicket = () => {
    setSubject('');
    setMessage('');
    setTicketVisible(true);
  };

  const submitTicket = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing fields', 'Please fill in both the subject and message before sending.');
      return;
    }
    const userEmail = auth.currentUser?.email ?? 'unknown';
    const body =
      `${message.trim()}\n\n` +
      `──────────────────\n` +
      `From: ${userEmail}`;
    const mailto =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${encodeURIComponent(`[Support] ${subject.trim()}`)}` +
      `&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto).catch(() =>
      Alert.alert('Could not open email', `Please email us directly at ${SUPPORT_EMAIL}`)
    );
    setTicketVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('profileTitle') || 'Profile'}</Text>

        <View style={styles.section}>
          <ProfileButton
            label={t('personalInformation')}
            onPress={() => Alert.alert('Personal Information', 'Coming soon.')}
          />
          <ProfileButton
            label={t('settings')}
            onPress={() => Alert.alert('Settings', 'Coming soon.')}
          />
          <ProfileButton
            label={t('support')}
            onPress={openTicket}
          />
          <ProfileButton
            label={t('logOut')}
            onPress={handleLogout}
            isDanger
          />
        </View>
      </ScrollView>

      <Modal
        visible={ticketVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTicketVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setTicketVisible(false)} hitSlop={12}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Contact Support</Text>
              <Pressable onPress={submitTicket} hitSlop={12}>
                <Text style={styles.sendBtn}>Send</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput
                style={styles.subjectInput}
                placeholder="Brief description of your issue"
                placeholderTextColor={ThemeColor.PLACEHOLDER ?? '#aaa'}
                value={subject}
                onChangeText={setSubject}
                returnKeyType="next"
                maxLength={120}
              />

              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Describe what happened, steps to reproduce, or what you need help with..."
                placeholderTextColor={ThemeColor.PLACEHOLDER ?? '#aaa'}
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />

              <Text style={styles.hint}>
                Tapping Send will open your email app with this ticket pre-filled.
                Replies will go to your account email.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}



const cardShadow = Platform.select({
  ios: {
    shadowColor: ThemeColor.SHADOW_SLATE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ThemeColor.SCREEN_BG,
  },
  container: {
    padding: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: ThemeColor.BRAND,
    marginBottom: 20,
  },
  section: {
    gap: 12,
  },
  card: {
    width: '100%',
    minHeight: 80,
    borderRadius: ThemeRadius.MD,
    backgroundColor: ThemeColor.WHITE,
    borderWidth: 1,
    borderColor: ThemeColor.INPUT_BORDER_SOFT,
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...cardShadow,
  },
  cardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: ThemeColor.HOME_CARD_TEXT,
  },
  dangerText: {
    color: 'red',
  },
  arrow: {
    fontSize: 22,
    color: ThemeColor.HOME_CARD_TEXT,
  },
  cardPressed: {
    opacity: 0.85,
  },

  // ── Support ticket modal ──
  modalWrap: {
    flex: 1,
    backgroundColor: ThemeColor.SCREEN_BG,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColor.INPUT_BORDER_SOFT,
    backgroundColor: ThemeColor.WHITE,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ThemeColor.HOME_CARD_TEXT,
  },
  cancelBtn: {
    fontSize: 16,
    color: '#888',
  },
  sendBtn: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColor.BRAND,
  },
  modalBody: {
    padding: 20,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  subjectInput: {
    backgroundColor: ThemeColor.WHITE,
    borderWidth: 1,
    borderColor: ThemeColor.INPUT_BORDER_SOFT,
    borderRadius: ThemeRadius.MD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: ThemeColor.HOME_CARD_TEXT,
  },
  messageInput: {
    backgroundColor: ThemeColor.WHITE,
    borderWidth: 1,
    borderColor: ThemeColor.INPUT_BORDER_SOFT,
    borderRadius: ThemeRadius.MD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: ThemeColor.HOME_CARD_TEXT,
    minHeight: 180,
  },
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
});




/*Previous profile button code:
        <View style={styles.accountWrap}>
          <Pressable
            onPress={() => setShowAccountMenu((v) => !v)}
            style={({ pressed }) => [styles.accountBtn, pressed && styles.topBtnPressed]}
            hitSlop={10}
          >
            <Ionicons name="person-circle-outline" size={34} color={ThemeColor.BRAND} />
          </Pressable>
          {showAccountMenu && (
            <View style={styles.accountMenu}>
              <Pressable
                onPress={handleSettings}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              >
                <Text style={styles.menuItemText}>{t('cardSettingsTitle')}</Text>
              </Pressable>
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              >
                <Text style={styles.menuItemText}>{t('logOut')}</Text>
              </Pressable>
            </View>
          )}
        </View>


*/

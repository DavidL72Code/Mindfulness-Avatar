import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { updateEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { LanguageChips, LANGUAGE_OPTIONS } from '../components/LanguageSelector';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';

function snapshotExists(snap) {
  return typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists);
}

function resolveNameFields(data, user) {
  let first = typeof data?.firstName === 'string' ? data.firstName.trim() : '';
  let last = typeof data?.lastName === 'string' ? data.lastName.trim() : '';
  if (!first && !last) {
    const full = (
      (typeof data?.fullName === 'string' ? data.fullName : '') ||
      user?.displayName ||
      ''
    ).trim();
    if (full) {
      const parts = full.split(/\s+/);
      first = parts[0] || '';
      last = parts.slice(1).join(' ') || '';
    }
  }
  return { first, last };
}

function normalizeDateOfBirth(value) {
  if (typeof value === 'string') return value.trim().slice(0, 10);
  const date = value?.toDate?.();
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function isValidDateOfBirth(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const today = new Date().toISOString().slice(0, 10);
  return value >= '1900-01-01' && value <= today;
}

export default function PersonalInformationScreen({ navigation }) {
  const { t, setLocale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [languagePreference, setLanguagePreference] = useState(
    'en',
  );

  const loadProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snapshotExists(snap) ? snap.data() : {};
      const { first, last } = resolveNameFields(data, user);
      setFirstName(first);
      setLastName(last);
      setDateOfBirth(normalizeDateOfBirth(data.dateOfBirth || data.dob));
      setEmail(
        (typeof data.email === 'string' && data.email.trim()) ||
          user.email ||
          '',
      );
      const pref = data.languagePreference;
      setLanguagePreference(LANGUAGE_OPTIONS.some((option) => option.code === pref) ? pref : 'en');
    } catch {
      const { first, last } = resolveNameFields({}, user);
      setFirstName(first);
      setLastName(last);
      setEmail(user.email || '');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleSave = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedDateOfBirth = dateOfBirth.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedEmail) {
      Alert.alert(t('errorTitle'), t('errorFillAll'));
      return;
    }

    if (!isValidDateOfBirth(trimmedDateOfBirth)) {
      Alert.alert(t('errorTitle'), t('personalInfoInvalidDob'));
      return;
    }

    setSaving(true);
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          firstName: trimmedFirst,
          lastName: trimmedLast,
          fullName,
          dateOfBirth: trimmedDateOfBirth,
          email: trimmedEmail,
          languagePreference,
          locale: languagePreference,
        },
        { merge: true },
      );

      await updateProfile(user, { displayName: fullName });

      if (trimmedEmail !== (user.email || '')) {
        try {
          await updateEmail(user, trimmedEmail);
        } catch {
          Alert.alert(t('personalInfoEmailNotUpdatedTitle'), t('personalInfoEmailNotUpdatedBody'));
        }
      }

      await setLocale(languagePreference);
      Alert.alert(t('personalInfoSavedTitle'), t('personalInfoSavedBody'));
      navigation.goBack();
    } catch (error) {
      const isPermission =
        error?.code === 'permission-denied' ||
        /missing or insufficient permissions/i.test(String(error?.message || ''));
      Alert.alert(
        t('personalInfoSaveFailedTitle'),
        isPermission
          ? t('signUpFirestorePermissionDenied')
          : error?.message || t('personalInfoSaveFailedBody'),
      );
    } finally {
      setSaving(false);
    }
  }, [
    firstName,
    lastName,
    dateOfBirth,
    email,
    languagePreference,
    navigation,
    setLocale,
    t,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('personalInfoBack')}
        >
          <Ionicons name="chevron-back" size={22} color={ThemeColor.BRAND} />
          <Text style={styles.backBtnText}>{t('personalInfoBack')}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ThemeColor.BRAND} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('personalInformation')}</Text>

          <Text style={styles.label}>{t('firstName')}</Text>
          <View style={styles.inputShell}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              accessibilityLabel={t('firstName')}
              editable={!saving}
              placeholder={t('firstName')}
              placeholderTextColor={ThemeColor.PLACEHOLDER}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.inputInner}
            />
          </View>

          <Text style={styles.label}>{t('lastName')}</Text>
          <View style={styles.inputShell}>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              accessibilityLabel={t('lastName')}
              editable={!saving}
              placeholder={t('lastName')}
              placeholderTextColor={ThemeColor.PLACEHOLDER}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.inputInner}
            />
          </View>

          <Text style={styles.label}>{t('dateOfBirth')}</Text>
          <View style={styles.inputShell}>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              accessibilityLabel={t('dateOfBirth')}
              editable={!saving}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={ThemeColor.PLACEHOLDER}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
              inputMode="numeric"
              maxLength={10}
              style={styles.inputInner}
            />
          </View>

          <Text style={styles.label}>{t('email')}</Text>
          <View style={styles.inputShell}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              accessibilityLabel={t('email')}
              editable={!saving}
              placeholder={t('email')}
              placeholderTextColor={ThemeColor.PLACEHOLDER}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              style={styles.inputInner}
            />
          </View>

          <Text style={styles.label}>{t('languageLabel')}</Text>
          <LanguageChips value={languagePreference} onChange={setLanguagePreference} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('personalInfoSave')}
            accessibilityState={{ disabled: saving, busy: saving }}
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              (pressed || saving) && styles.saveBtnPressed,
              saving && styles.saveBtnDisabled,
            ]}
          >
            <Text style={styles.saveBtnText}>
              {saving ? t('personalInfoSaving') : t('personalInfoSave')}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ThemeColor.SCREEN_BG,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: ThemeColor.BRAND,
    backgroundColor: ThemeColor.WHITE,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  backBtnText: {
    color: ThemeColor.BRAND,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ThemeColor.TEXT_MUTED,
    marginBottom: 6,
    marginTop: 4,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColor.WHITE,
    borderWidth: 1,
    borderColor: ThemeColor.INPUT_BORDER,
    borderRadius: ThemeRadius.SM,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 12,
  },
  inputInner: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: ThemeColor.TEXT_PRIMARY,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  langChip: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: ThemeRadius.SM,
    borderWidth: 1.5,
    borderColor: ThemeColor.INPUT_BORDER,
    backgroundColor: ThemeColor.WHITE,
    alignItems: 'center',
  },
  langChipSelected: {
    borderColor: ThemeColor.BRAND,
    backgroundColor: '#e8edf7',
  },
  langChipPressed: {
    opacity: 0.85,
  },
  langChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: ThemeColor.TEXT_MUTED,
  },
  langChipTextSelected: {
    color: ThemeColor.BRAND,
    fontWeight: '700',
  },
  saveBtn: {
    minHeight: 48,
    backgroundColor: ThemeColor.BRAND,
    borderRadius: ThemeRadius.SM,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnPressed: {
    opacity: 0.9,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: ThemeColor.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});

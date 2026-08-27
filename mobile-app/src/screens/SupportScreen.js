import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';

const FORM_ENDPOINT = String(process.env.EXPO_PUBLIC_SUPPORT_FORM_ENDPOINT || '').trim();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupportScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submitSupport = async () => {
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    };
    if (!payload.firstName || !payload.lastName || !payload.email || !payload.message) {
      Alert.alert(t('supportMissingTitle'), t('supportMissingBody'));
      return;
    }
    if (!EMAIL_PATTERN.test(payload.email)) {
      Alert.alert(t('supportInvalidEmailTitle'), t('supportInvalidEmailBody'));
      return;
    }
    if (!FORM_ENDPOINT.startsWith('https://')) {
      Alert.alert(t('supportUnavailableTitle'), t('supportUnavailableBody'));
      return;
    }

    try {
      setSending(true);

      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert(t('supportSentTitle'), t('supportSentBody'));

        setFirstName('');
        setLastName('');
        setEmail('');
        setMessage('');
      } else {
        Alert.alert(t('supportErrorTitle'), t('supportErrorBody'));
      }
    } catch {
      Alert.alert(t('supportErrorTitle'), t('supportErrorBody'));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      <ScrollView contentContainerStyle={styles.container}>

        {/* TOP BAR (Language + Back) */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← {t('back') || 'Back'}</Text>
          </TouchableOpacity>


        </View>

        {/* TITLE */}
        <Text style={styles.title}>
          {t('support') || 'Support'}
        </Text>

        {/* FORM */}
        <View style={styles.card}>

          <Text style={styles.label}>{t('supportFirstName')} / {t('supportLastName')}*</Text>

          <View style={styles.row}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('supportFirstName')}
              accessibilityLabel={t('supportFirstName')}
              autoComplete="given-name"
              maxLength={60}
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.half]}
            />

            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('supportLastName')}
              accessibilityLabel={t('supportLastName')}
              autoComplete="family-name"
              maxLength={60}
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.half]}
            />
          </View>

          <Text style={styles.label}>{t('supportEmail')}*</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="abc@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel={t('supportEmail')}
            maxLength={254}
            style={styles.input}
          />

          <Text style={styles.label}>{t('supportMessage')}*</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('supportMessagePlaceholder')}
            accessibilityLabel={t('supportMessage')}
            maxLength={4000}
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            style={styles.message}
          />

          <TouchableOpacity
            onPress={submitSupport}
            disabled={sending}
            accessibilityRole="button"
            accessibilityState={{ disabled: sending, busy: sending }}
            accessibilityLabel={sending ? t('supportSending') : t('supportSend')}
            style={[styles.button, sending && { opacity: 0.6 }]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('supportSend')}</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  container: {
    padding: 16,
    paddingBottom: 80,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f3c88',
  },

  langBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e8edf7',
  },

  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f3c88',
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1f3c88',
    marginBottom: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    color: '#0f172a',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  half: {
    width: '48%',
  },

  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe2ea',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
  },

  message: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe2ea',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    color: '#0f172a',
  },

  button: {
    marginTop: 16,
    backgroundColor: '#1f3c88',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AccessibilityInfo,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { ThemeColor, ThemeRadius } from '../theme/appTheme';
import { useLanguage } from '../context/LanguageContext';
import { PRIVACY_POLICY_URL } from '../config/legalConfig';

function ActionRow({ icon, label, detail, onPress, danger = false }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
    >
      <View style={[styles.actionIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={20} color={danger ? '#a33a3a' : ThemeColor.BRAND} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, danger && styles.dangerText]}>{label}</Text>
        {detail ? <Text style={styles.actionDetail}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={19} color={ThemeColor.TEXT_MUTED} />
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const privacyEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      privacyEntrance.setValue(1);
      return undefined;
    }
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      delay: 70,
      useNativeDriver: true,
    }).start();
    Animated.timing(privacyEntrance, {
      toValue: 1,
      duration: 360,
      delay: 180,
      useNativeDriver: true,
    }).start();
    return undefined;
  }, [entrance, privacyEntrance, reduceMotion]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return undefined;
    return onSnapshot(doc(db, 'users', uid), (snapshot) => {
      setProfile(snapshot.exists() ? snapshot.data() : null);
    });
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(t('signOutTitle'), t('signOutBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOutConfirm'), style: 'destructive', onPress: () => signOut(auth) },
    ]);
  }, [t]);

  const name = profile?.fullName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const email = auth.currentUser?.email || profile?.email || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>{t('accountEyebrow')}</Text>
        <Text style={styles.title}>{t('profileTitle') || 'Profile'}</Text>

        <Animated.View
          style={[styles.identityCard, {
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }]}
        >
          <View style={styles.avatar}><Text style={styles.avatarText}>{(name || email).slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>{name || 'Your account'}</Text>
            <Text style={styles.identityEmail}>{email || t('signedInAccount')}</Text>
            <View style={styles.privatePill}>
              <Ionicons name="lock-closed" size={12} color="#2d6b62" />
              <Text style={styles.privateText}>{t('privateToAccount')}</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.sectionLabel}>{t('accountSection')}</Text>
        <View style={styles.actionGroup}>
          <ActionRow icon="person-outline" label={t('personalInformation')} detail={t('personalInfoDetail')} onPress={() => navigation.navigate('PersonalInfo')} />
          <ActionRow icon="help-circle-outline" label={t('support')} detail={t('supportDetail')} onPress={() => navigation.navigate('Support')} />
        </View>

        <Text style={styles.sectionLabel}>{t('privacySection')}</Text>
        <Animated.View
          style={[styles.privacyCard, {
            opacity: privacyEntrance,
            transform: [{ translateY: privacyEntrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }]}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#2d6b62" />
          <View style={styles.privacyCopy}>
            <Text style={styles.privacyTitle}>{t('privateToAccount')}</Text>
            <Text style={styles.privacyBody}>{t('accountDataScope')}</Text>
          </View>
        </Animated.View>

        <View style={styles.actionGroup}>
          <ActionRow icon="document-text-outline" label={t('privacyPolicy')} detail={t('privacyPolicyDetail')} onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} />
          <ActionRow icon="log-out-outline" label={t('logOut')} detail={t('signOutDetail')} danger onPress={handleLogout} />
          <ActionRow icon="trash-outline" label={t('deleteAccountTitle')} detail={t('deleteAccountDetail')} danger onPress={() => navigation.navigate('DeleteAccount')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ThemeColor.SCREEN_BG },
  container: { padding: 24, paddingBottom: 44, maxWidth: 520, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#2d6b62', fontSize: 11, letterSpacing: 1.8, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: '#162846', marginBottom: 20 },
  identityCard: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#eaf2ef', borderRadius: ThemeRadius.MD, marginBottom: 30 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2d6b62', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 25, fontWeight: '800' },
  identityCopy: { flex: 1, marginLeft: 14 },
  identityName: { color: '#162846', fontSize: 18, fontWeight: '800' },
  identityEmail: { color: '#526477', fontSize: 13, marginTop: 3 },
  privatePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 9, gap: 5 },
  privateText: { color: '#2d6b62', fontSize: 11, fontWeight: '700' },
  sectionLabel: { color: '#526477', fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase', fontWeight: '800', marginBottom: 9 },
  actionGroup: { backgroundColor: '#fff', borderRadius: ThemeRadius.MD, overflow: 'hidden', marginBottom: 26, borderWidth: 1, borderColor: '#e1e7ed' },
  actionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#edf0f3' },
  pressed: { backgroundColor: '#f5f8f8' },
  actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#edf3fb' },
  dangerIcon: { backgroundColor: '#fff0f0' },
  actionCopy: { flex: 1, marginHorizontal: 12 },
  actionLabel: { color: '#162846', fontSize: 15, fontWeight: '750' },
  actionDetail: { color: '#7a849c', fontSize: 12, marginTop: 3 },
  dangerText: { color: '#a33a3a' },
  privacyCard: { flexDirection: 'row', padding: 16, backgroundColor: '#f3f8f5', borderWidth: 1, borderColor: '#dcebe3', borderRadius: ThemeRadius.MD, marginBottom: 26 },
  privacyCopy: { flex: 1, marginLeft: 12 },
  privacyTitle: { color: '#245449', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  privacyBody: { color: '#5c746e', fontSize: 12, lineHeight: 18, marginTop: 4 },
});

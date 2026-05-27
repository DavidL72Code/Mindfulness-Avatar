import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_ME_KEY = 'auth.rememberMe';

export async function getRememberMePreference() {
  try {
    return (await AsyncStorage.getItem(REMEMBER_ME_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setRememberMePreference(value) {
  try {
    await AsyncStorage.setItem(REMEMBER_ME_KEY, value ? 'true' : 'false');
  } catch {
    // Ignore storage failures and fall back to requiring sign-in next launch.
  }
}

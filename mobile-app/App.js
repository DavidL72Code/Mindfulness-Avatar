import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import SessionTracker from './src/components/SessionTracker';
import { auth } from './src/config/firebaseConfig';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PersonalInformationScreen from './src/screens/PersonalInformationScreen';
import StatsScreen from './src/screens/StatsScreen';
import SupportScreen from './src/screens/SupportScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="PersonalInfo" component={PersonalInformationScreen} />
      <ProfileStack.Screen name="Support" component={SupportScreen} />
      <ProfileStack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </ProfileStack.Navigator>
  );
}

function TabNavigator() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      backBehavior="none"
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
        tabBarActiveTintColor: '#6760d4',
        tabBarInactiveTintColor: '#817b94',
        tabBarStyle: {
          height: 76,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: '#e3dff1',
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('homeTab'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="My Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: t('myStatsTab'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: t('profileTab'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function LocalizedNavigation({ user }) {
  const { locale } = useLanguage();
  return (
    <View style={{ flex: 1, direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
      <NavigationContainer>
        <Stack.Navigator>
          {user ? (
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          ) : (
            <>
              <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
              <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <SessionTracker />
    </View>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const currentUser = auth.currentUser;
      if (nextState !== 'active' || !currentUser) return;
      currentUser.reload().catch(async (error) => {
        if (error?.code !== 'auth/user-not-found' && error?.code !== 'auth/user-token-expired') return;
        await AsyncStorage.removeItem(`mindfulness-moods-${currentUser.uid}`).catch(() => {});
        await signOut(auth).catch(() => {});
      });
    });
    return () => subscription.remove();
  }, []);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <LocalizedNavigation user={user} />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

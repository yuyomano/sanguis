import React, { useEffect } from 'react'
import { createStaticNavigation, StaticParamList } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialIcons } from '@expo/vector-icons'
import { ActivityIndicator, View } from 'react-native'

import { useAuthStore } from '../store/authStore'
import { useDonorStore } from '../store/donorStore'
import { syncFcmToken } from '../services/notifications'
import { Colors } from '../theme/colors'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import HomeScreen from '../screens/home/HomeScreen'
import DonationsScreen from '../screens/donations/DonationsScreen'
import EventsScreen from '../screens/events/EventsScreen'
import EventDetailScreen from '../screens/events/EventDetailScreen'
import BookAppointmentScreen from '../screens/events/BookAppointmentScreen'
import RewardsScreen from '../screens/rewards/RewardsScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'
import NotificationsScreen from '../screens/notifications/NotificationsScreen'
import SettingsScreen from '../screens/settings/SettingsScreen'
import BloodTrackerScreen from '../screens/tracker/BloodTrackerScreen'
import TestResultsScreen from '../screens/test-results/TestResultsScreen'

function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
      <ActivityIndicator size="large" color={Colors.blood} />
    </View>
  )
}

// Grupos condicionales de la Static API (v7): cada `if` es un hook que el
// navigator evalúa en cada render para decidir qué pantallas están activas.
const useIsRestoring = () => !useAuthStore((s) => s.isRestored)
const useIsSignedIn = () => useAuthStore((s) => s.isRestored && !!s.token)
const useIsSignedOut = () => useAuthStore((s) => s.isRestored && !s.token)

const Tabs = createBottomTabNavigator({
  screenOptions: ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: Colors.blood,
    tabBarInactiveTintColor: Colors.textSecondary,
    tabBarStyle: { borderTopColor: Colors.border, backgroundColor: Colors.white },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    tabBarIcon: ({ color, size }: { color: string; size: number }) => {
      const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
        Home: 'home',
        Donations: 'water-drop',
        Events: 'event',
        Rewards: 'card-giftcard',
        Profile: 'person',
      }
      return <MaterialIcons name={icons[route.name]} size={size} color={color} />
    },
  }),
  screens: {
    Home: { screen: HomeScreen, options: { tabBarLabel: 'Inicio' } },
    Donations: { screen: DonationsScreen, options: { tabBarLabel: 'Donaciones' } },
    Events: { screen: EventsScreen, options: { tabBarLabel: 'Eventos' } },
    Rewards: { screen: RewardsScreen, options: { tabBarLabel: 'Premios' } },
    Profile: { screen: ProfileScreen, options: { tabBarLabel: 'Perfil' } },
  },
})

const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Splash: { if: useIsRestoring, screen: SplashScreen },
    Login: { if: useIsSignedOut, screen: LoginScreen },
    Register: { if: useIsSignedOut, screen: RegisterScreen },
    MainTabs: { if: useIsSignedIn, screen: Tabs },
    EventDetail: {
      if: useIsSignedIn,
      screen: EventDetailScreen,
      options: { headerShown: true, headerTitle: '', headerBackTitle: 'Eventos', headerTintColor: Colors.blood },
    },
    BookAppointment: {
      if: useIsSignedIn,
      screen: BookAppointmentScreen,
      options: { headerShown: true, headerTitle: 'Reservar cita', headerBackTitle: 'Atrás', headerTintColor: Colors.blood },
    },
    Notifications: {
      if: useIsSignedIn,
      screen: NotificationsScreen,
      options: { headerShown: true, headerTitle: 'Notificaciones', headerTintColor: Colors.blood },
    },
    Settings: {
      if: useIsSignedIn,
      screen: SettingsScreen,
      options: { headerShown: true, headerTitle: 'Configuración', headerTintColor: Colors.blood },
    },
    TestResults: {
      if: useIsSignedIn,
      screen: TestResultsScreen,
      options: { headerShown: true, headerTitle: 'Resultados', headerTintColor: Colors.blood },
    },
    BloodTracker: {
      if: useIsSignedIn,
      screen: BloodTrackerScreen,
      options: { headerShown: true, headerTitle: 'Rastrear mi sangre', headerTintColor: Colors.blood },
    },
  },
})

// Fuente de verdad de los param lists: derivados de la config estática en
// lugar de escritos a mano (types.ts los reexporta para las pantallas).
export type RootStackParamList = StaticParamList<typeof RootStack>
export type TabParamList = StaticParamList<typeof Tabs>

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Navigation = createStaticNavigation(RootStack)

export default function AppNavigator() {
  const { token, restoreSession } = useAuthStore()
  const { fetchProfile } = useDonorStore()

  useEffect(() => { restoreSession() }, [])

  useEffect(() => {
    if (token) {
      fetchProfile()
      syncFcmToken()
    }
  }, [token])

  return <Navigation />
}

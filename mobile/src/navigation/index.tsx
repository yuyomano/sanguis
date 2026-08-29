import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialIcons } from '@expo/vector-icons'
import { ActivityIndicator, View } from 'react-native'

import { useAuthStore } from '../store/authStore'
import { useDonorStore } from '../store/donorStore'
import { syncFcmToken } from '../services/notifications'
import { Colors } from '../theme/colors'
import { RootStackParamList, TabParamList } from '../types'

import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import HomeScreen from '../screens/home/HomeScreen'
import DonationsScreen from '../screens/donations/DonationsScreen'
import EventsScreen from '../screens/events/EventsScreen'
import EventDetailScreen from '../screens/events/EventDetailScreen'
import RewardsScreen from '../screens/rewards/RewardsScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'
import NotificationsScreen from '../screens/notifications/NotificationsScreen'
import SettingsScreen from '../screens/settings/SettingsScreen'
import BloodTrackerScreen from '../screens/tracker/BloodTrackerScreen'
import TestResultsScreen from '../screens/test-results/TestResultsScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.blood,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: { borderTopColor: Colors.border, backgroundColor: Colors.white },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
            Home: 'home',
            Donations: 'water-drop',
            Events: 'event',
            Rewards: 'card-giftcard',
            Profile: 'person',
          }
          return <MaterialIcons name={icons[route.name]} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Donations" component={DonationsScreen} options={{ tabBarLabel: 'Donaciones' }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarLabel: 'Eventos' }} />
      <Tab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarLabel: 'Premios' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const { token, isRestored, restoreSession } = useAuthStore()
  const { fetchProfile } = useDonorStore()

  useEffect(() => { restoreSession() }, [])

  useEffect(() => {
    if (token) {
      fetchProfile()
      syncFcmToken()
    }
  }, [token])

  if (!isRestored) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.blood} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen}
              options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Eventos', headerTintColor: Colors.blood }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen}
              options={{ headerShown: true, headerTitle: 'Notificaciones', headerTintColor: Colors.blood }} />
            <Stack.Screen name="Settings" component={SettingsScreen}
              options={{ headerShown: true, headerTitle: 'Configuración', headerTintColor: Colors.blood }} />
            <Stack.Screen name="TestResults" component={TestResultsScreen}
              options={{ headerShown: true, headerTitle: 'Resultados', headerTintColor: Colors.blood }} />
            <Stack.Screen name="BloodTracker" component={BloodTrackerScreen}
              options={{ headerShown: true, headerTitle: 'Rastrear mi Sangre', headerTintColor: Colors.blood }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

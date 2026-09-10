import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { api } from './api'

const isExpoGo = Constants.appOwnership === 'expo'

export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications not supported in Expo Go since SDK 53
  if (isExpoGo) return null
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const token = await Notifications.getDevicePushTokenAsync()
  return token.data
}

export async function syncFcmToken(): Promise<void> {
  try {
    const token = await registerForPushNotifications()
    if (token) {
      await api.patch('/donors/me/fcm-token', { fcmToken: token })
    }
  } catch {
    // silently fail — never block app startup
  }
}

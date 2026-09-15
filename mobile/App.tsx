import React from 'react'
import { registerRootComponent } from 'expo'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import AppNavigator from './src/navigation'

// expo-notifications ya no está disponible en Expo Go desde el SDK 53 (requiere development build).
// El require debe quedar dentro del if: importarlo estáticamente ya dispara requireNativeModule
// al evaluar el módulo, sin importar si luego se llama o no a setNotificationHandler.
if (Constants.appOwnership !== 'expo') {
  const Notifications = require('expo-notifications') as typeof import('expo-notifications')
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  )
}

export default registerRootComponent(App)

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../../store/authStore'
import { useDonorStore } from '../../store/donorStore'
import { Colors } from '../../theme/colors'
import { BLOOD_LABELS, RootStackParamList } from '../../types'

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>

const CATEGORY_LABELS = { CASUAL: 'Casual', RECURRENT: 'Recurrente', VIP: 'VIP' }

export default function ProfileScreen({ navigation }: Props) {
  const { logout } = useAuthStore()
  const { profile, updateLocation } = useDonorStore()
  const [updatingLocation, setUpdatingLocation] = useState(false)

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ])
  }

  async function handleUpdateLocation() {
    setUpdatingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Activa el permiso de ubicación para usar esta función.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({})
      const [place] = await Location.reverseGeocodeAsync(pos.coords)
      await updateLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        city: place?.city || place?.subregion || undefined,
        address: [place?.street, place?.name].filter(Boolean).join(' ') || undefined,
      })
    } catch {
      Alert.alert('Error', 'No se pudo actualizar tu ubicación.')
    } finally {
      setUpdatingLocation(false)
    }
  }

  const menuItems = [
    { icon: 'science' as const, label: 'Resultados de laboratorio', screen: 'TestResults' as const },
    { icon: 'water-drop' as const, label: 'Rastrear mi sangre', screen: 'BloodTracker' as const },
    { icon: 'notifications' as const, label: 'Notificaciones', screen: 'Notifications' as const },
    { icon: 'settings' as const, label: 'Configuración', screen: 'Settings' as const },
  ]

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{profile?.name?.[0] ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? '—'}</Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile ? BLOOD_LABELS[profile.bloodType] : '—'}</Text>
          </View>
          <View style={[styles.badge, styles.categoryBadge]}>
            <Text style={[styles.badgeText, styles.categoryText]}>
              {CATEGORY_LABELS[profile?.category ?? 'CASUAL']}
            </Text>
          </View>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        {[
          { label: 'Correo', value: profile?.email },
          { label: 'Teléfono', value: profile?.phone },
          { label: 'Cédula', value: profile?.idNumber },
          { label: 'Puntos', value: profile?.pointsBalance?.toLocaleString() ?? '0' },
          { label: 'Ciudad', value: profile?.city },
        ].map(({ label, value }) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value ?? '—'}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.locationBtn} onPress={handleUpdateLocation} disabled={updatingLocation}>
          {updatingLocation
            ? <ActivityIndicator color={Colors.blood} size="small" />
            : <Text style={styles.locationBtnText}>
                {profile?.city ? 'Actualizar mi ubicación' : 'Agregar mi ubicación'}
              </Text>}
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map(({ icon, label, screen }) => (
          <TouchableOpacity
            key={screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(screen as any)}
          >
            <View style={styles.menuIconWrap}>
              <MaterialIcons name={icon} size={20} color={Colors.blood} />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <MaterialIcons name="logout" size={18} color={Colors.blood} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: Colors.blood, alignItems: 'center', paddingTop: 56, paddingBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: Colors.white },
  name: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 8 },
  badge: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.15)' },
  categoryText: { fontSize: 13 },
  card: {
    backgroundColor: Colors.white, margin: 16, borderRadius: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  locationBtn: { paddingVertical: 12, alignItems: 'center' },
  locationBtnText: { fontSize: 14, fontWeight: '600', color: Colors.blood },
  menu: {
    backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 4, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bloodLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, marginHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.bloodLight, borderRadius: 12,
  },
  logoutText: { color: Colors.blood, fontWeight: '700', fontSize: 15 },
})

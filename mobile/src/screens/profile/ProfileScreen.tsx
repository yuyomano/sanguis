import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore'
import { useDonorStore } from '../../store/donorStore'
import { Colors } from '../../theme/colors'
import { BLOOD_LABELS } from '../../types'

const CATEGORY_LABELS = { CASUAL: 'Casual', RECURRENT: 'Recurrente', VIP: 'VIP' }
const ID_TYPE_LABELS = { CEDULA: 'Cédula', PASSPORT: 'Pasaporte' }

export default function ProfileScreen() {
  const navigation = useNavigation()
  const { logout } = useAuthStore()
  const { profile, updateLocation, updateIdNumber } = useDonorStore()
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const [editingId, setEditingId] = useState(false)
  const [idTypeInput, setIdTypeInput] = useState<'CEDULA' | 'PASSPORT'>('CEDULA')
  const [idNumberInput, setIdNumberInput] = useState('')
  const [savingId, setSavingId] = useState(false)

  async function handleSaveId() {
    if (!idNumberInput.trim()) return
    setSavingId(true)
    try {
      await updateIdNumber({ idType: idTypeInput, idNumber: idNumberInput.trim() })
      setEditingId(false)
      setIdNumberInput('')
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'No se pudo guardar tu identificación')
    } finally {
      setSavingId(false)
    }
  }

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
          { label: 'Puntos', value: profile?.pointsBalance?.toLocaleString() ?? '0' },
          { label: 'Ciudad', value: profile?.city },
        ].map(({ label, value }) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value ?? '—'}</Text>
          </View>
        ))}

        {editingId ? (
          <View style={styles.idEditRow}>
            <View style={styles.idTypeToggle}>
              {(['CEDULA', 'PASSPORT'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.idTypeChip, idTypeInput === t && styles.idTypeChipActive]}
                  onPress={() => setIdTypeInput(t)}
                >
                  <Text style={[styles.idTypeChipText, idTypeInput === t && styles.idTypeChipTextActive]}>
                    {ID_TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.idInput}
              value={idNumberInput}
              onChangeText={setIdNumberInput}
              placeholder="Número de identificación"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.idEditActions}>
              <TouchableOpacity onPress={() => setEditingId(false)} style={styles.idCancelBtn}>
                <Text style={styles.idCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveId} style={styles.idSaveBtn} disabled={savingId}>
                {savingId
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.idSaveBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.infoRow} onPress={() => setEditingId(true)}>
            <Text style={styles.infoLabel}>{profile?.idNumber ? (ID_TYPE_LABELS[profile.idType!] ?? 'Identificación') : 'Identificación'}</Text>
            {profile?.idNumber ? (
              <Text style={styles.infoValue}>{profile.idNumber}</Text>
            ) : (
              <Text style={[styles.infoValue, styles.idMissing]}>Agregar (necesaria para ganar puntos)</Text>
            )}
          </TouchableOpacity>
        )}

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
  idMissing: { color: Colors.blood, fontWeight: '700' },
  idEditRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  idTypeToggle: { flexDirection: 'row', gap: 8 },
  idTypeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.bloodLight },
  idTypeChipActive: { backgroundColor: Colors.blood },
  idTypeChipText: { fontSize: 13, fontWeight: '600', color: Colors.blood },
  idTypeChipTextActive: { color: Colors.white },
  idInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text,
  },
  idEditActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  idCancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  idCancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  idSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.blood, minWidth: 72, alignItems: 'center' },
  idSaveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
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

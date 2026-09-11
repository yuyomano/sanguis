import React, { useEffect, useState } from 'react'
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useDonorStore } from '../../store/donorStore'
import { Colors } from '../../theme/colors'

export default function SettingsScreen() {
  const { logout } = useAuthStore()
  const { profile } = useDonorStore()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [shareHistory, setShareHistory] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [savingShareHistory, setSavingShareHistory] = useState(false)

  // ponytail: sincroniza desde el perfil cuando llega/cambia (fetchProfile corre en otras pantallas)
  useEffect(() => {
    if (!profile) return
    setNotificationsEnabled(profile.notificationsEnabled)
    setShareHistory(profile.shareHistoryWithInstitutions)
  }, [profile])

  async function toggleNotifications(value: boolean) {
    setNotificationsEnabled(value)
    try {
      setSavingNotifications(true)
      await api.patch('/donors/me/notifications', { notificationsEnabled: value })
    } catch {
      setNotificationsEnabled(!value)
      Alert.alert('Error', 'No se pudo guardar la preferencia')
    } finally { setSavingNotifications(false) }
  }

  async function toggleShareHistory(value: boolean) {
    setShareHistory(value)
    try {
      setSavingShareHistory(true)
      await api.patch('/donors/me/consent', { shareHistoryWithInstitutions: value })
    } catch {
      setShareHistory(!value)
      Alert.alert('Error', 'No se pudo guardar la preferencia')
    } finally { setSavingShareHistory(false) }
  }

  const rows = [
    {
      section: 'Notificaciones',
      hint: 'Las alertas de emergencia siempre se envían, incluso si desactivas esto.',
      items: [
        {
          icon: 'notifications' as const,
          label: 'Recibir notificaciones de eventos',
          right: savingNotifications
            ? <ActivityIndicator size="small" color={Colors.blood} />
            : <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                thumbColor={Colors.white}
                trackColor={{ false: Colors.border, true: Colors.blood }}
              />,
        },
      ],
    },
    {
      section: 'Privacidad',
      hint: undefined as string | undefined,
      items: [
        {
          icon: 'share' as const,
          label: 'Compartir mi historial con instituciones externas',
          right: savingShareHistory
            ? <ActivityIndicator size="small" color={Colors.blood} />
            : <Switch
                value={shareHistory}
                onValueChange={toggleShareHistory}
                thumbColor={Colors.white}
                trackColor={{ false: Colors.border, true: Colors.blood }}
              />,
        },
      ],
    },
    {
      section: 'Cuenta',
      hint: undefined as string | undefined,
      items: [
        {
          icon: 'person' as const,
          label: 'Nombre',
          right: <Text style={styles.rightText}>{profile?.name ?? '—'}</Text>,
        },
        {
          icon: 'email' as const,
          label: 'Correo',
          right: <Text style={styles.rightText} numberOfLines={1}>{profile?.email ?? '—'}</Text>,
        },
        {
          icon: 'water-drop' as const,
          label: 'Código de referido',
          right: <Text style={[styles.rightText, { color: Colors.blood, fontWeight: '700' }]}>{profile?.referralCode ?? '—'}</Text>,
        },
      ],
    },
  ]

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {rows.map(({ section, items, hint }) => (
        <View key={section} style={styles.section}>
          <Text style={styles.sectionLabel}>{section}</Text>
          <View style={styles.card}>
            {items.map(({ icon, label, right }, idx) => (
              <View key={label} style={[styles.row, idx < items.length - 1 && styles.rowBorder]}>
                <View style={styles.rowLeft}>
                  <MaterialIcons name={icon} size={18} color={Colors.blood} style={styles.rowIcon} />
                  <Text style={styles.rowLabel}>{label}</Text>
                </View>
                {right}
              </View>
            ))}
          </View>
          {hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sesión</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert('Cerrar sesión', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: logout },
          ])}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="logout" size={18} color={Colors.blood} style={styles.rowIcon} />
              <Text style={[styles.rowLabel, { color: Colors.blood }]}>Cerrar sesión</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>Sanguis v1.0.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 15, color: Colors.text },
  rightText: { fontSize: 14, color: Colors.textSecondary, flexShrink: 1 },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 6, marginLeft: 4 },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 8 },
})

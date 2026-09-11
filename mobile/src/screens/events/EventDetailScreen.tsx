import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { useDonorStore } from '../../store/donorStore'
import { DonationEvent, RootStackParamList, PRODUCT_LABELS } from '../../types'

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>

const APPT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Pendiente', CHECKED_IN: 'Presente', COMPLETED: 'Completada',
}

export default function EventDetailScreen({ route, navigation }: Props) {
  const { id } = route.params
  const [event, setEvent] = useState<DonationEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const { profile, fetchProfile } = useDonorStore()

  useEffect(() => {
    api.get(`/events/public/${id}`)
      .then(r => setEvent(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const myAppointment = profile?.appointments?.find(
    a => a.eventId === id && (a.status === 'SCHEDULED' || a.status === 'CHECKED_IN'),
  )

  function confirmCancel() {
    if (!myAppointment) return
    Alert.alert('Cancelar cita', '¿Seguro que quieres cancelar tu cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
          setCancelling(true)
          try {
            await api.delete(`/events/appointments/${myAppointment.id}`)
            await fetchProfile()
          } catch {
            Alert.alert('Error', 'No se pudo cancelar la cita')
          } finally {
            setCancelling(false)
          }
        },
      },
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  if (!event) {
    return <View style={styles.center}><Text style={styles.errorText}>Evento no encontrado</Text></View>
  }

  const full = event.registeredCount >= event.capacity

  const rows = [
    { icon: 'event' as const, label: 'Inicio', value: new Date(event.startDatetime).toLocaleString('es-DO') },
    { icon: 'event-available' as const, label: 'Fin', value: new Date(event.endDatetime).toLocaleString('es-DO') },
    { icon: 'place' as const, label: 'Dirección', value: event.locationAddress },
    { icon: 'groups' as const, label: 'Cupo', value: `${event.registeredCount} / ${event.capacity} registrados` },
  ]

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="event" size={36} color={Colors.blood} />
        </View>
        <Text style={styles.heroTitle}>{event.name}</Text>
        {event.description ? <Text style={styles.heroDesc}>{event.description}</Text> : null}
      </View>

      <View style={styles.detailsCard}>
        {rows.map(({ icon, label, value }) => value ? (
          <View key={label} style={styles.row}>
            <MaterialIcons name={icon} size={18} color={Colors.blood} style={styles.rowIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          </View>
        ) : null)}
      </View>

      {myAppointment ? (
        <View style={styles.detailsCard}>
          <Text style={styles.apptTitle}>Ya tienes una cita aquí</Text>
          <Text style={styles.apptLine}>
            {new Date(myAppointment.scheduledTime).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
          <Text style={styles.apptLine}>{PRODUCT_LABELS[myAppointment.productType]}</Text>
          <Text style={styles.apptLine}>Estado: {APPT_STATUS_LABELS[myAppointment.status] ?? myAppointment.status}</Text>
          {myAppointment.status === 'SCHEDULED' && (
            <TouchableOpacity style={styles.cancelButton} onPress={confirmCancel} disabled={cancelling}>
              <Text style={styles.cancelButtonText}>{cancelling ? 'Cancelando…' : 'Cancelar cita'}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.bookButton, full && styles.bookButtonDisabled]}
          disabled={full}
          onPress={() => navigation.navigate('BookAppointment', { eventId: event.id, eventName: event.name })}
        >
          <MaterialIcons name="event-available" size={18} color={Colors.white} />
          <Text style={styles.bookButtonText}>{full ? 'Evento lleno' : 'Reservar cita'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.textSecondary },
  heroCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 24,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.bloodLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  heroDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  detailsCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 4, gap: 16,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowIcon: { marginTop: 2 },
  rowLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  rowValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  apptTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  apptLine: { fontSize: 14, color: Colors.textSecondary },
  cancelButton: { marginTop: 4, alignSelf: 'flex-start' },
  cancelButtonText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  bookButton: {
    flexDirection: 'row', gap: 8, backgroundColor: Colors.blood, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
  },
  bookButtonDisabled: { backgroundColor: Colors.textMuted },
  bookButtonText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
})

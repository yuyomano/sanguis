import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { DonationEvent, RootStackParamList } from '../../types'

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>

export default function EventDetailScreen({ route }: Props) {
  const { id } = route.params
  const [event, setEvent] = useState<DonationEvent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/donation-events/${id}`)
      .then(r => setEvent(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  if (!event) {
    return <View style={styles.center}><Text style={styles.errorText}>Evento no encontrado</Text></View>
  }

  const rows = [
    { icon: 'event' as const, label: 'Inicio', value: new Date(event.startDate).toLocaleString('es-DO') },
    { icon: 'event-available' as const, label: 'Fin', value: new Date(event.endDate).toLocaleString('es-DO') },
    { icon: 'location-on' as const, label: 'Lugar', value: event.locationName },
    { icon: 'place' as const, label: 'Dirección', value: event.locationAddress },
    { icon: 'favorite' as const, label: 'Meta de unidades', value: event.targetUnits ? `${event.targetUnits} unidades` : 'Sin meta definida' },
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
})

import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { DonationEvent } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: Colors.blood, ACTIVE: Colors.success, COMPLETED: Colors.textMuted, CANCELLED: Colors.error,
}
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado', ACTIVE: 'Activo', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
}

export default function EventsScreen() {
  const navigation = useNavigation()
  const [events, setEvents] = useState<DonationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const { data } = await api.get('/events/upcoming')
      setEvents(data)
    } catch {} finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos de donación</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.blood} />}
        contentContainerStyle={events.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="event" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No hay eventos disponibles</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EventDetail', { id: item.id, name: item.name })}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.eventName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={14} color={Colors.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>{item.locationAddress}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? Colors.textMuted) + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? Colors.textMuted }]}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <View style={styles.dateRow}>
              <MaterialIcons name="event" size={14} color={Colors.textMuted} />
              <Text style={styles.dateText}>
                {new Date(item.startDatetime).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={styles.unitsText}> · {item.registeredCount}/{item.capacity} registrados</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.blood, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  eventName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 13, color: Colors.textSecondary },
  unitsText: { fontSize: 13, color: Colors.textSecondary },
})

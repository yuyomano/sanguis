import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { BloodUnit, BLOOD_LABELS } from '../../types'

const STATUS_INFO: Record<string, { label: string; color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  AVAILABLE: { label: 'Disponible en banco', color: '#059669', icon: 'local-hospital' },
  QUARANTINE: { label: 'En cuarentena', color: '#D97706', icon: 'hourglass-empty' },
  USED: { label: 'Utilizada', color: '#0891B2', icon: 'favorite' },
  EXPIRED: { label: 'Vencida', color: '#6B7280', icon: 'cancel' },
}

const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Total',
  PLATELETS: 'Plaquetas',
  PLASMA: 'Plasma',
  RED_CELLS: 'Glóbulos Rojos',
}

export default function BloodTrackerScreen() {
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const { data } = await api.get('/donors/me/blood-units')
      setUnits(data)
    } catch {} finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  const summary = {
    available: units.filter(u => u.status === 'AVAILABLE').length,
    used: units.filter(u => u.status === 'USED').length,
    total: units.length,
  }

  return (
    <View style={styles.root}>
      {/* Summary strip */}
      <View style={styles.summary}>
        {[
          { label: 'Total donadas', value: summary.total, color: Colors.white },
          { label: 'Disponibles', value: summary.available, color: '#BBF7D0' },
          { label: 'Utilizadas', value: summary.used, color: '#BAE6FD' },
        ].map(({ label, value, color }) => (
          <View key={label} style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color }]}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={units}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.blood} />}
        contentContainerStyle={units.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="water-drop" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No hay unidades para rastrear</Text>
            <Text style={styles.emptySub}>Tus donaciones aparecerán aquí</Text>
          </View>
        }
        renderItem={({ item }) => {
          const info = STATUS_INFO[item.status] ?? { label: item.status, color: '#6B7280', icon: 'info' as const }
          return (
            <View style={styles.card}>
              <View style={[styles.statusBar, { backgroundColor: info.color }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.productLabel}>{PRODUCT_LABELS[item.productType] ?? item.productType}</Text>
                    <Text style={styles.bloodLabel}>{BLOOD_LABELS[item.bloodType]}</Text>
                  </View>
                  <Text style={styles.volumeText}>{item.volumeMl} mL</Text>
                </View>
                <View style={[styles.statusRow, { backgroundColor: info.color + '15' }]}>
                  <MaterialIcons name={info.icon} size={15} color={info.color} />
                  <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
                </View>
                <Text style={styles.dateText}>
                  Recolectada: {new Date(item.collectionDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: {
    backgroundColor: Colors.blood, flexDirection: 'row',
    paddingVertical: 20, paddingHorizontal: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '800' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statusBar: { width: 5 },
  cardContent: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  productLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  bloodLabel: { fontSize: 22, fontWeight: '800', color: Colors.blood, marginTop: 2 },
  volumeText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  dateText: { fontSize: 12, color: Colors.textMuted },
})

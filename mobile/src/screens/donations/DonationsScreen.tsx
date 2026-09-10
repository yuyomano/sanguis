import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, Animated, RefreshControl, AccessibilityInfo,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { BloodUnit, BLOOD_LABELS } from '../../types'

const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Total',
  PLATELETS: 'Plaquetas',
  PLASMA: 'Plasma',
  RED_CELLS: 'Glóbulos Rojos',
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: Colors.success,
  USED: Colors.textMuted,
  EXPIRED: Colors.error,
  QUARANTINE: Colors.plasma,
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  USED: 'Usado',
  EXPIRED: 'Vencido',
  QUARANTINE: 'Cuarentena',
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    // Respeta "reducir movimiento" del sistema (equivalente móvil de prefers-reduced-motion)
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (reduced) return
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ])
      ).start()
    })
  }, [])

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.cardTop}>
        <View>
          <View style={styles.skelLine} />
          <View style={[styles.skelLine, { width: 56, height: 22, marginTop: 6 }]} />
        </View>
        <View style={[styles.skelLine, { width: 72, height: 26, borderRadius: 10 }]} />
      </View>
      <View style={styles.cardBottom}>
        <View style={[styles.skelLine, { width: 90 }]} />
        <View style={[styles.skelLine, { width: 50 }]} />
      </View>
    </Animated.View>
  )
}

export default function DonationsScreen() {
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const { data } = await api.get('/donors/me/blood-units')
      setUnits(data)
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis donaciones</Text>
          <Text style={styles.headerSub}>Cargando…</Text>
        </View>
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis donaciones</Text>
        <Text style={styles.headerSub}>{units.length} unidad{units.length !== 1 ? 'es' : ''} registrada{units.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={units}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.blood} />}
        contentContainerStyle={units.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="water-drop" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Sin donaciones registradas</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.productType}>{PRODUCT_LABELS[item.productType] ?? item.productType}</Text>
                <Text style={styles.bloodType}>{BLOOD_LABELS[item.bloodType]}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] ?? Colors.textMuted) + '20' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] ?? Colors.textMuted }]}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.meta}>
                <MaterialIcons name="event" size={13} color={Colors.textMuted} />
                {' '}{new Date(item.collectionDate).toLocaleDateString('es-DO')}
              </Text>
              <Text style={styles.meta}>{item.volumeMl} mL</Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  skelLine: { height: 13, backgroundColor: Colors.border, borderRadius: 6, width: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.blood, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productType: { fontSize: 16, fontWeight: '700', color: Colors.text },
  bloodType: { fontSize: 22, fontWeight: '800', color: Colors.blood, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 13, color: Colors.textSecondary },
})

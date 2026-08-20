import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { TestResult } from '../../types'

const RESULT_COLORS: Record<string, string> = {
  NEGATIVE: '#059669',
  POSITIVE: '#DC2626',
  PENDING: '#D97706',
  INCONCLUSIVE: '#6B7280',
}

const RESULT_LABELS: Record<string, string> = {
  NEGATIVE: 'Negativo',
  POSITIVE: 'Positivo',
  PENDING: 'Pendiente',
  INCONCLUSIVE: 'Inconcluso',
}

const TEST_LABELS: Record<string, string> = {
  HIV: 'VIH',
  HEPATITIS_B: 'Hepatitis B',
  HEPATITIS_C: 'Hepatitis C',
  SYPHILIS: 'Sífilis',
  MALARIA: 'Malaria',
  CHAGAS: 'Chagas',
  HTLV: 'HTLV',
  ABO_RH: 'ABO / Rh',
}

export default function TestResultsScreen() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const { data } = await api.get('/donors/me/test-results')
      setResults(data)
    } catch {} finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={results}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.blood} />}
        contentContainerStyle={results.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="science" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Sin resultados disponibles</Text>
            <Text style={styles.emptySub}>Los resultados de tus donaciones aparecerán aquí</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = RESULT_COLORS[item.result] ?? '#6B7280'
          const resultLabel = RESULT_LABELS[item.result] ?? item.result
          const testLabel = TEST_LABELS[item.testType] ?? item.testType
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.testType}>{testLabel}</Text>
                  <Text style={styles.date}>
                    {new Date(item.conductedAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.resultBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.resultText, { color }]}>{resultLabel}</Text>
                </View>
              </View>
              {item.notes ? (
                <View style={styles.notes}>
                  <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              ) : null}
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
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  testType: { fontSize: 16, fontWeight: '700', color: Colors.text },
  date: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  resultBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  resultText: { fontSize: 13, fontWeight: '700' },
  notes: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  notesText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
})

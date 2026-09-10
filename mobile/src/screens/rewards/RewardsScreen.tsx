import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { useDonorStore } from '../../store/donorStore'
import { Colors } from '../../theme/colors'
import { Partner, PointTransaction } from '../../types'

type Tab = 'partners' | 'history'

export default function RewardsScreen() {
  const [tab, setTab] = useState<Tab>('partners')
  const [partners, setPartners] = useState<Partner[]>([])
  const [history, setHistory] = useState<PointTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { profile } = useDonorStore()

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const [p, h] = await Promise.all([
        api.get('/partners'),
        api.get('/donors/me/point-transactions'),
      ])
      setPartners((p.data.data ?? p.data).filter((x: Partner) => x.isActive))
      setHistory(h.data)
    } catch {} finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis recompensas</Text>
        <View style={styles.pointsRow}>
          <MaterialIcons name="stars" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={styles.pointsText}>{profile?.pointsBalance?.toLocaleString() ?? '0'} pts</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['partners', 'history'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'partners' ? 'Socios' : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'partners' ? (
        <FlatList
          data={partners}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.blood} />}
          contentContainerStyle={partners.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialIcons name="card-giftcard" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>No hay socios disponibles</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.partnerIcon}>
                  <Text style={styles.partnerInitial}>{item.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>{item.name}</Text>
                  <Text style={styles.partnerCategory}>{item.category}</Text>
                </View>
              </View>
              {item.availableRewards?.length ? (
                <View style={styles.rewardsWrap}>
                  {item.availableRewards.map((r, i) => (
                    <View key={i} style={styles.rewardChip}>
                      <Text style={styles.rewardName}>{r.name}</Text>
                      <Text style={styles.rewardPoints}>{r.points} pts</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={i => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.blood} />}
          contentContainerStyle={history.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialIcons name="history" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>Sin transacciones aún</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPositive = item.points > 0
            return (
              <View style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: isPositive ? Colors.successLight : Colors.bloodLight }]}>
                  <MaterialIcons name={isPositive ? 'add' : 'remove'} size={18} color={isPositive ? Colors.success : Colors.blood} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{item.description ?? item.type}</Text>
                  <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString('es-DO')}</Text>
                </View>
                <View>
                  <Text style={[styles.txPoints, { color: isPositive ? Colors.success : Colors.blood }]}>
                    {isPositive ? '+' : ''}{item.points}
                  </Text>
                  <Text style={styles.txBalance}>{item.balanceAfter} pts</Text>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.blood, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  pointsText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  tabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.blood },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.blood },
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  partnerIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bloodLight,
    justifyContent: 'center', alignItems: 'center',
  },
  partnerInitial: { fontSize: 20, fontWeight: '800', color: Colors.blood },
  partnerName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  partnerCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rewardsWrap: { gap: 8 },
  rewardChip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  rewardName: { fontSize: 13, color: Colors.text },
  rewardPoints: { fontSize: 13, fontWeight: '700', color: Colors.blood },
  txCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  txIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: 14, fontWeight: '600', color: Colors.text },
  txDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  txPoints: { fontSize: 16, fontWeight: '800', textAlign: 'right' },
  txBalance: { fontSize: 11, color: Colors.textSecondary, textAlign: 'right', marginTop: 2 },
})

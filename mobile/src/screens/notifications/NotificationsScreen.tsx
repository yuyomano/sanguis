import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { Notification } from '../../types'

const TYPE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  EMERGENCY_ALERT: 'warning',
  PUSH: 'notifications',
  EMAIL: 'email',
  WHATSAPP: 'chat',
}

const TYPE_COLORS: Record<string, string> = {
  EMERGENCY_ALERT: Colors.blood,
  PUSH: '#0891B2',
  EMAIL: '#059669',
  WHATSAPP: '#16A34A',
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const { data } = await api.get('/donors/me/notifications')
      setNotifications(data)
    } catch {} finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={notifications}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.blood} />}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="notifications-none" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Sin notificaciones</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = TYPE_COLORS[item.type] ?? Colors.textSecondary
          const icon = TYPE_ICONS[item.type] ?? 'notifications'
          return (
            <View style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
                <MaterialIcons name={icon} size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                {item.subject ? <Text style={styles.subject}>{item.subject}</Text> : null}
                <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('es-DO')}</Text>
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
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  subject: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  body: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  date: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
})

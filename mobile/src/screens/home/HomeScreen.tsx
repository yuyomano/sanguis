import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../../store/authStore'
import { useDonorStore } from '../../store/donorStore'
import { Colors } from '../../theme/colors'
import { BLOOD_LABELS } from '../../types'
import { RootStackParamList } from '../../types'

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>

const CATEGORY_LABELS = { CASUAL: 'Casual', RECURRENT: 'Recurrente', VIP: 'VIP' }
const CATEGORY_COLORS = { CASUAL: Colors.textSecondary, RECURRENT: '#0891B2', VIP: '#D97706' }

export default function HomeScreen({ navigation }: Props) {
  const { logout } = useAuthStore()
  const { profile, isLoading, fetchProfile } = useDonorStore()

  const daysSinceLastDonation = profile?.lastDonationDate
    ? Math.floor((Date.now() - new Date(profile.lastDonationDate).getTime()) / 86400000)
    : null

  const canDonate = daysSinceLastDonation === null || daysSinceLastDonation >= 90

  const quickActions = [
    { icon: 'water-drop' as const, label: 'Rastrear\nmi sangre', screen: 'BloodTracker' as const, color: Colors.blood },
    { icon: 'notifications' as const, label: 'Alertas', screen: 'Notifications' as const, color: '#0891B2' },
    { icon: 'science' as const, label: 'Resultados', screen: 'TestResults' as const, color: '#059669' },
    { icon: 'settings' as const, label: 'Ajustes', screen: 'Settings' as const, color: Colors.textSecondary },
  ]

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchProfile} tintColor={Colors.blood} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {profile?.name?.split(' ')[0] ?? '—'}</Text>
          <Text style={styles.subGreeting}>Gracias por ser parte de Sanguis</Text>
        </View>
        <View style={styles.bloodBadge}>
          <Text style={styles.bloodText}>{profile ? BLOOD_LABELS[profile.bloodType] : '—'}</Text>
        </View>
      </View>

      {/* Points card */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View>
            <Text style={styles.cardLabel}>Puntos disponibles</Text>
            <Text style={styles.cardPoints}>{profile?.pointsBalance?.toLocaleString() ?? '0'}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[profile?.category ?? 'CASUAL'] + '20' }]}>
            <Text style={[styles.categoryText, { color: CATEGORY_COLORS[profile?.category ?? 'CASUAL'] }]}>
              {CATEGORY_LABELS[profile?.category ?? 'CASUAL']}
            </Text>
          </View>
        </View>

        {/* Donation status */}
        <View style={[styles.donateRow, { backgroundColor: canDonate ? Colors.bloodLight : '#F0FDF4' }]}>
          <MaterialIcons
            name={canDonate ? 'favorite' : 'check-circle'}
            size={18}
            color={canDonate ? Colors.blood : '#059669'}
          />
          <Text style={[styles.donateText, { color: canDonate ? Colors.blood : '#059669' }]}>
            {canDonate
              ? 'Apto para donar hoy'
              : `Próxima donación en ${90 - daysSinceLastDonation!} días`}
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Acciones rápidas</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map(({ icon, label, screen, color }) => (
          <TouchableOpacity
            key={screen}
            style={styles.actionBtn}
            onPress={() => navigation.navigate(screen as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
              <MaterialIcons name={icon} size={26} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Referral code */}
      {profile?.referralCode ? (
        <View style={styles.referral}>
          <Text style={styles.referralLabel}>Tu código de referido</Text>
          <Text style={styles.referralCode}>{profile.referralCode}</Text>
          <Text style={styles.referralSub}>Comparte y gana puntos cuando tus referidos donen</Text>
        </View>
      ) : (
        <View style={styles.referralLocked}>
          <MaterialIcons name="group-add" size={26} color={Colors.textMuted} />
          <Text style={styles.referralLockedTitle}>Programa de Referidos</Text>
          <Text style={styles.referralLockedSub}>
            Completa tu primera donación para desbloquear tu código personal y ganar puntos extra
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: profile?.lastDonationDate ? '100%' : '0%' }]} />
          </View>
          <Text style={styles.progressLabel}>{profile?.lastDonationDate ? 1 : 0} / 1 donación</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.blood, padding: 24, paddingTop: 56,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.white },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bloodBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  bloodText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  card: {
    backgroundColor: Colors.white, margin: 16, borderRadius: 16,
    padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  cardPoints: { fontSize: 36, fontWeight: '800', color: Colors.text },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryText: { fontSize: 13, fontWeight: '700' },
  donateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  donateText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginHorizontal: 16, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 24 },
  actionBtn: { width: '47%', backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center' },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  referral: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 32,
    borderRadius: 14, padding: 20, alignItems: 'center',
  },
  referralLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  referralCode: { fontSize: 28, fontWeight: '800', color: Colors.blood, letterSpacing: 4, marginBottom: 6 },
  referralSub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  referralLocked: {
    backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 32,
    borderRadius: 14, padding: 20, alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  referralLockedTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 4 },
  referralLockedSub: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 17, marginBottom: 8 },
  progressBar: {
    width: '100%', height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.blood, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
})

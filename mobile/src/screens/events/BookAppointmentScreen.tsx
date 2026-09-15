import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { ParamListBase, StaticScreenProps, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { api } from '../../services/api'
import { Colors } from '../../theme/colors'
import { useDonorStore } from '../../store/donorStore'
import { DonationEvent, ProductType, PRODUCT_TYPES, PRODUCT_LABELS } from '../../types'

type Props = StaticScreenProps<{ eventId: string; eventName: string }>

const SLOT_STEP_MIN = 30
const MAX_SLOTS = 60

function buildSlots(event: DonationEvent): Date[] {
  const start = new Date(event.startDatetime)
  const end = new Date(event.endDatetime)
  const now = new Date()
  let cur = start > now ? start : new Date(Math.ceil(now.getTime() / (SLOT_STEP_MIN * 60000)) * SLOT_STEP_MIN * 60000)
  const slots: Date[] = []
  while (cur < end && slots.length < MAX_SLOTS) {
    slots.push(new Date(cur))
    cur = new Date(cur.getTime() + SLOT_STEP_MIN * 60000)
  }
  return slots
}

export default function BookAppointmentScreen({ route }: Props) {
  // popToTop es específico del stack nativo, no está en el NavigationProp genérico;
  // no necesitamos el param list completo aquí, solo el método.
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>()
  const { eventId, eventName } = route.params
  const { fetchProfile } = useDonorStore()
  const [event, setEvent] = useState<DonationEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [slot, setSlot] = useState<Date | null>(null)
  const [productType, setProductType] = useState<ProductType>('WHOLE_BLOOD')
  const [submitting, setSubmitting] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/events/public/${eventId}`)
      .then(r => setEvent(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId])

  async function submit() {
    if (!slot) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/events/appointments', {
        eventId,
        scheduledTime: slot.toISOString(),
        productType,
      })
      await fetchProfile()
      setQrDataUrl(data.qrDataUrl)
    } catch (err: any) {
      Alert.alert('No se pudo reservar', err.response?.data?.message ?? 'Intenta de nuevo')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.blood} /></View>
  }

  if (!event) {
    return <View style={styles.center}><Text style={styles.errorText}>Evento no encontrado</Text></View>
  }

  if (qrDataUrl) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="check-circle" size={48} color={Colors.success} />
        <Text style={styles.doneTitle}>Cita confirmada</Text>
        <Text style={styles.doneSub}>Muestra este código QR al llegar</Text>
        <Image source={{ uri: qrDataUrl }} style={styles.qr} />
        <TouchableOpacity style={styles.bookButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.bookButtonText}>Listo</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const slots = buildSlots(event)

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{eventName}</Text>
      <Text style={styles.subtitle}>{event.locationAddress}</Text>

      <Text style={styles.sectionLabel}>Horario</Text>
      {slots.length === 0 ? (
        <Text style={styles.subtitle}>No hay horarios disponibles para este evento</Text>
      ) : (
        <View style={styles.chipsWrap}>
          {slots.map(s => {
            const selected = slot?.getTime() === s.getTime()
            return (
              <TouchableOpacity
                key={s.toISOString()}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSlot(s)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {s.toLocaleString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      <Text style={styles.sectionLabel}>Tipo de producto</Text>
      <View style={styles.chipsWrap}>
        {PRODUCT_TYPES.map(pt => (
          <TouchableOpacity
            key={pt}
            style={[styles.chip, productType === pt && styles.chipSelected]}
            onPress={() => setProductType(pt)}
          >
            <Text style={[styles.chipText, productType === pt && styles.chipTextSelected]}>
              {PRODUCT_LABELS[pt]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.bookButton, (!slot || submitting) && styles.bookButtonDisabled]}
        disabled={!slot || submitting}
        onPress={submit}
      >
        <Text style={styles.bookButtonText}>{submitting ? 'Reservando…' : 'Confirmar cita'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 10, padding: 24 },
  errorText: { fontSize: 16, color: Colors.textSecondary },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.blood, borderColor: Colors.blood },
  chipText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  chipTextSelected: { color: Colors.white },
  bookButton: {
    marginTop: 16, backgroundColor: Colors.blood, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
  },
  bookButtonDisabled: { backgroundColor: Colors.textMuted },
  bookButtonText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  doneTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 4 },
  doneSub: { fontSize: 14, color: Colors.textSecondary },
  qr: { width: 220, height: 220, marginVertical: 16 },
})

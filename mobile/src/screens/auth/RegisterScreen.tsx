import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView, Switch, Linking,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/authStore'
import { Colors } from '../../theme/colors'
import { BLOOD_TYPES, BLOOD_LABELS } from '../../types'

// ponytail: placeholder hasta que los Términos/Privacidad tengan URL pública definitiva
const TERMS_URL = 'https://sanguis.do/legal'

function calcAge(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return null
  const birth = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// BloodType enum values that map to API's combined bloodType + rhFactor
const BLOOD_OPTIONS = [
  { label: 'O+', bloodType: 'O_POSITIVE', rhFactor: true },
  { label: 'O-', bloodType: 'O_NEGATIVE', rhFactor: false },
  { label: 'A+', bloodType: 'A_POSITIVE', rhFactor: true },
  { label: 'A-', bloodType: 'A_NEGATIVE', rhFactor: false },
  { label: 'B+', bloodType: 'B_POSITIVE', rhFactor: true },
  { label: 'B-', bloodType: 'B_NEGATIVE', rhFactor: false },
  { label: 'AB+', bloodType: 'AB_POSITIVE', rhFactor: true },
  { label: 'AB-', bloodType: 'AB_NEGATIVE', rhFactor: false },
]

export default function RegisterScreen() {
  const navigation = useNavigation()
  const [form, setForm] = useState({
    name: '',
    idNumber: '',
    email: '',
    phone: '',
    password: '',
    birthDate: '',
    bloodType: 'O_POSITIVE',
    rhFactor: true,
    city: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  })
  const [error, setError] = useState('')
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const { register, isLoading } = useAuthStore()

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function captureLocation() {
    setLocationStatus('loading')
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLocationStatus('denied'); return }
      const pos = await Location.getCurrentPositionAsync({})
      const [place] = await Location.reverseGeocodeAsync(pos.coords)
      setForm(f => ({
        ...f,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        city: place?.city || place?.subregion || f.city,
        address: [place?.street, place?.name].filter(Boolean).join(' ') || f.address,
      }))
      setLocationStatus('done')
    } catch {
      setLocationStatus('denied')
    }
  }

  async function handleRegister() {
    if (!form.name || !form.phone || !form.password) {
      setError('Completa los campos obligatorios (nombre, teléfono y contraseña)'); return
    }
    if (!form.idNumber && !form.email) {
      setError('Proporciona al menos tu cédula/pasaporte o correo electrónico'); return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return
    }
    const age = calcAge(form.birthDate)
    if (age === null) {
      setError('Indica tu fecha de nacimiento en formato AAAA-MM-DD'); return
    }
    if (age < 18 || age > 65) {
      setError('Debes tener entre 18 y 65 años para registrarte como donante'); return
    }
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos de Servicio y la Política de Privacidad'); return
    }
    setError('')
    try {
      await register({
        name: form.name,
        ...(form.idNumber ? { idType: 'CEDULA', idNumber: form.idNumber } : {}),
        phone: form.phone,
        email: form.email || undefined,
        bloodType: form.bloodType,
        rhFactor: form.rhFactor,
        password: form.password,
        birthDate: form.birthDate,
        termsAccepted: acceptedTerms,
        city: form.city || undefined,
        address: form.address || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
      })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al registrarse')
    }
  }

  const textFields: { key: string; label: string; placeholder: string; keyboard?: any; secure?: boolean; required?: boolean }[] = [
    { key: 'name', label: 'Nombre completo *', placeholder: 'Juan Pérez', required: true },
    { key: 'idNumber', label: 'Cédula / Pasaporte (opcional)', placeholder: '001-1234567-8' },
    { key: 'email', label: 'Correo electrónico (opcional)', placeholder: 'tu@correo.com', keyboard: 'email-address' },
    { key: 'phone', label: 'Teléfono *', placeholder: '+1 809 000 0000', keyboard: 'phone-pad', required: true },
    { key: 'password', label: 'Contraseña *', placeholder: '••••••••', secure: true, required: true },
    { key: 'birthDate', label: 'Fecha de nacimiento * (AAAA-MM-DD)', placeholder: '1998-05-14', keyboard: 'numeric', required: true },
  ]

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.sub}>Únete a la comunidad Sanguis</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Proporciona al menos tu cédula/pasaporte o tu correo electrónico para identificarte.</Text>
        </View>

        {textFields.map(({ key, label, placeholder, keyboard, secure }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key as keyof typeof form] as string}
              onChangeText={v => set(key, v)}
              placeholder={placeholder}
              placeholderTextColor={Colors.textMuted}
              keyboardType={keyboard ?? 'default'}
              secureTextEntry={secure}
              autoCapitalize={key === 'email' || key === 'idNumber' ? 'none' : 'words'}
            />
          </View>
        ))}

        {/* Blood type picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Grupo sanguíneo *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.bloodRow}>
              {BLOOD_OPTIONS.map(opt => {
                const active = form.bloodType === opt.bloodType && form.rhFactor === opt.rhFactor
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setForm(f => ({ ...f, bloodType: opt.bloodType, rhFactor: opt.rhFactor }))}
                    style={[styles.bloodChip, active && styles.bloodChipActive]}
                  >
                    <Text style={[styles.bloodChipText, active && styles.bloodChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>Ubicación (opcional)</Text>
          <TouchableOpacity style={styles.locationBtn} onPress={captureLocation} disabled={locationStatus === 'loading'}>
            {locationStatus === 'loading'
              ? <ActivityIndicator color={Colors.blood} size="small" />
              : <Text style={styles.locationBtnText}>
                  {locationStatus === 'done' ? '📍 Ubicación capturada' : 'Usar mi ubicación actual'}
                </Text>}
          </TouchableOpacity>
          {locationStatus === 'done' && form.city ? (
            <Text style={styles.locationHint}>{form.city}</Text>
          ) : null}
          {locationStatus === 'denied' && (
            <Text style={styles.locationHint}>No se pudo acceder a tu ubicación. Puedes agregarla luego desde tu perfil.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms(v => !v)}>
          <MaterialIcons
            name={acceptedTerms ? 'check-box' : 'check-box-outline-blank'}
            size={22}
            color={acceptedTerms ? Colors.blood : Colors.textMuted}
          />
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL(TERMS_URL)}>
              Términos de Servicio y la Política de Privacidad
            </Text>
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Crear cuenta</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesión</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 24, paddingBottom: 40 },
  back: { marginBottom: 20 },
  backText: { color: Colors.blood, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.background,
  },
  bloodRow: { flexDirection: 'row', gap: 8 },
  bloodChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  bloodChipActive: { borderColor: Colors.blood, backgroundColor: Colors.bloodLight },
  bloodChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  bloodChipTextActive: { color: Colors.blood },
  infoBox: { backgroundColor: Colors.background, borderRadius: 8, padding: 12, marginBottom: 20 },
  infoText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  locationBtn: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.background,
  },
  locationBtnText: { fontSize: 14, fontWeight: '600', color: Colors.blood },
  locationHint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4, marginBottom: 12 },
  termsText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  termsLink: { color: Colors.blood, fontWeight: '600' },
  error: { color: Colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: { backgroundColor: Colors.blood, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkAccent: { color: Colors.blood, fontWeight: '600' },
})

import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../../store/authStore'
import { Colors } from '../../theme/colors'
import { BLOOD_TYPES, BLOOD_LABELS, RootStackParamList } from '../../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    idNumber: '', bloodType: 'O_POSITIVE', birthDate: '',
  })
  const [error, setError] = useState('')
  const { register, isLoading } = useAuthStore()

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password || !form.phone || !form.idNumber) {
      setError('Completa todos los campos obligatorios'); return
    }
    setError('')
    try {
      await register(form)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al registrarse')
    }
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; keyboard?: any; secure?: boolean }[] = [
    { key: 'name', label: 'Nombre completo *', placeholder: 'Juan Pérez' },
    { key: 'email', label: 'Correo *', placeholder: 'tu@correo.com', keyboard: 'email-address' },
    { key: 'password', label: 'Contraseña *', placeholder: '••••••••', secure: true },
    { key: 'phone', label: 'Teléfono *', placeholder: '+1 809 000 0000', keyboard: 'phone-pad' },
    { key: 'idNumber', label: 'Cédula / Pasaporte *', placeholder: '001-0000000-0' },
    { key: 'birthDate', label: 'Fecha de nacimiento', placeholder: 'YYYY-MM-DD' },
  ]

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.sub}>Únete a la comunidad Sanguis</Text>

        {fields.map(({ key, label, placeholder, keyboard, secure }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key]}
              onChangeText={v => set(key, v)}
              placeholder={placeholder}
              placeholderTextColor={Colors.textMuted}
              keyboardType={keyboard ?? 'default'}
              secureTextEntry={secure}
              autoCapitalize={key === 'email' ? 'none' : 'words'}
            />
          </View>
        ))}

        {/* Blood type picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Grupo sanguíneo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.bloodRow}>
              {BLOOD_TYPES.map(bt => (
                <TouchableOpacity
                  key={bt}
                  onPress={() => set('bloodType', bt)}
                  style={[styles.bloodChip, form.bloodType === bt && styles.bloodChipActive]}
                >
                  <Text style={[styles.bloodChipText, form.bloodType === bt && styles.bloodChipTextActive]}>
                    {BLOOD_LABELS[bt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

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
  error: { color: Colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: { backgroundColor: Colors.blood, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: Colors.textSecondary, fontSize: 14 },
  linkAccent: { color: Colors.blood, fontWeight: '600' },
})

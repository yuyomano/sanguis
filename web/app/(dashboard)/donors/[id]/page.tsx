'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  User, Crown, Droplets, Gift, Phone, Mail, Calendar,
  CheckCircle, XCircle, ArrowLeft, Plus, MapPin, FlaskConical,
  ShieldCheck, ShieldAlert, Stethoscope,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}
const CATEGORY_STYLES: Record<string, string> = {
  VIP: 'bg-plasma/15 text-plasma',
  RECURRENT: 'bg-blood-50 text-primary',
  CASUAL: 'bg-muted text-foreground',
}
const CATEGORY_LABELS: Record<string, string> = {
  VIP: 'VIP', RECURRENT: 'Recurrente', CASUAL: 'Casual',
}
const STATUS_STYLES: Record<string, string> = {
  STORED: 'bg-clinical-success/15 text-clinical-success', APPROVED: 'bg-clinical-success/15 text-clinical-success',
  QUARANTINE: 'bg-plasma/15 text-plasma', TESTING: 'bg-platelet/15 text-platelet',
  REJECTED: 'bg-alert/15 text-alert', USED: 'bg-muted text-muted-foreground',
  DISCARDED: 'bg-muted text-muted-foreground/70', COLLECTED: 'bg-muted text-muted-foreground',
  ALLOCATED: 'bg-blood-50 text-primary',
}
const STATUS_LABELS: Record<string, string> = {
  STORED: 'Almacenada', APPROVED: 'Aprobada', QUARANTINE: 'Cuarentena',
  ALLOCATED: 'Asignada', REJECTED: 'Rechazada', USED: 'Usada',
  DISCARDED: 'Descartada', TESTING: 'En análisis', COLLECTED: 'Recolectada',
}
const ID_TYPE_LABELS: Record<string, string> = {
  CEDULA: 'Cédula', PASSPORT: 'Pasaporte',
}
const APPT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Pendiente', CHECKED_IN: 'Presente', CANCELLED: 'Cancelada',
  NO_SHOW: 'No se presentó', COMPLETED: 'Completada',
}
const MEDICAL_EXCLUSION_LABELS: Record<string, string> = {
  HEPATITIS_B: 'Hepatitis B', HEPATITIS_C: 'Hepatitis C', HIV_AIDS: 'VIH/SIDA',
  CHAGAS: 'Chagas', SYPHILIS: 'Sífilis', MALARIA: 'Malaria', TUBERCULOSIS: 'Tuberculosis',
  CANCER: 'Cáncer', HEART_DISEASE: 'Enfermedad cardíaca', EPILEPSY: 'Epilepsia',
  RECENT_TATTOO_PIERCING: 'Tatuaje/perforación reciente', RECENT_SURGERY: 'Cirugía reciente',
  RECENT_PREGNANCY: 'Embarazo reciente', HIGH_RISK_SEXUAL_BEHAVIOR: 'Conducta sexual de riesgo',
  IV_DRUG_USE: 'Uso de drogas IV', OTHER: 'Otra',
}

export default function DonorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [donor, setDonor] = useState<any>(null)
  const [eligibility, setEligibility] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [locationForm, setLocationForm] = useState({ city: '', address: '', latitude: '', longitude: '' })
  const [savingLocation, setSavingLocation] = useState(false)
  const [editingId, setEditingId] = useState(false)
  const [idForm, setIdForm] = useState({ idType: 'CEDULA', idNumber: '' })
  const [savingId, setSavingId] = useState(false)
  const [idError, setIdError] = useState('')
  const [editingMedical, setEditingMedical] = useState(false)
  const [medicalForm, setMedicalForm] = useState({ birthDate: '', allergies: '' })
  const [medicalExclusionsForm, setMedicalExclusionsForm] = useState<string[]>([])
  const [savingMedical, setSavingMedical] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch(`/donors/${id}`).then(r => r.json()),
      apiFetch(`/donors/${id}/eligibility`).then(r => r.json()),
    ]).then(([d, e]) => {
      setDonor(d)
      setEligibility(e)
      setLocationForm({
        city: d.city || '', address: d.address || '',
        latitude: d.latitude?.toString() || '', longitude: d.longitude?.toString() || '',
      })
      setIdForm({ idType: d.idType || 'CEDULA', idNumber: d.idNumber || '' })
      setMedicalForm({
        birthDate: d.birthDate ? d.birthDate.slice(0, 10) : '',
        allergies: (d.allergies || []).join(', '),
      })
      setMedicalExclusionsForm(d.medicalExclusions || [])
    }).finally(() => setLoading(false))
  }, [id])

  async function setCategory(category: string) {
    setSaving(true)
    await apiFetch(`/donors/${id}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    })
    setDonor((d: any) => ({ ...d, category }))
    setSaving(false)
  }

  async function togglePriority() {
    setSaving(true)
    const isPriority = !donor.isPriorityDonor
    await apiFetch(`/donors/${id}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPriority }),
    })
    setDonor((d: any) => ({ ...d, isPriorityDonor: isPriority }))
    setSaving(false)
  }

  async function saveLocation() {
    setSavingLocation(true)
    const body: Record<string, any> = {
      city: locationForm.city || null,
      address: locationForm.address || null,
      latitude: locationForm.latitude ? parseFloat(locationForm.latitude) : null,
      longitude: locationForm.longitude ? parseFloat(locationForm.longitude) : null,
    }
    const res = await apiFetch(`/donors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setDonor((d: any) => ({ ...d, ...body }))
      setEditingLocation(false)
    }
    setSavingLocation(false)
  }

  async function saveId() {
    setSavingId(true)
    setIdError('')
    const res = await apiFetch(`/donors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idType: idForm.idType, idNumber: idForm.idNumber }),
    })
    if (res.ok) {
      setDonor((d: any) => ({ ...d, idType: idForm.idType, idNumber: idForm.idNumber }))
      setEditingId(false)
    } else {
      const body = await res.json().catch(() => null)
      setIdError(body?.message || 'No se pudo guardar')
    }
    setSavingId(false)
  }

  function toggleExclusionForm(key: string) {
    setMedicalExclusionsForm(m => m.includes(key) ? m.filter(x => x !== key) : [...m, key])
  }

  async function saveMedical() {
    setSavingMedical(true)
    const body: Record<string, any> = {
      birthDate: medicalForm.birthDate || null,
      allergies: medicalForm.allergies.split(',').map(a => a.trim()).filter(Boolean),
      medicalExclusions: medicalExclusionsForm,
    }
    const res = await apiFetch(`/donors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      // Ancla a medianoche local antes de guardar en estado: new Date('YYYY-MM-DD') se
      // interpreta como UTC y correría la fecha un día hacia atrás al mostrarse.
      setDonor((d: any) => ({ ...d, ...body, birthDate: body.birthDate ? `${body.birthDate}T00:00:00.000` : null }))
      setEditingMedical(false)
    }
    setSavingMedical(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
      </div>
    )
  }
  if (!donor || donor.message) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Donante no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a donantes
      </button>

      {/* Header */}
      <div className="bg-card rounded-md border border-border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blood-50 flex items-center justify-center">
              <User size={28} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-semibold text-foreground">{donor.name}</h1>
                {donor.isPriorityDonor && <Crown size={18} className="text-plasma" />}
              </div>
              {editingId ? (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={idForm.idType}
                    onChange={(e) => setIdForm((f) => ({ ...f, idType: e.target.value }))}
                    className="px-2 py-1 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CEDULA">Cédula</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>
                  <input
                    value={idForm.idNumber}
                    onChange={(e) => setIdForm((f) => ({ ...f, idNumber: e.target.value }))}
                    placeholder="Número de identificación"
                    className="px-2 py-1 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={saveId}
                    disabled={savingId || !idForm.idNumber}
                    className="px-2.5 py-1 bg-primary hover:bg-blood-600 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-60"
                  >
                    {savingId ? 'Guardando…' : 'Verificar'}
                  </button>
                  <button
                    onClick={() => { setEditingId(false); setIdError('') }}
                    className="px-2.5 py-1 border border-input rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  {idError && <p className="text-xs text-alert basis-full">{idError}</p>}
                </div>
              ) : (
                <button
                  onClick={() => setEditingId(true)}
                  className="flex items-center gap-1.5 text-sm mt-0.5 hover:underline"
                >
                  {donor.idNumber ? (
                    <>
                      <ShieldCheck size={14} className="text-clinical-success shrink-0" />
                      <span className="text-muted-foreground">{ID_TYPE_LABELS[donor.idType] || donor.idType} · {donor.idNumber}</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} className="text-alert shrink-0" />
                      <span className="text-alert">Sin verificar — no gana puntos de recompensa</span>
                    </>
                  )}
                </button>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-sm font-bold">
                  {BLOOD_LABELS[donor.bloodType]}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[donor.category]}`}>
                  {CATEGORY_LABELS[donor.category] || donor.category}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push(`/inventory/new?donorId=${id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={14} /> Registrar donación
            </button>
            <select
              value={donor.category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
              className="px-3 py-1.5 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="CASUAL">Casual</option>
              <option value="RECURRENT">Recurrente</option>
              <option value="VIP">VIP</option>
            </select>
            <button
              onClick={togglePriority}
              disabled={saving}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                donor.isPriorityDonor
                  ? 'bg-plasma/10 border-plasma/40 text-plasma hover:bg-plasma/15'
                  : 'border-input text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {donor.isPriorityDonor ? '⭐ Prioritario' : 'Marcar prioritario'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          {[
            { label: 'Total donaciones', value: donor.totalDonations, icon: Droplets },
            { label: 'Puntos Sanguis', value: `${donor.pointsBalance} pts`, icon: Gift },
            { label: 'Teléfono', value: donor.phone, icon: Phone },
            { label: 'Email', value: donor.email || '—', icon: Mail },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon size={16} className="text-muted-foreground/70 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground/70">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility */}
      {eligibility && (
        <div className={`rounded-md border p-4 mb-6 flex items-center gap-3 ${
          eligibility.eligible ? 'bg-clinical-success/5 border-clinical-success/30' : 'bg-platelet/5 border-platelet/30'
        }`}>
          {eligibility.eligible
            ? <CheckCircle size={20} className="text-clinical-success" />
            : <XCircle size={20} className="text-platelet" />}
          <div>
            <p className={`text-sm font-semibold ${eligibility.eligible ? 'text-clinical-success' : 'text-platelet'}`}>
              {eligibility.eligible ? 'Elegible para donar' : 'No elegible actualmente'}
            </p>
            {!eligibility.eligible && eligibility.nextEligibleDate && (
              <p className="text-xs text-platelet/80 mt-0.5">
                Puede donar a partir del{' '}
                {new Date(eligibility.nextEligibleDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}· Han pasado {eligibility.daysSinceLast} de {eligibility.requiredDays} días requeridos
              </p>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="bg-card rounded-md border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin size={16} className="text-muted-foreground" />
            Ubicación
          </h2>
          {!editingLocation && (
            <button
              onClick={() => setEditingLocation(true)}
              className="text-sm text-primary hover:text-blood-700 font-medium"
            >
              Editar
            </button>
          )}
        </div>

        {editingLocation ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Ciudad</label>
                <input
                  value={locationForm.city}
                  onChange={(e) => setLocationForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Dirección</label>
                <input
                  value={locationForm.address}
                  onChange={(e) => setLocationForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Latitud</label>
                <input
                  type="number" step="any"
                  value={locationForm.latitude}
                  onChange={(e) => setLocationForm((f) => ({ ...f, latitude: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Longitud</label>
                <input
                  type="number" step="any"
                  value={locationForm.longitude}
                  onChange={(e) => setLocationForm((f) => ({ ...f, longitude: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveLocation}
                disabled={savingLocation}
                className="px-3 py-1.5 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60"
              >
                {savingLocation ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingLocation(false)}
                className="px-3 py-1.5 border border-input rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : donor.city || donor.address ? (
          <div className="text-sm text-foreground space-y-0.5">
            {donor.city && <p>{donor.city}</p>}
            {donor.address && <p className="text-muted-foreground">{donor.address}</p>}
            {donor.latitude != null && donor.longitude != null && (
              <p className="text-xs text-muted-foreground/70 tabular-nums">{donor.latitude}, {donor.longitude}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/70">Sin ubicación registrada — útil para priorizar candidatos en solicitudes de emergencia cercanas</p>
        )}
      </div>

      {/* Información médica */}
      <div className="bg-card rounded-md border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Stethoscope size={16} className="text-muted-foreground" />
            Información médica
          </h2>
          {!editingMedical && (
            <button
              onClick={() => setEditingMedical(true)}
              className="text-sm text-primary hover:text-blood-700 font-medium"
            >
              Editar
            </button>
          )}
        </div>

        {editingMedical ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={medicalForm.birthDate}
                  onChange={(e) => setMedicalForm((f) => ({ ...f, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Alergias (separadas por coma)</label>
                <input
                  value={medicalForm.allergies}
                  onChange={(e) => setMedicalForm((f) => ({ ...f, allergies: e.target.value }))}
                  placeholder="Aspirina, penicilina..."
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Antecedentes que afectan la elegibilidad</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MEDICAL_EXCLUSION_LABELS).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={medicalExclusionsForm.includes(k)}
                      onChange={() => toggleExclusionForm(k)}
                      className="rounded border-input"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveMedical}
                disabled={savingMedical}
                className="px-3 py-1.5 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60"
              >
                {savingMedical ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingMedical(false)}
                className="px-3 py-1.5 border border-input rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm space-y-2">
            <p className="text-foreground">
              <span className="text-muted-foreground">Fecha de nacimiento: </span>
              {donor.birthDate ? new Date(donor.birthDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Alergias: </span>
              {donor.allergies?.length ? donor.allergies.join(', ') : '—'}
            </p>
            <div>
              <span className="text-muted-foreground">Antecedentes: </span>
              {donor.medicalExclusions?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {donor.medicalExclusions.map((m: string) => (
                    <span key={m} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-alert/10 text-alert">
                      {MEDICAL_EXCLUSION_LABELS[m] || m}
                    </span>
                  ))}
                </div>
              ) : <span className="text-foreground">Ninguno reportado</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood units history */}
        <div className="bg-card rounded-md border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Droplets size={16} className="text-primary" />
              Unidades de sangre ({donor._count?.bloodUnits ?? donor.bloodUnits?.length ?? 0})
            </h2>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {donor.bloodUnits?.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground/70">Sin unidades registradas</p>
            ) : donor.bloodUnits?.map((unit: any) => (
              <div key={unit.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium text-foreground">{unit.bagNumber}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {unit.productType?.replace(/_/g, ' ')} ·{' '}
                      {unit.collectionDate ? new Date(unit.collectionDate).toLocaleDateString('es-DO') : '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={11} />
                        {unit.storageLocation?.name || 'Sin ubicación'}
                      </span>
                      {unit.testResults?.length > 0 && (
                        <a
                          href={`/testing/${unit.testResults[0].id}`}
                          className="text-xs text-primary hover:text-blood-700 flex items-center gap-1 font-medium"
                        >
                          <FlaskConical size={11} />
                          {unit.testResults.length} {unit.testResults.length === 1 ? 'análisis' : 'análisis'} →
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[unit.status] || ''}`}>
                    {STATUS_LABELS[unit.status] || unit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Point transactions */}
        <div className="bg-card rounded-md border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Gift size={16} className="text-platelet" />
              Historial de puntos
            </h2>
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {donor.pointTransactions?.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground/70">Sin transacciones</p>
            ) : donor.pointTransactions?.map((tx: any) => (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('es-DO') : '—'}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.points >= 0 ? 'text-clinical-success' : 'text-alert'}`}>
                  {tx.points >= 0 ? '+' : ''}{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-card rounded-md border border-border overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              Citas recientes
            </h2>
          </div>
          <div className="divide-y divide-border">
            {donor.appointments?.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground/70">Sin citas registradas</p>
            ) : donor.appointments?.map((appt: any) => (
              <div key={appt.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{appt.event?.name || 'Evento'}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {appt.scheduledTime ? new Date(appt.scheduledTime).toLocaleString('es-DO') : '—'}
                    {' '}· QR: <span className="font-mono">{appt.qrCode?.slice(0, 8)}…</span>
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  appt.status === 'CHECKED_IN' ? 'bg-clinical-success/15 text-clinical-success' :
                  appt.status === 'CANCELLED' ? 'bg-alert/15 text-alert' :
                  'bg-blood-50 text-primary'
                }`}>
                  {APPT_STATUS_LABELS[appt.status] || appt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

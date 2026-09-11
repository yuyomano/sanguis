'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const BLOOD_TYPES = ['O_NEGATIVE', 'O_POSITIVE', 'A_NEGATIVE', 'A_POSITIVE', 'B_NEGATIVE', 'B_POSITIVE', 'AB_NEGATIVE', 'AB_POSITIVE']
const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}
const PRODUCT_TYPES = [
  { value: 'WHOLE_BLOOD', label: 'Sangre Entera' },
  { value: 'PLATELETS', label: 'Plaquetas' },
  { value: 'PLASMA', label: 'Plasma' },
]
const URGENCY_LEVELS = [
  { value: '1', label: 'Convocatoria' },
  { value: '2', label: 'Urgente' },
  { value: '3', label: 'Crítica' },
]

export default function NewEmergencyRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    hospitalName: '',
    city: '',
    region: '',
    address: '',
    latitude: '',
    longitude: '',
    bloodType: 'O_NEGATIVE',
    productType: 'WHOLE_BLOOD',
    unitsNeeded: '1',
    urgencyLevel: '2',
    notes: '',
    requesterName: '',
    requesterPhone: '',
  })

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const body: Record<string, any> = {
      hospitalName: form.hospitalName,
      city: form.city,
      bloodType: form.bloodType,
      productType: form.productType,
      unitsNeeded: parseInt(form.unitsNeeded, 10),
      urgencyLevel: parseInt(form.urgencyLevel, 10),
    }
    if (form.region) body.region = form.region
    if (form.address) body.address = form.address
    if (form.latitude) body.latitude = parseFloat(form.latitude)
    if (form.longitude) body.longitude = parseFloat(form.longitude)
    if (form.notes) body.notes = form.notes
    if (form.requesterName) body.requesterName = form.requesterName
    if (form.requesterPhone) body.requesterPhone = form.requesterPhone

    try {
      const res = await apiFetch('/emergency-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Error al registrar la solicitud')
        return
      }
      const created = await res.json()
      router.push(`/emergency/${created.id}`)
    } catch {
      setError('Error de red. Verifica que la API esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a Emergencias
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Nueva solicitud de emergencia</h1>
        <p className="text-muted-foreground text-sm mt-1">Registra un requerimiento de sangre que no se puede cubrir con el inventario actual</p>
      </div>

      <form onSubmit={submit} className="bg-card rounded-md border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Hospital / centro *</label>
          <input
            required
            value={form.hospitalName}
            onChange={(e) => set('hospitalName', e.target.value)}
            placeholder="Ej: Hospital Regional Universitario José María Cabral y Báez"
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ciudad *</label>
            <input
              required
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Ej: Santiago"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Región</label>
            <input
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              placeholder="Ej: Cibao Norte"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Dirección</label>
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Ej: Av. Rómulo Betancourt, Santiago"
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Latitud</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => set('latitude', e.target.value)}
              placeholder="19.4517"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Longitud</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => set('longitude', e.target.value)}
              placeholder="-70.6970"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tipo de sangre requerido *</label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => set('bloodType', bt)}
                className={`py-2 rounded-md border-2 text-sm font-mono font-semibold transition-colors ${
                  form.bloodType === bt
                    ? 'border-primary bg-blood-50 text-primary'
                    : 'border-input text-muted-foreground hover:border-border'
                }`}
              >
                {BLOOD_LABELS[bt]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Producto *</label>
          <div className="grid grid-cols-3 gap-2">
            {PRODUCT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('productType', value)}
                className={`py-2 rounded-md border-2 text-sm font-medium transition-colors ${
                  form.productType === value
                    ? 'border-primary bg-blood-50 text-primary'
                    : 'border-input text-muted-foreground hover:border-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Unidades necesarias *</label>
            <input
              required
              type="number"
              min="1"
              value={form.unitsNeeded}
              onChange={(e) => set('unitsNeeded', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Urgencia *</label>
            <select
              value={form.urgencyLevel}
              onChange={(e) => set('urgencyLevel', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {URGENCY_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Solicitante</label>
            <input
              value={form.requesterName}
              onChange={(e) => set('requesterName', e.target.value)}
              placeholder="Nombre de quien solicita"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Teléfono del solicitante</label>
            <input
              value={form.requesterPhone}
              onChange={(e) => set('requesterPhone', e.target.value)}
              placeholder="809-000-0000"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Notas</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Contexto adicional para los donantes o el equipo..."
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          />
        </div>

        {error && (
          <div className="bg-alert/5 border border-alert/30 text-alert text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-blood-600 text-primary-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? 'Registrando…' : 'Registrar y ver candidatos'}
          </button>
        </div>
      </form>
    </div>
  )
}

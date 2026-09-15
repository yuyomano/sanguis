'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

export default function NewBloodUnitPage() {
  const router = useRouter()

  const [locations, setLocations] = useState<any[]>([])
  const [donorSearch, setDonorSearch] = useState('')
  const [donors, setDonors] = useState<any[]>([])
  const [selectedDonor, setSelectedDonor] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const [form, setForm] = useState({
    bloodType: '',
    rhFactor: 'true',
    productType: 'WHOLE_BLOOD',
    volumeMl: '450',
    bagNumber: '',
    storageLocationId: '',
    storageShelf: '',
    collectionDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    apiFetch('/blood-units/locations')
      .then(r => r.json()).then(setLocations).catch(() => {})

    // Auto-generate bag number
    const pad = (n: number) => String(n).padStart(4, '0')
    const now = new Date()
    setForm(f => ({ ...f, bagNumber: `SNG-${now.getFullYear()}-${pad(Math.floor(Math.random() * 9999))}` }))

    // Pre-fill donor from query param
    const params = new URLSearchParams(window.location.search)
    const prefilledDonorId = params.get('donorId')
    if (prefilledDonorId) {
      apiFetch(`/donors/${prefilledDonorId}`)
        .then(r => r.json())
        .then(donor => {
          if (donor?.id) {
            setSelectedDonor(donor)
            setDonorSearch(donor.name)
            setForm(f => ({ ...f, bloodType: donor.bloodType, rhFactor: String(donor.rhFactor) }))
          }
        })
        .catch(() => {})
    }
  }, [])

  async function searchDonors() {
    if (!donorSearch.trim()) return
    setSearching(true)
    try {
      const res = await apiFetch(`/donors?search=${encodeURIComponent(donorSearch)}&limit=5`)
      const data = await res.json()
      setDonors(data.donors || [])
    } catch {}
    setSearching(false)
  }

  function selectDonor(donor: any) {
    setSelectedDonor(donor)
    setDonors([])
    setDonorSearch(donor.name)
    setForm(f => ({ ...f, bloodType: donor.bloodType, rhFactor: String(donor.rhFactor) }))
  }

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDonor) { setError('Selecciona un donante'); return }
    setLoading(true)
    setError(null)

    const body: Record<string, any> = {
      donorId: selectedDonor.id,
      bagNumber: form.bagNumber,
      bloodType: form.bloodType,
      rhFactor: form.rhFactor === 'true',
      productType: form.productType,
      volumeMl: parseInt(form.volumeMl, 10),
      collectionDate: new Date(form.collectionDate).toISOString(),
    }
    if (form.storageLocationId) body.storageLocationId = form.storageLocationId
    if (form.storageShelf) body.storageShelf = form.storageShelf

    try {
      const res = await apiFetch('/blood-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(Array.isArray(data.message) ? data.message.join(', ') : data.message)
        return
      }
      router.push('/inventory')
    } catch {
      setError('Error de red. Verifica que la API esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a inventario
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Registrar donación</h1>
        <p className="text-muted-foreground text-sm mt-1">Nueva unidad de sangre recolectada</p>
      </div>

      <form onSubmit={submit} className="bg-card rounded-md border border-border p-6 space-y-5">
        {/* Donor search */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Donante *</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              value={donorSearch}
              onChange={(e) => { setDonorSearch(e.target.value); if (!e.target.value) setSelectedDonor(null) }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchDonors())}
              placeholder="Buscar por nombre, cédula o teléfono (Enter para buscar)"
              className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          {searching && <p className="text-xs text-muted-foreground/70 mt-1">Buscando...</p>}
          {donors.length > 0 && (
            <div className="mt-1 border border-border rounded-md overflow-hidden shadow-sm">
              {donors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDonor(d)}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center justify-between text-sm border-b border-border last:border-0"
                >
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.idNumber} · {BLOOD_LABELS[d.bloodType]}</span>
                </button>
              ))}
            </div>
          )}
          {selectedDonor && (
            <div className="mt-2 flex items-center gap-2 text-sm text-clinical-success bg-clinical-success/10 px-3 py-2 rounded-md">
              ✓ {selectedDonor.name} · {BLOOD_LABELS[selectedDonor.bloodType]} · {selectedDonor.category}
            </div>
          )}
        </div>

        {/* Bag number */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Número de bolsa *</label>
          <input
            required
            value={form.bagNumber}
            onChange={(e) => set('bagNumber', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        {/* Blood type + Rh */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tipo de sangre *</label>
            <select
              required
              value={form.bloodType}
              onChange={(e) => set('bloodType', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar</option>
              {Object.entries(BLOOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Factor Rh *</label>
            <select
              value={form.rhFactor}
              onChange={(e) => set('rhFactor', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="true">Positivo (+)</option>
              <option value="false">Negativo (−)</option>
            </select>
          </div>
        </div>

        {/* Product type + Volume */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Producto *</label>
            <select
              value={form.productType}
              onChange={(e) => {
                const defaults: Record<string, string> = { WHOLE_BLOOD: '450', PLATELETS: '300', PLASMA: '250' }
                set('productType', e.target.value)
                set('volumeMl', defaults[e.target.value] || '450')
              }}
              className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="WHOLE_BLOOD">Sangre Entera</option>
              <option value="PLATELETS">Plaquetas</option>
              <option value="PLASMA">Plasma</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Volumen (mL) *</label>
            <input
              required
              type="number"
              min="100"
              value={form.volumeMl}
              onChange={(e) => set('volumeMl', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Collection date */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Fecha de recolección *</label>
          <input
            required
            type="date"
            value={form.collectionDate}
            onChange={(e) => set('collectionDate', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Storage */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ubicación de almacenamiento</label>
            <select
              value={form.storageLocationId}
              onChange={(e) => set('storageLocationId', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin asignar</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Estante / Posición</label>
            <input
              value={form.storageShelf}
              onChange={(e) => set('storageShelf', e.target.value)}
              placeholder="Ej: A-01"
              className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {error && (
          <div className="bg-alert/5 border border-alert/30 text-alert text-sm px-4 py-3 rounded-md">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60">
            {loading ? 'Registrando...' : 'Registrar donación'}
          </button>
        </div>
      </form>
    </div>
  )
}

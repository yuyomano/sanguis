'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, X, Droplets } from 'lucide-react'

interface BloodUnit {
  id: string
  bagNumber: string
  bloodType: string
  productType: string
  volumeMl: number
  status: string
  donor: { name: string }
  storageLocation?: { name: string }
}

interface Vehicle { id: string; plate: string; type: string; driverName: string }
interface Protocol { id: string; name: string; description?: string }

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Entera',
  PLATELETS: 'Plaquetas',
  PLASMA: 'Plasma',
}

export default function NewDeliveryPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    destinationName: '',
    destinationAddress: '',
    carrierType: 'OWN',
    vehicleId: '',
    thirdPartyCarrier: '',
    protocolId: '',
    baseCost: '',
    lastMileCost: '',
  })

  const [availableUnits, setAvailableUnits] = useState<BloodUnit[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [unitSearch, setUnitSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    if (!token) { router.replace('/login'); return }
    const api = process.env.NEXT_PUBLIC_API_URL
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${api}/blood-units?limit=200`, { headers }).then((r) => r.json()),
      fetch(`${api}/logistics/vehicles`, { headers }).then((r) => r.json()),
      fetch(`${api}/logistics/protocols`, { headers }).then((r) => r.json()),
    ])
      .then(([unitsData, vehiclesData, protocolsData]) => {
        const units = (unitsData.units || []).filter(
          (u: BloodUnit) => u.status === 'STORED' || u.status === 'APPROVED'
        )
        setAvailableUnits(units)
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
        setProtocols(Array.isArray(protocolsData) ? protocolsData : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleUnit = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredUnits = availableUnits.filter((u) => {
    if (!unitSearch) return true
    const q = unitSearch.toLowerCase()
    return (
      u.bagNumber.toLowerCase().includes(q) ||
      u.donor?.name?.toLowerCase().includes(q) ||
      (BLOOD_LABELS[u.bloodType] || '').toLowerCase().includes(q)
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (selectedIds.size === 0) { setError('Selecciona al menos una unidad de sangre'); return }
    if (form.carrierType === 'OWN' && !form.vehicleId) { setError('Selecciona un vehículo'); return }
    if (form.carrierType === 'THIRD_PARTY' && !form.thirdPartyCarrier.trim()) { setError('Ingresa el nombre del transportista'); return }

    const token = localStorage.getItem('sanguis_token')
    setSubmitting(true)

    const body: Record<string, any> = {
      destinationName: form.destinationName,
      destinationAddress: form.destinationAddress,
      bloodUnitIds: Array.from(selectedIds),
      carrierType: form.carrierType,
    }
    if (form.carrierType === 'OWN' && form.vehicleId) body.vehicleId = form.vehicleId
    if (form.carrierType === 'THIRD_PARTY' && form.thirdPartyCarrier) body.thirdPartyCarrier = form.thirdPartyCarrier
    if (form.protocolId) body.protocolId = form.protocolId
    if (form.baseCost) body.baseCost = parseFloat(form.baseCost)
    if (form.lastMileCost) body.lastMileCost = parseFloat(form.lastMileCost)

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/deliveries`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)

    setSubmitting(false)

    if (!res || !res.ok) {
      const msg = await res?.json().catch(() => ({}))
      setError(msg?.message || 'Error al crear la orden de entrega')
      return
    }

    const data = await res.json()
    router.push(`/logistics/${data.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
      </div>
    )
  }

  const selectedUnits = availableUnits.filter((u) => selectedIds.has(u.id))

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva orden de entrega</h1>
          <p className="text-gray-500 text-sm mt-0.5">Registra el despacho de unidades de sangre</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Destino */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Datos del destinatario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del destino <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.destinationName}
                onChange={(e) => setForm({ ...form, destinationName: e.target.value })}
                placeholder="Ej: Hospital General Plaza de la Salud"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.destinationAddress}
                onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
                placeholder="Ej: Av. Ortega y Gasset, Santo Domingo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
          </div>
        </div>

        {/* Transporte */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tipo de transporte</h2>
          <div className="flex gap-4 mb-4">
            {[
              { value: 'OWN', label: 'Flota propia' },
              { value: 'THIRD_PARTY', label: 'Transportista externo' },
            ].map(({ value, label }) => (
              <label key={value} className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${form.carrierType === value ? 'border-blood-500 bg-blood-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="carrierType"
                  value={value}
                  checked={form.carrierType === value}
                  onChange={() => setForm({ ...form, carrierType: value, vehicleId: '', thirdPartyCarrier: '' })}
                  className="accent-blood-500"
                />
                <span className="text-sm font-medium text-gray-800">{label}</span>
              </label>
            ))}
          </div>

          {form.carrierType === 'OWN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo <span className="text-red-500">*</span></label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
              >
                <option value="">Selecciona un vehículo</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.type} — {v.plate} ({v.driverName})</option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No hay vehículos activos registrados</p>
              )}
            </div>
          )}

          {form.carrierType === 'THIRD_PARTY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del transportista <span className="text-red-500">*</span></label>
              <input
                value={form.thirdPartyCarrier}
                onChange={(e) => setForm({ ...form, thirdPartyCarrier: e.target.value })}
                placeholder="Ej: Fedex República Dominicana"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
          )}

          {protocols.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Protocolo de entrega</label>
              <select
                value={form.protocolId}
                onChange={(e) => setForm({ ...form, protocolId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
              >
                <option value="">Sin protocolo específico</option>
                {protocols.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Unidades de sangre */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Unidades de sangre</h2>
            {selectedIds.size > 0 && (
              <span className="text-sm font-medium text-blood-600 bg-blood-50 px-3 py-1 rounded-full">
                {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Selected summary */}
          {selectedUnits.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedUnits.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blood-50 border border-blood-200 rounded-lg text-xs font-medium text-blood-700">
                  <span className="font-bold">{BLOOD_LABELS[u.bloodType] || u.bloodType}</span>
                  {u.bagNumber}
                  <button type="button" onClick={() => toggleUnit(u.id)} className="ml-1 text-blood-400 hover:text-blood-600">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder="Buscar por bolsa, donante o tipo de sangre…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
            />
          </div>

          {availableUnits.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Droplets size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay unidades disponibles (STORED o APPROVED)</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-10 px-4 py-2"></th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Bolsa</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Donante</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUnits.map((unit) => {
                    const checked = selectedIds.has(unit.id)
                    return (
                      <tr
                        key={unit.id}
                        onClick={() => toggleUnit(unit.id)}
                        className={`cursor-pointer transition-colors ${checked ? 'bg-blood-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            readOnly
                            checked={checked}
                            className="accent-blood-500 w-4 h-4"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blood-500 text-white text-xs font-bold">
                            {BLOOD_LABELS[unit.bloodType] || unit.bloodType}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-800">{unit.bagNumber}</td>
                        <td className="px-3 py-2.5 text-gray-600">{PRODUCT_LABELS[unit.productType] || unit.productType}</td>
                        <td className="px-3 py-2.5 text-gray-600">{unit.donor?.name || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-500">{unit.storageLocation?.name || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Costos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Costos (opcional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo base (RD$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.baseCost}
                onChange={(e) => setForm({ ...form, baseCost: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Última milla (RD$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.lastMileCost}
                onChange={(e) => setForm({ ...form, lastMileCost: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blood-500 text-white rounded-lg text-sm font-medium hover:bg-blood-600 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creando…' : 'Crear orden de entrega'}
          </button>
        </div>
      </form>
    </div>
  )
}

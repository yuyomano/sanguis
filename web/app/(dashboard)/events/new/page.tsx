'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Truck } from 'lucide-react'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    type: 'FIXED',
    locationAddress: '',
    latitude: '',
    longitude: '',
    startDatetime: '',
    endDatetime: '',
    capacity: '50',
    description: '',
  })

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('sanguis_token')

    const body: Record<string, any> = {
      name: form.name,
      type: form.type,
      locationAddress: form.locationAddress,
      startDatetime: new Date(form.startDatetime).toISOString(),
      endDatetime: new Date(form.endDatetime).toISOString(),
      capacity: parseInt(form.capacity, 10),
    }
    if (form.description) body.description = form.description
    if (form.latitude) body.latitude = parseFloat(form.latitude)
    if (form.longitude) body.longitude = parseFloat(form.longitude)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Error al crear el evento')
        return
      }
      router.push('/events')
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
        <ArrowLeft size={16} /> Volver a eventos
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Crear evento de donación</h1>
        <p className="text-muted-foreground text-sm mt-1">Configura una nueva jornada de donación</p>
      </div>

      <form onSubmit={submit} className="bg-card rounded-md border border-border p-6 space-y-5">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tipo de evento</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'FIXED', label: 'Sede fija', icon: CalendarDays },
              { value: 'MOBILE_TRUCK', label: 'Camión móvil', icon: Truck },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('type', value)}
                className={`flex items-center gap-2 p-3 rounded-md border-2 text-sm font-medium transition-colors ${
                  form.type === value
                    ? 'border-primary bg-blood-50 text-primary'
                    : 'border-border text-muted-foreground hover:border-input'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nombre del evento *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Jornada de donación en Plaza Central"
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Dirección *</label>
          <input
            required
            value={form.locationAddress}
            onChange={(e) => set('locationAddress', e.target.value)}
            placeholder="Ej: Av. Independencia 123, Santo Domingo"
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Latitud</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => set('latitude', e.target.value)}
              placeholder="18.4746"
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
              placeholder="-69.9312"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Inicio *</label>
            <input
              required
              type="datetime-local"
              value={form.startDatetime}
              onChange={(e) => set('startDatetime', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Fin *</label>
            <input
              required
              type="datetime-local"
              value={form.endDatetime}
              onChange={(e) => set('endDatetime', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Capacidad (donantes) *</label>
          <input
            required
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => set('capacity', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Descripción para los donantes..."
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
            className="flex-1 px-4 py-2.5 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? 'Creando...' : 'Crear evento'}
          </button>
        </div>
      </form>
    </div>
  )
}

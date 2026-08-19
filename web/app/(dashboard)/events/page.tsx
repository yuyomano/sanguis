'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, Users, Truck } from 'lucide-react'

interface Event {
  id: string
  name: string
  type: 'FIXED' | 'MOBILE_TRUCK'
  locationAddress: string
  startDatetime: string
  endDatetime: string
  capacity: number
  registeredCount: number
  status: string
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ACTIVE:    'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  ACTIVE:    'Activo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function sendBroadcast(id: string) {
    const token = localStorage.getItem('sanguis_token')
    setNotifyingId(null)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/events/${id}/broadcast`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
    setNotifiedIds((prev) => new Set(prev).add(id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos de Donación</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} eventos</p>
        </div>
        <a
          href="/events/new"
          className="bg-blood-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          + Crear evento
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
              <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays size={40} className="text-gray-300 mb-4" />
          <p className="text-gray-400 font-medium">No hay eventos registrados</p>
          <p className="text-gray-300 text-sm mt-1 mb-4">Crea el primer evento de donación</p>
          <a
            href="/events/new"
            className="bg-blood-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blood-600 transition-colors"
          >
            Crear evento
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {event.type === 'MOBILE_TRUCK' ? (
                    <Truck size={18} className="text-blood-500" />
                  ) : (
                    <CalendarDays size={18} className="text-blue-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {event.type === 'MOBILE_TRUCK' ? 'Camión móvil' : 'Sede fija'}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[event.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[event.status] || event.status}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{event.name}</h3>

              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span className="truncate">{event.locationAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} />
                  <span>{new Date(event.startDatetime).toLocaleDateString('es-DO', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{event.registeredCount} / {event.capacity} registrados</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blood-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <a
                  href={`/events/${event.id}`}
                  className="flex-1 text-center text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Ver detalle
                </a>

                {notifiedIds.has(event.id) ? (
                  <span className="flex-1 text-center text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg">
                    Enviado ✓
                  </span>
                ) : notifyingId === event.id ? (
                  <div className="flex-1 flex gap-1">
                    <button
                      onClick={() => sendBroadcast(event.id)}
                      className="flex-1 text-xs bg-blood-500 text-white px-2 py-1.5 rounded-lg hover:bg-blood-600 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setNotifyingId(null)}
                      className="flex-1 text-xs border border-gray-300 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNotifyingId(event.id)}
                    className="flex-1 text-sm bg-blood-50 text-blood-600 px-3 py-1.5 rounded-lg hover:bg-blood-100 transition-colors"
                  >
                    Notificar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

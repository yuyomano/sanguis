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
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos de Donación</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} eventos</p>
        </div>
        <a
          href="/events/new"
          className="bg-blood-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blood-600 transition"
        >
          + Crear evento
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[event.status]}`}>
                  {event.status}
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

              {/* Capacity bar */}
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
                  className="flex-1 text-center text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-gray-700"
                >
                  Ver detalle
                </a>
                <button
                  onClick={() => {
                    if (confirm('¿Enviar notificación a todos los donantes?')) {
                      const token = localStorage.getItem('sanguis_token')
                      fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/events/${event.id}/broadcast`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                      })
                    }
                  }}
                  className="flex-1 text-sm bg-blood-50 text-blood-600 px-3 py-1.5 rounded-lg hover:bg-blood-100 transition"
                >
                  Notificar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

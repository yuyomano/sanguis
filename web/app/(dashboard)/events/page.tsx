'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, MapPin, Users, Truck } from 'lucide-react'
import { apiFetch } from '@/lib/api'

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
  SCHEDULED: 'bg-blood-50 text-primary',
  ACTIVE:    'bg-clinical-success/15 text-clinical-success',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-alert/15 text-alert',
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
    apiFetch('/events')
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function sendBroadcast(id: string) {
    setNotifyingId(null)
    await apiFetch(`/notifications/events/${id}/broadcast`, { method: 'POST' }).catch(() => {})
    setNotifiedIds((prev) => new Set(prev).add(id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Eventos de donación</h1>
          <p className="text-muted-foreground text-sm mt-1">{events.length} eventos</p>
        </div>
        <a
          href="/events/new"
          className="bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          + Crear evento
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-md border border-border p-6 space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays size={40} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground/70 font-medium">No hay eventos registrados</p>
          <p className="text-muted-foreground/40 text-sm mt-1 mb-4">Crea el primer evento de donación</p>
          <a
            href="/events/new"
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blood-600 transition-colors"
          >
            Crear evento
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card rounded-md border border-border p-6 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {event.type === 'MOBILE_TRUCK' ? (
                    <Truck size={18} className="text-primary" />
                  ) : (
                    <CalendarDays size={18} className="text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {event.type === 'MOBILE_TRUCK' ? 'Camión móvil' : 'Sede fija'}
                  </span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[event.status] || 'bg-muted text-muted-foreground'}`}>
                  {STATUS_LABELS[event.status] || event.status}
                </span>
              </div>

              <h3 className="font-semibold text-foreground mb-2">{event.name}</h3>

              <div className="space-y-1.5 text-sm text-muted-foreground">
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
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <a
                  href={`/events/${event.id}`}
                  className="flex-1 text-center text-sm border border-input px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-foreground"
                >
                  Ver detalle
                </a>

                {notifiedIds.has(event.id) ? (
                  <span className="flex-1 text-center text-sm bg-clinical-success/10 text-clinical-success px-3 py-1.5 rounded-md">
                    Enviado ✓
                  </span>
                ) : notifyingId === event.id ? (
                  <div className="flex-1 flex gap-1">
                    <button
                      onClick={() => sendBroadcast(event.id)}
                      className="flex-1 text-xs bg-primary text-white px-2 py-1.5 rounded-md hover:bg-blood-600 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setNotifyingId(null)}
                      className="flex-1 text-xs border border-input px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNotifyingId(event.id)}
                    className="flex-1 text-sm bg-blood-50 text-primary px-3 py-1.5 rounded-md hover:bg-blood-100 transition-colors"
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

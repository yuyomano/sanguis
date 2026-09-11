'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CalendarDays, MapPin, Users, Truck,
  CheckCircle, Clock, XCircle, Bell,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

const STATUS_EVENT_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blood-50 text-primary',
  ACTIVE: 'bg-clinical-success/15 text-clinical-success',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-alert/15 text-alert',
}
const STATUS_EVENT_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado', ACTIVE: 'Activo', COMPLETED: 'Completado', CANCELLED: 'Cancelado',
}
const APPT_STATUS: Record<string, { label: string; style: string; icon: any }> = {
  SCHEDULED: { label: 'Pendiente', style: 'bg-muted text-muted-foreground', icon: Clock },
  CHECKED_IN: { label: 'Presente', style: 'bg-clinical-success/15 text-clinical-success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', style: 'bg-alert/15 text-alert', icon: XCircle },
  NO_SHOW: { label: 'No se presentó', style: 'bg-muted text-muted-foreground', icon: XCircle },
  COMPLETED: { label: 'Completada', style: 'bg-blood-50 text-primary', icon: CheckCircle },
}
const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}
const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre completa', PLATELETS: 'Plaquetas', PLASMA: 'Plasma',
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null)
  const [confirmBroadcast, setConfirmBroadcast] = useState(false)

  useEffect(() => {
    apiFetch(`/events/${id}`)
      .then(r => r.json())
      .then(setEvent)
      .finally(() => setLoading(false))
  }, [id])

  async function broadcast() {
    setBroadcasting(true)
    setConfirmBroadcast(false)
    setBroadcastResult(null)
    try {
      const res = await apiFetch(`/notifications/events/${id}/broadcast`, { method: 'POST' })
      const data = await res.json()
      setBroadcastResult(`Notificación enviada a ${data.notified ?? '—'} donantes`)
    } catch {
      setBroadcastResult('Error al enviar notificaciones')
    } finally {
      setBroadcasting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" /></div>
  }
  if (!event || event.message) {
    return <div className="p-8 text-center text-muted-foreground">Evento no encontrado.</div>
  }

  const pct = event.capacity > 0 ? Math.min((event.registeredCount / event.capacity) * 100, 100) : 0

  return (
    <div className="p-8 max-w-5xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a eventos
      </button>

      {/* Event header */}
      <div className="bg-card rounded-md border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {event.type === 'MOBILE_TRUCK'
              ? <Truck size={22} className="text-primary" />
              : <CalendarDays size={22} className="text-muted-foreground" />}
            <div>
              <h1 className="font-display text-xl font-semibold text-foreground">{event.name}</h1>
              <p className="text-sm text-muted-foreground">
                {event.type === 'MOBILE_TRUCK' ? 'Camión móvil' : 'Sede fija'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_EVENT_STYLES[event.status]}`}>
              {STATUS_EVENT_LABELS[event.status] || event.status}
            </span>
            {confirmBroadcast ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">¿Notificar a todos?</span>
                <button onClick={broadcast} className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-semibold hover:bg-blood-600 transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setConfirmBroadcast(false)} className="px-3 py-1.5 border border-input text-muted-foreground rounded-md text-xs hover:bg-muted/50 transition-colors">
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmBroadcast(true)}
                disabled={broadcasting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blood-50 hover:bg-blood-100 text-primary rounded-md text-sm font-medium transition-colors"
              >
                <Bell size={14} /> {broadcasting ? 'Enviando…' : 'Notificar'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-muted-foreground/70 mt-0.5 shrink-0" />
            <span className="text-foreground">{event.locationAddress}</span>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays size={15} className="text-muted-foreground/70 mt-0.5 shrink-0" />
            <span className="text-foreground">
              {new Date(event.startDatetime).toLocaleDateString('es-DO', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Users size={15} className="text-muted-foreground/70 mt-0.5 shrink-0" />
            <span className="text-foreground">{event.registeredCount} / {event.capacity} registrados</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Ocupación</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-alert' : pct >= 70 ? 'bg-plasma' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {broadcastResult && (
          <div className="mt-4 bg-clinical-success/5 border border-clinical-success/30 text-clinical-success text-sm px-4 py-2 rounded-md">
            {broadcastResult}
          </div>
        )}

        {event.description && (
          <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{event.description}</p>
        )}
      </div>

      {/* Appointments */}
      <div className="bg-card rounded-md border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">
            Citas registradas ({event.appointments?.length ?? 0})
          </h2>
        </div>
        {event.appointments?.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground/70">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin citas registradas aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Donante</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Contacto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Producto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Hora</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {event.appointments.map((appt: any) => {
                const status = APPT_STATUS[appt.status] || { label: appt.status, style: 'bg-muted text-foreground', icon: Clock }
                const StatusIcon = status.icon
                return (
                  <tr key={appt.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-foreground">{appt.donor?.name}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{appt.donor?.phone}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-xs font-bold">
                        {BLOOD_LABELS[appt.donor?.bloodType] || '?'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">
                      {PRODUCT_LABELS[appt.productType] || appt.productType}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {appt.scheduledTime
                        ? new Date(appt.scheduledTime).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.style}`}>
                        <StatusIcon size={11} /> {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <code className="text-xs text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded">
                        {appt.qrCode?.slice(0, 12)}…
                      </code>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

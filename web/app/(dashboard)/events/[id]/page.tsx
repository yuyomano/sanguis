'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CalendarDays, MapPin, Users, Truck,
  CheckCircle, Clock, XCircle, Bell,
} from 'lucide-react'

const STATUS_EVENT_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
}
const APPT_STATUS: Record<string, { label: string; style: string; icon: any }> = {
  SCHEDULED: { label: 'Pendiente', style: 'bg-blue-100 text-blue-700', icon: Clock },
  CHECKED_IN: { label: 'Presente', style: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', style: 'bg-red-100 text-red-600', icon: XCircle },
  NO_SHOW: { label: 'No se presentó', style: 'bg-gray-100 text-gray-500', icon: XCircle },
  COMPLETED: { label: 'Completada', style: 'bg-purple-100 text-purple-700', icon: CheckCircle },
}
const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null)
  const [confirmBroadcast, setConfirmBroadcast] = useState(false)

  const token = () => localStorage.getItem('sanguis_token')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(setEvent)
      .finally(() => setLoading(false))
  }, [id])

  async function broadcast() {
    setBroadcasting(true)
    setConfirmBroadcast(false)
    setBroadcastResult(null)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/events/${id}/broadcast`,
        { method: 'POST', headers: { Authorization: `Bearer ${token()}` } },
      )
      const data = await res.json()
      setBroadcastResult(`Notificación enviada a ${data.notified ?? '—'} donantes`)
    } catch {
      setBroadcastResult('Error al enviar notificaciones')
    } finally {
      setBroadcasting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" /></div>
  }
  if (!event || event.message) {
    return <div className="p-8 text-center text-gray-500">Evento no encontrado.</div>
  }

  const pct = event.capacity > 0 ? Math.min((event.registeredCount / event.capacity) * 100, 100) : 0

  return (
    <div className="p-8 max-w-5xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a Eventos
      </button>

      {/* Event header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {event.type === 'MOBILE_TRUCK'
              ? <Truck size={22} className="text-blood-500" />
              : <CalendarDays size={22} className="text-blue-500" />}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-sm text-gray-500">
                {event.type === 'MOBILE_TRUCK' ? 'Camión móvil' : 'Sede fija'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_EVENT_STYLES[event.status]}`}>
              {event.status}
            </span>
            {confirmBroadcast ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">¿Notificar a todos?</span>
                <button onClick={broadcast} className="px-3 py-1.5 bg-blood-500 text-white rounded-lg text-xs font-semibold hover:bg-blood-600 transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setConfirmBroadcast(false)} className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmBroadcast(true)}
                disabled={broadcasting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blood-50 hover:bg-blood-100 text-blood-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Bell size={14} /> {broadcasting ? 'Enviando…' : 'Notificar'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <span className="text-gray-700">{event.locationAddress}</span>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <span className="text-gray-700">
              {new Date(event.startDatetime).toLocaleDateString('es-DO', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Users size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <span className="text-gray-700">{event.registeredCount} / {event.capacity} registrados</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Ocupación</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-blood-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {broadcastResult && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg">
            {broadcastResult}
          </div>
        )}

        {event.description && (
          <p className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">{event.description}</p>
        )}
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Citas registradas ({event.appointments?.length ?? 0})
          </h2>
        </div>
        {event.appointments?.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Sin citas registradas aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Donante</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Hora</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {event.appointments.map((appt: any) => {
                const status = APPT_STATUS[appt.status] || { label: appt.status, style: 'bg-gray-100 text-gray-700', icon: Clock }
                const StatusIcon = status.icon
                return (
                  <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{appt.donor?.name}</p>
                      <p className="text-xs text-gray-400">{appt.donor?.phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blood-500 text-white text-xs font-bold">
                        {BLOOD_LABELS[appt.donor?.bloodType] || '?'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
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
                      <code className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Siren, Plus, MapPin } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface EmergencyRequest {
  id: string
  hospitalName: string
  city: string
  bloodType: string
  productType: string
  unitsNeeded: number
  urgencyLevel: number
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED'
  targetReachedCount: number
  createdAt: string
}

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Entera', PLATELETS: 'Plaquetas', PLASMA: 'Plasma',
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-alert/15 text-alert',
  FULFILLED: 'bg-clinical-success/15 text-clinical-success',
  CANCELLED: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierta', FULFILLED: 'Atendida', CANCELLED: 'Cancelada',
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-3.5 bg-muted rounded animate-pulse" style={{ width: j === 0 ? 140 : 64 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function EmergencyRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/emergency-requests')
      .then((r) => r.json())
      .then((data) => { setRequests(data.requests || []); setTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Solicitudes de emergencia</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} solicitudes registradas</p>
        </div>
        <button
          onClick={() => router.push('/emergency/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blood-600 text-primary-foreground rounded-md text-sm font-medium transition-colors active:scale-[0.98]"
        >
          <Plus size={16} /> Nueva solicitud
        </button>
      </div>

      <div className="bg-card rounded-md border border-border overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hospital / centro</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unidades</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notificados</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <SkeletonRows />
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <Siren size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm font-medium">Sin solicitudes registradas</p>
                  <p className="text-muted-foreground/70 text-xs mt-1">Registra una solicitud cuando un hospital pida sangre</p>
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/emergency/${r.id}`)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground text-sm">{r.hospitalName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {r.city}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blood-50 text-primary text-xs font-mono font-medium">
                      {BLOOD_LABELS[r.bloodType] || r.bloodType}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">{PRODUCT_LABELS[r.productType] || r.productType}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground tabular-nums">{r.unitsNeeded}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground tabular-nums">{r.targetReachedCount}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

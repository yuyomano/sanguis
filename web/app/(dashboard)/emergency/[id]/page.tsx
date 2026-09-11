'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Phone, Mail, Download, Bell,
  CheckCircle, XCircle, RotateCcw, Navigation,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}
const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Entera', PLATELETS: 'Plaquetas', PLASMA: 'Plasma',
}
const CATEGORY_LABELS: Record<string, string> = {
  VIP: 'VIP', RECURRENT: 'Recurrente', CASUAL: 'Casual',
}
const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-alert/15 text-alert',
  FULFILLED: 'bg-clinical-success/15 text-clinical-success',
  CANCELLED: 'bg-muted text-muted-foreground',
}
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierta', FULFILLED: 'Atendida', CANCELLED: 'Cancelada',
}
const CHANNELS = [
  { value: 'PUSH', label: 'Push' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
]

interface Candidate {
  id: string
  name: string
  phone: string
  email: string | null
  bloodType: string
  category: string
  city: string | null
  distanceKm: number | null
}

function csvEscape(v: unknown) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function EmergencyRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState('')
  const [radiusFilter, setRadiusFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [channels, setChannels] = useState<Set<string>>(new Set(['WHATSAPP']))
  const [confirmNotify, setConfirmNotify] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [notifyResult, setNotifyResult] = useState<string | null>(null)

  function loadRequest() {
    return apiFetch(`/emergency-requests/${id}`)
      .then((r) => r.json())
      .then(setRequest)
  }

  function loadCandidates() {
    setCandidatesLoading(true)
    const params = new URLSearchParams()
    if (cityFilter) params.set('city', cityFilter)
    if (radiusFilter) params.set('maxDistanceKm', radiusFilter)
    return apiFetch(`/emergency-requests/${id}/candidates?${params}`)
      .then((r) => r.json())
      .then((data) => setCandidates(data.candidates || []))
      .finally(() => setCandidatesLoading(false))
  }

  useEffect(() => { loadRequest().finally(() => setLoading(false)) }, [id])
  useEffect(() => { loadCandidates() }, [id, cityFilter, radiusFilter])

  async function changeStatus(status: string) {
    await apiFetch(`/emergency-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadRequest()
  }

  function toggleSelected(donorId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(donorId) ? next.delete(donorId) : next.add(donorId)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === candidates.length ? new Set() : new Set(candidates.map((c) => c.id))))
  }

  function toggleChannel(ch: string) {
    setChannels((prev) => {
      const next = new Set(prev)
      next.has(ch) ? next.delete(ch) : next.add(ch)
      return next
    })
  }

  function exportCsv() {
    const rows = candidates.filter((c) => selected.size === 0 || selected.has(c.id))
    const header = ['Nombre', 'Teléfono', 'Email', 'Tipo de sangre', 'Categoría', 'Ciudad', 'Distancia (km)']
    const lines = [header, ...rows.map((c) => [
      c.name, c.phone, c.email || '', BLOOD_LABELS[c.bloodType] || c.bloodType,
      CATEGORY_LABELS[c.category] || c.category, c.city || '', c.distanceKm ?? '',
    ])].map((r) => r.map(csvEscape).join(','))
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidatos-${request?.hospitalName || id}.csv`.replace(/\s+/g, '-')
    a.click()
    URL.revokeObjectURL(url)
  }

  async function notify() {
    if (selected.size === 0 || channels.size === 0) return
    setNotifying(true)
    setConfirmNotify(false)
    setNotifyResult(null)
    try {
      const res = await apiFetch(`/emergency-requests/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donorIds: Array.from(selected), channels: Array.from(channels) }),
      })
      const data = await res.json()
      setNotifyResult(`Enviado a ${data.sent ?? 0} de ${(data.sent ?? 0) + (data.failed ?? 0)} intentos`)
      loadRequest()
    } catch {
      setNotifyResult('Error al enviar notificaciones')
    } finally {
      setNotifying(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" /></div>
  }
  if (!request || request.message) {
    return <div className="p-8 text-center text-muted-foreground">Solicitud no encontrada.</div>
  }

  return (
    <div className="p-8 max-w-5xl">
      <button onClick={() => router.push('/emergency')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a Emergencias
      </button>

      {/* Request header */}
      <div className="bg-card rounded-md border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">{request.hospitalName}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin size={13} /> {request.city}{request.region ? `, ${request.region}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[request.status]}`}>
              {STATUS_LABELS[request.status] || request.status}
            </span>
            {request.status !== 'FULFILLED' && (
              <button onClick={() => changeStatus('FULFILLED')} className="flex items-center gap-1.5 px-3 py-1.5 bg-clinical-success/10 hover:bg-clinical-success/20 text-clinical-success rounded-md text-xs font-medium transition-colors">
                <CheckCircle size={13} /> Marcar atendida
              </button>
            )}
            {request.status !== 'CANCELLED' && (
              <button onClick={() => changeStatus('CANCELLED')} className="flex items-center gap-1.5 px-3 py-1.5 bg-alert/5 hover:bg-alert/15 text-alert rounded-md text-xs font-medium transition-colors">
                <XCircle size={13} /> Cancelar
              </button>
            )}
            {request.status !== 'OPEN' && (
              <button onClick={() => changeStatus('OPEN')} className="flex items-center gap-1.5 px-3 py-1.5 border border-input text-muted-foreground rounded-md text-xs font-medium hover:bg-muted transition-colors">
                <RotateCcw size={13} /> Reabrir
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo requerido</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blood-50 text-primary text-xs font-mono font-medium">
              {BLOOD_LABELS[request.bloodType] || request.bloodType}
            </span>
            <span className="text-xs text-muted-foreground ml-2">{PRODUCT_LABELS[request.productType]}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Unidades</p>
            <p className="text-foreground font-medium tabular-nums">{request.unitsNeeded}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notificados</p>
            <p className="text-foreground font-medium tabular-nums">{request.targetReachedCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Registrada</p>
            <p className="text-foreground">{new Date(request.createdAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {(request.requesterName || request.notes) && (
          <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground space-y-1">
            {request.requesterName && <p>Solicitante: {request.requesterName} {request.requesterPhone && `— ${request.requesterPhone}`}</p>}
            {request.notes && <p>{request.notes}</p>}
          </div>
        )}
      </div>

      {/* Candidates */}
      <div className="bg-card rounded-md border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Candidatos ({candidates.length})</h2>
          <div className="flex items-center gap-2">
            <input
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filtrar por ciudad"
              className="px-2.5 py-1.5 border border-input rounded-md text-xs w-32 focus:ring-2 focus:ring-primary outline-none"
            />
            <div className="flex items-center gap-1">
              <Navigation size={13} className="text-muted-foreground" />
              <input
                type="number"
                min="0"
                value={radiusFilter}
                onChange={(e) => setRadiusFilter(e.target.value)}
                placeholder="Radio km"
                className="px-2.5 py-1.5 border border-input rounded-md text-xs w-20 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button
              onClick={exportCsv}
              disabled={candidates.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-input rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Download size={13} /> CSV{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>
        </div>

        {candidatesLoading ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Buscando candidatos…</div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground/70">
            <p className="text-sm">Sin donantes compatibles y elegibles con estos filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 w-8">
                    <input type="checkbox" checked={selected.size === candidates.length} onChange={toggleSelectAll} />
                  </th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-muted-foreground uppercase">Donante</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-muted-foreground uppercase">Categoría</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-muted-foreground uppercase">Ciudad</th>
                  <th className="text-left px-2 py-3 text-xs font-semibold text-muted-foreground uppercase">Distancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelected(c.id)} />
                    </td>
                    <td className="px-2 py-3">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground/70 flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><Phone size={10} /> {c.phone}</span>
                        {c.email && <span className="flex items-center gap-0.5"><Mail size={10} /> {c.email}</span>}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blood-50 text-primary text-xs font-mono font-medium">
                        {BLOOD_LABELS[c.bloodType] || c.bloodType}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{CATEGORY_LABELS[c.category] || c.category}</td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{c.city || '—'}</td>
                    <td className="px-2 py-3 text-sm text-muted-foreground tabular-nums">{c.distanceKm != null ? `${c.distanceKm} km` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notify bar */}
        {candidates.length > 0 && (
          <div className="px-5 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Canales:</span>
              {CHANNELS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleChannel(value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    channels.has(value) ? 'border-primary bg-blood-50 text-primary' : 'border-input text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {confirmNotify ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">¿Notificar a {selected.size} donante(s)?</span>
                <button onClick={notify} className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-semibold hover:bg-blood-600 transition-colors">
                  Confirmar
                </button>
                <button onClick={() => setConfirmNotify(false)} className="px-3 py-1.5 border border-input text-muted-foreground rounded-md text-xs hover:bg-muted/50 transition-colors">
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmNotify(true)}
                disabled={selected.size === 0 || channels.size === 0 || notifying}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blood-50 hover:bg-blood-100 text-primary rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Bell size={14} /> {notifying ? 'Enviando…' : `Notificar (${selected.size})`}
              </button>
            )}
          </div>
        )}

        {notifyResult && (
          <div className="mx-5 mb-4 bg-clinical-success/5 border border-clinical-success/30 text-clinical-success text-sm px-4 py-2 rounded-md">
            {notifyResult}
          </div>
        )}
      </div>
    </div>
  )
}

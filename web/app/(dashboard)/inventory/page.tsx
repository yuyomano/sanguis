'use client'

import { useEffect, useRef, useState } from 'react'
import { Droplets, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface BloodUnit {
  id: string
  bagNumber: string
  bloodType: string
  rhFactor: boolean
  productType: string
  volumeMl: number
  status: string
  expirationDate: string
  donor: { name: string; bloodType: string }
  storageLocation?: { name: string }
}

const STATUS_STYLES: Record<string, string> = {
  STORED:    'bg-clinical-success/15 text-clinical-success',
  APPROVED:  'bg-clinical-success/15 text-clinical-success',
  QUARANTINE:'bg-plasma/15 text-plasma',
  ALLOCATED: 'bg-blood-50 text-primary',
  REJECTED:  'bg-alert/15 text-alert',
  USED:      'bg-muted text-muted-foreground',
  DISCARDED: 'bg-muted text-muted-foreground/70',
  TESTING:   'bg-platelet/15 text-platelet',
  COLLECTED: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<string, string> = {
  STORED:    'Almacenada',
  APPROVED:  'Aprobada',
  QUARANTINE:'Cuarentena',
  ALLOCATED: 'Asignada',
  REJECTED:  'Rechazada',
  USED:      'Usada',
  DISCARDED: 'Descartada',
  TESTING:   'En análisis',
  COLLECTED: 'Recolectada',
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS)

const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Entera',
  PLATELETS:   'Plaquetas',
  PLASMA:      'Plasma',
}

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 bg-muted rounded animate-pulse" style={{ width: j === 0 ? '60%' : j === cols - 1 ? '40%' : '70%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function InventoryPage() {
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('STORED')
  const [productType, setProductType] = useState('')
  const [bloodType, setBloodType] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const LIMIT = 25
  const requestSeq = useRef(0)

  function refetch() {
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (status) params.set('status', status)
    if (productType) params.set('productType', productType)
    if (bloodType) params.set('bloodType', bloodType)

    const seq = ++requestSeq.current
    setLoading(true)
    return apiFetch(`/blood-units?${params}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (seq !== requestSeq.current) return // respuesta obsoleta, se descarta
        if (!r.ok) {
          setError(data.message || 'Error al cargar el inventario')
          setUnits([])
          setTotal(0)
          return
        }
        setError(null)
        setUnits(data.units || [])
        setTotal(data.total || 0)
      })
      .catch(() => { if (seq === requestSeq.current) setError('Error de red.') })
      .finally(() => { if (seq === requestSeq.current) setLoading(false) })
  }

  useEffect(() => { refetch() }, [page, status, productType, bloodType])

  // Recolectada -> En análisis: crea el TestResult que Laboratorio espera.
  async function startTest(unitId: string) {
    setActionId(unitId)
    try {
      await apiFetch('/testing/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloodUnitId: unitId, labType: 'OWN' }),
      })
      await refetch()
    } finally {
      setActionId(null)
    }
  }

  // Cuarentena -> Aprobada, Aprobada -> Almacenada, Almacenada -> Descartada.
  async function transition(unitId: string, newStatus: string) {
    setActionId(unitId)
    try {
      await apiFetch(`/blood-units/${unitId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await refetch()
    } finally {
      setActionId(null)
      setConfirmId(null)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Inventario de sangre</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} unidades</p>
        </div>
        <Link
          href="/inventory/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          <span className="text-base leading-none">+</span> Registrar donación
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={productType}
          onChange={(e) => { setProductType(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos los productos</option>
          <option value="WHOLE_BLOOD">Sangre Entera</option>
          <option value="PLATELETS">Plaquetas</option>
          <option value="PLASMA">Plasma</option>
        </select>
        <select
          value={bloodType}
          onChange={(e) => { setBloodType(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(BLOOD_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-md border border-border overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bolsa</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Donante</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ubicación</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vencimiento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <SkeletonRows cols={8} />
            ) : error ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <AlertTriangle size={36} className="mx-auto text-alert/60 mb-3" />
                  <p className="text-alert text-sm font-medium">{error}</p>
                  <button onClick={() => refetch()} className="text-xs text-primary hover:underline mt-1">Reintentar</button>
                </td>
              </tr>
            ) : units.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <Droplets size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground/70 text-sm font-medium">Sin unidades con este filtro</p>
                  <p className="text-muted-foreground/40 text-xs mt-1">Prueba cambiando el estado o tipo de sangre</p>
                </td>
              </tr>
            ) : units.map((unit) => {
              const days = unit.expirationDate ? daysUntil(unit.expirationDate) : null
              const isExpiringSoon = days !== null && days <= 7 && days >= 0
              const isExpired = days !== null && days < 0
              const expDate = unit.expirationDate
                ? new Date(unit.expirationDate).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
                : null
              return (
                <tr key={unit.id} className={`hover:bg-muted/50 transition-colors ${isExpiringSoon ? 'bg-platelet/5' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-foreground">{unit.bagNumber}</p>
                    <p className="text-xs text-muted-foreground/70">{unit.volumeMl} mL</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blood-50 text-blood-700 text-xs font-bold">
                      {BLOOD_LABELS[unit.bloodType] || unit.bloodType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {PRODUCT_LABELS[unit.productType] || unit.productType}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[unit.status] || ''}`}>
                      {STATUS_LABELS[unit.status] || unit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{unit.donor?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {unit.storageLocation?.name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {days !== null ? (
                      <div className={`flex items-center gap-1 text-sm ${isExpired ? 'text-alert' : isExpiringSoon ? 'text-platelet' : 'text-muted-foreground'}`}>
                        {(isExpiringSoon || isExpired) && <AlertTriangle size={13} />}
                        <span className="font-medium">
                          {isExpired ? 'Vencida' : `${days}d`}
                        </span>
                        {expDate && <span className="text-muted-foreground/70 text-xs ml-1">· {expDate}</span>}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {unit.status === 'COLLECTED' && (
                      <button
                        onClick={() => startTest(unit.id)}
                        disabled={actionId === unit.id}
                        className="px-3 py-1.5 text-xs font-medium border border-input rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50"
                      >
                        {actionId === unit.id ? 'Enviando…' : 'Iniciar test'}
                      </button>
                    )}
                    {unit.status === 'QUARANTINE' && (
                      <button
                        onClick={() => transition(unit.id, 'APPROVED')}
                        disabled={actionId === unit.id}
                        className="px-3 py-1.5 text-xs font-medium border border-input rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50"
                      >
                        {actionId === unit.id ? 'Enviando…' : 'Aprobar'}
                      </button>
                    )}
                    {unit.status === 'APPROVED' && (
                      <button
                        onClick={() => transition(unit.id, 'STORED')}
                        disabled={actionId === unit.id}
                        className="px-3 py-1.5 text-xs font-medium border border-input rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50"
                      >
                        {actionId === unit.id ? 'Enviando…' : 'Almacenar'}
                      </button>
                    )}
                    {unit.status === 'STORED' && (
                      confirmId === unit.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">¿Descartar?</span>
                          <button
                            onClick={() => transition(unit.id, 'DISCARDED')}
                            disabled={actionId === unit.id}
                            className="px-2 py-1 text-xs font-medium bg-alert text-white rounded-md hover:bg-alert/90 transition-colors disabled:opacity-50"
                          >
                            {actionId === unit.id ? 'Enviando…' : 'Sí'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-2 py-1 text-xs font-medium border border-input rounded-md hover:bg-muted/50 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(unit.id)}
                          className="px-3 py-1.5 text-xs font-medium border border-input rounded-md hover:bg-muted/50 transition-colors"
                        >
                          Descartar
                        </button>
                      )
                    )}
                    {!['COLLECTED', 'QUARANTINE', 'APPROVED', 'STORED'].includes(unit.status) && '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-input rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-input rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

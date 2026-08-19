'use client'

import { useEffect, useState } from 'react'
import { Droplets, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

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
  STORED:    'bg-green-100 text-green-800',
  APPROVED:  'bg-blue-100 text-blue-800',
  QUARANTINE:'bg-yellow-100 text-yellow-800',
  ALLOCATED: 'bg-purple-100 text-purple-800',
  REJECTED:  'bg-red-100 text-red-800',
  USED:      'bg-gray-100 text-gray-600',
  DISCARDED: 'bg-gray-100 text-gray-400',
  TESTING:   'bg-orange-100 text-orange-800',
  COLLECTED: 'bg-cyan-100 text-cyan-800',
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
              <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '60%' : j === cols - 1 ? '40%' : '70%' }} />
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
  const LIMIT = 25

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (status) params.set('status', status)
    if (productType) params.set('productType', productType)
    if (bloodType) params.set('bloodType', bloodType)

    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/blood-units?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setUnits(data.units || []); setTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, status, productType, bloodType])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Sangre</h1>
          <p className="text-gray-500 text-sm mt-1">{total} unidades</p>
        </div>
        <Link
          href="/inventory/new"
          className="flex items-center gap-2 bg-blood-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          <span className="text-base leading-none">+</span> Registrar donación
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={productType}
          onChange={(e) => { setProductType(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
        >
          <option value="">Todos los productos</option>
          <option value="WHOLE_BLOOD">Sangre Entera</option>
          <option value="PLATELETS">Plaquetas</option>
          <option value="PLASMA">Plasma</option>
        </select>
        <select
          value={bloodType}
          onChange={(e) => { setBloodType(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(BLOOD_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bolsa</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Donante</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows cols={7} />
            ) : units.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <Droplets size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm font-medium">Sin unidades con este filtro</p>
                  <p className="text-gray-300 text-xs mt-1">Prueba cambiando el estado o tipo de sangre</p>
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
                <tr key={unit.id} className={`hover:bg-gray-50 transition-colors ${isExpiringSoon ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-gray-900">{unit.bagNumber}</p>
                    <p className="text-xs text-gray-400">{unit.volumeMl} mL</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-blood-100 text-blood-700 text-xs font-bold">
                      {BLOOD_LABELS[unit.bloodType] || unit.bloodType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {PRODUCT_LABELS[unit.productType] || unit.productType}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[unit.status] || ''}`}>
                      {STATUS_LABELS[unit.status] || unit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{unit.donor?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {unit.storageLocation?.name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {days !== null ? (
                      <div className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {(isExpiringSoon || isExpired) && <AlertTriangle size={13} />}
                        <span className="font-medium">
                          {isExpired ? 'Vencida' : `${days}d`}
                        </span>
                        {expDate && <span className="text-gray-400 text-xs ml-1">· {expDate}</span>}
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
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

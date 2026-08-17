'use client'

import { useEffect, useState } from 'react'
import { Droplets, AlertTriangle, Clock } from 'lucide-react'

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
  STORED: 'bg-green-100 text-green-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  QUARANTINE: 'bg-yellow-100 text-yellow-800',
  ALLOCATED: 'bg-purple-100 text-purple-800',
  REJECTED: 'bg-red-100 text-red-800',
  USED: 'bg-gray-100 text-gray-600',
  DISCARDED: 'bg-gray-100 text-gray-400',
  TESTING: 'bg-orange-100 text-orange-800',
  COLLECTED: 'bg-cyan-100 text-cyan-800',
}

const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Entera',
  PLATELETS: 'Plaquetas',
  PLASMA: 'Plasma',
}

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

function daysUntil(date: string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  return diff
}

export default function InventoryPage() {
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('STORED')
  const [productType, setProductType] = useState('')
  const [bloodType, setBloodType] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    const params = new URLSearchParams({ page: String(page), limit: '25' })
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Sangre</h1>
          <p className="text-gray-500 text-sm mt-1">{total} unidades</p>
        </div>
        <a
          href="/inventory/new"
          className="bg-blood-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          + Registrar donación
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
        >
          <option value="">Todos los estados</option>
          {Object.keys(STATUS_STYLES).map((s) => (
            <option key={s} value={s}>{s}</option>
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bolsa</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Donante</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vencimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">Cargando...</td></tr>
            ) : units.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">Sin unidades</td></tr>
            ) : units.map((unit) => {
              const days = unit.expirationDate ? daysUntil(unit.expirationDate) : null
              const isExpiringSoon = days !== null && days <= 7 && days >= 0
              const isExpired = days !== null && days < 0
              return (
                <tr key={unit.id} className={`hover:bg-gray-50 transition-colors ${isExpiringSoon ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-gray-900">{unit.bagNumber}</p>
                    <p className="text-xs text-gray-400">{unit.volumeMl} mL</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blood-500 text-white text-sm font-bold">
                      {BLOOD_LABELS[unit.bloodType] || unit.bloodType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {PRODUCT_LABELS[unit.productType] || unit.productType}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[unit.status] || ''}`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{unit.donor?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {unit.storageLocation?.name || '—'}
                  </td>
                  <td className="px-6 py-4">
                    {days !== null && (
                      <div className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {(isExpiringSoon || isExpired) && <AlertTriangle size={14} />}
                        {isExpired ? 'Vencida' : `${days}d`}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

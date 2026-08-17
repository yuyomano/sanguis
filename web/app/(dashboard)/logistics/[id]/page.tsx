'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Truck, MapPin, Package, DollarSign, CheckCircle, Clock, Circle } from 'lucide-react'

interface CustodyEntry {
  timestamp: string
  action: string
  notes?: string
}

interface DeliveryDetail {
  id: string
  destinationName: string
  destinationAddress: string
  carrierType: string
  status: string
  dispatchedAt: string | null
  deliveredAt: string | null
  createdAt: string
  baseCost: number
  lastMileCost: number
  vehicle?: { plate: string; type: string; driverName: string }
  thirdPartyCarrier?: string
  protocol?: { name: string }
  chainOfCustody: CustodyEntry[]
  items: {
    id: string
    bloodUnit: {
      bagNumber: string
      bloodType: string
      productType: string
      volumeMl: number
      donor: { name: string; bloodType: string }
    }
  }[]
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Orden creada',
  PENDING: 'En espera de despacho',
  IN_TRANSIT: 'Despachada — en tránsito',
  DELIVERED: 'Entregada en destino',
  CANCELLED: 'Cancelada',
}

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Entera',
  PLATELETS: 'Plaquetas',
  PLASMA: 'Plasma',
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function DeliveryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [order, setOrder] = useState<DeliveryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = () => {
    const token = localStorage.getItem('sanguis_token')
    if (!token) { router.replace('/login'); return }
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/deliveries/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (r.status === 401) { router.replace('/login'); throw new Error('401') } return r.json() })
      .then((data) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [params.id])

  const updateStatus = async (status: string) => {
    const token = localStorage.getItem('sanguis_token')
    setUpdating(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/deliveries/${params.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
    setUpdating(false)
    fetchOrder()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Orden no encontrada.</p>
        <button onClick={() => router.push('/logistics')} className="mt-4 text-sm text-blood-600 hover:underline">
          ← Volver a logística
        </button>
      </div>
    )
  }

  const custody = Array.isArray(order.chainOfCustody) ? order.chainOfCustody : []

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/logistics')} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{order.destinationName}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || ''}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{order.destinationAddress}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {order.status === 'PENDING' && (
            <button
              onClick={() => updateStatus('IN_TRANSIT')}
              disabled={updating}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Despachar
            </button>
          )}
          {order.status === 'IN_TRANSIT' && (
            <button
              onClick={() => updateStatus('DELIVERED')}
              disabled={updating}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Confirmar entrega
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Summary cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600"><Truck size={18} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Transporte</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {order.carrierType === 'OWN'
                ? `${order.vehicle?.type || '—'}`
                : order.thirdPartyCarrier || '—'}
            </p>
            <p className="text-xs text-gray-400">
              {order.carrierType === 'OWN'
                ? order.vehicle?.plate || ''
                : 'Transportista externo'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-gray-50 text-gray-600"><Package size={18} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Unidades</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{order.items.length} unidad{order.items.length !== 1 ? 'es' : ''}</p>
            <p className="text-xs text-gray-400">Protocolo: {order.protocol?.name || 'Sin protocolo'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-green-50 text-green-600"><DollarSign size={18} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Costo total</p>
            <p className="text-sm font-semibold text-gray-900 mt-1 tabular-nums">
              RD$ {(order.baseCost + order.lastMileCost).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              Base: RD$ {order.baseCost.toLocaleString()} · Última milla: RD$ {order.lastMileCost.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Blood units */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Unidades en esta entrega</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bolsa</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Donante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blood-500 text-white text-xs font-bold">
                      {BLOOD_LABELS[item.bloodUnit.bloodType] || item.bloodUnit.bloodType}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-800">{item.bloodUnit.bagNumber}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {PRODUCT_LABELS[item.bloodUnit.productType] || item.bloodUnit.productType}
                    <span className="text-xs text-gray-400 ml-1">· {item.bloodUnit.volumeMl} mL</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{item.bloodUnit.donor?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chain of custody */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Cadena de custodia</h2>
          {custody.length === 0 ? (
            <p className="text-sm text-gray-400">Sin registros de custodia</p>
          ) : (
            <ol className="space-y-0">
              {custody.map((entry, i) => {
                const isLast = i === custody.length - 1
                const isDone = !isLast
                return (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isDone ? 'bg-green-100 text-green-600' : 'bg-blood-100 text-blood-600'}`}>
                        {isDone
                          ? <CheckCircle size={14} />
                          : entry.action === 'IN_TRANSIT'
                            ? <Truck size={14} />
                            : <Clock size={14} />}
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-gray-200 my-1.5" />}
                    </div>
                    <div className={`pb-5 min-w-0 ${isLast ? '' : ''}`}>
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {ACTION_LABELS[entry.action] || entry.action}
                      </p>
                      {entry.notes && entry.notes !== 'Orden de entrega creada' && (
                        <p className="text-xs text-gray-500 mt-0.5">{entry.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDatetime(entry.timestamp)}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

          {order.deliveredAt && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
              Entregado el {formatDate(order.deliveredAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

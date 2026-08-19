'use client'

import { useEffect, useState, useCallback } from 'react'
import { Truck, Package, MapPin, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface DeliveryOrder {
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
  items: { bloodUnit: { bagNumber: string; donor: { name: string } } }[]
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

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function LogisticsPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(() => {
    const token = localStorage.getItem('sanguis_token')
    if (!token) { window.location.href = '/login'; return }
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/deliveries?page=1&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (r.status === 401) { window.location.href = '/login'; throw new Error('401') } return r.json() })
      .then((data) => { setOrders(data.orders || []); setTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('sanguis_token')
    setUpdatingId(id)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/deliveries/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
    setUpdatingId(null)
    fetchOrders()
  }

  const pending = orders.filter((o) => o.status === 'PENDING').length
  const inTransit = orders.filter((o) => o.status === 'IN_TRANSIT').length
  const today = new Date().toDateString()
  const deliveredToday = orders.filter((o) => o.deliveredAt && new Date(o.deliveredAt).toDateString() === today).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logística</h1>
          <p className="text-gray-500 text-sm mt-1">{total} órdenes de entrega</p>
        </div>
        <Link
          href="/logistics/new"
          className="flex items-center gap-2 px-4 py-2 bg-blood-500 hover:bg-blood-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nueva entrega
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Package, label: 'Pendientes', value: pending, color: 'bg-yellow-50 text-yellow-600' },
          { icon: Truck, label: 'En tránsito', value: inTransit, color: 'bg-blue-50 text-blue-600' },
          { icon: MapPin, label: 'Entregadas hoy', value: deliveredToday, color: 'bg-green-50 text-green-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
            <div className={`p-3 rounded-lg ${color}`}><Icon size={22} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Destino</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Transporte</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Uds.</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Costo total</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Truck size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">Sin órdenes de entrega registradas</p>
                  <Link href="/logistics/new" className="inline-block mt-3 text-sm text-blood-600 hover:text-blood-700 font-medium">
                    Crear primera entrega →
                  </Link>
                </td>
              </tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-sm text-gray-900">{order.destinationName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">{order.destinationAddress}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || ''}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {order.carrierType === 'OWN'
                    ? `${order.vehicle?.type || '—'} · ${order.vehicle?.plate || '—'}`
                    : order.thirdPartyCarrier || '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 tabular-nums">{order.items.length}</td>
                <td className="px-6 py-4 text-sm text-gray-600 tabular-nums">
                  RD$ {(order.baseCost + order.lastMileCost).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(order.id, 'IN_TRANSIT')}
                        disabled={updatingId === order.id}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        Despachar
                      </button>
                    )}
                    {order.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => updateStatus(order.id, 'DELIVERED')}
                        disabled={updatingId === order.id}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        Confirmar entrega
                      </button>
                    )}
                    <Link
                      href={`/logistics/${order.id}`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Ver detalle"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

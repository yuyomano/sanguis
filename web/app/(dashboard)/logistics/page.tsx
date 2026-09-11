'use client'

import { useEffect, useState, useCallback } from 'react'
import { Truck, Package, MapPin, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

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
  PENDING: 'bg-muted text-muted-foreground',
  IN_TRANSIT: 'bg-blood-50 text-primary',
  DELIVERED: 'bg-clinical-success/15 text-clinical-success',
  CANCELLED: 'bg-alert/15 text-alert',
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
    setLoading(true)
    apiFetch('/logistics/deliveries?page=1&limit=50')
      .then((r) => r.json())
      .then((data) => { setOrders(data.orders || []); setTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    await apiFetch(`/logistics/deliveries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
          <h1 className="font-display text-2xl font-semibold text-foreground">Logística</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} órdenes de entrega</p>
        </div>
        <Link
          href="/logistics/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nueva entrega
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Package, label: 'Pendientes', value: pending, color: 'bg-muted text-muted-foreground' },
          { icon: Truck, label: 'En tránsito', value: inTransit, color: 'bg-blood-50 text-primary' },
          { icon: MapPin, label: 'Entregadas hoy', value: deliveredToday, color: 'bg-clinical-success/10 text-clinical-success' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card rounded-md border border-border p-6 flex items-start gap-4">
            <div className={`p-3 rounded-md ${color}`}><Icon size={22} /></div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-md border border-border overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Destino</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Transporte</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Uds.</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Costo total</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground/70">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Truck size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground/70 text-sm">Sin órdenes de entrega registradas</p>
                  <Link href="/logistics/new" className="inline-block mt-3 text-sm text-primary hover:text-blood-700 font-medium">
                    Crear primera entrega →
                  </Link>
                </td>
              </tr>
            ) : orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-sm text-foreground">{order.destinationName}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 max-w-[180px] truncate">{order.destinationAddress}</p>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(order.createdAt)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || ''}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {order.carrierType === 'OWN'
                    ? `${order.vehicle?.type || '—'} · ${order.vehicle?.plate || '—'}`
                    : order.thirdPartyCarrier || '—'}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground tabular-nums">{order.items.length}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground tabular-nums">
                  RD$ {(order.baseCost + order.lastMileCost).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus(order.id, 'IN_TRANSIT')}
                        disabled={updatingId === order.id}
                        className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-blood-600 transition-colors disabled:opacity-50"
                      >
                        Despachar
                      </button>
                    )}
                    {order.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => updateStatus(order.id, 'DELIVERED')}
                        disabled={updatingId === order.id}
                        className="px-3 py-1.5 bg-clinical-success text-white rounded-md text-xs font-medium hover:bg-clinical-success/90 transition-colors disabled:opacity-50"
                      >
                        Confirmar entrega
                      </button>
                    )}
                    <Link
                      href={`/logistics/${order.id}`}
                      className="p-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
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

'use client'

import { useEffect, useState } from 'react'
import { Users, Droplets, AlertTriangle, Calendar, TrendingUp, Activity } from 'lucide-react'

const BLOOD_TYPE_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

interface Stats {
  donors: { total: number; newThisMonth: number }
  inventory: { total: number; expiringSoon: number; byBloodType: Record<string, number> }
  events: number
  finance: { revenue: number; costs: number }
}

function StatCard({
  title, value, subtitle, icon: Icon, color = 'blood',
}: {
  title: string; value: string | number; subtitle?: string
  icon: React.ComponentType<any>; color?: string
}) {
  const colors: Record<string, string> = {
    blood: 'bg-blood-50 text-blood-600',
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    if (!token) { window.location.href = '/login'; return }
    const headers = { Authorization: `Bearer ${token}` }
    const api = process.env.NEXT_PUBLIC_API_URL

    Promise.all([
      fetch(`${api}/donors/stats`, { headers }).then((r) => { if (r.status === 401) { window.location.href = '/login'; throw new Error('401') } return r.json() }),
      fetch(`${api}/blood-units/inventory`, { headers }).then((r) => r.json()),
      fetch(`${api}/finance/summary`, { headers }).then((r) => r.json()),
      fetch(`${api}/events?page=1&limit=1`, { headers }).then((r) => r.json()),
    ])
      .then(([donors, inventory, finance, eventsData]) => {
        setStats({
          donors: { total: donors.total ?? 0, newThisMonth: donors.newThisMonth ?? 0 },
          inventory: {
            total: inventory.total ?? 0,
            expiringSoon: inventory.expiringSoon ?? 0,
            byBloodType: (inventory.byTypeAndProduct ?? []).reduce((acc: Record<string, number>, item: any) => {
              const label = BLOOD_TYPE_LABELS[item.bloodType]
              if (label) acc[label] = (acc[label] ?? 0) + item._count
              return acc
            }, {}),
          },
          events: eventsData.total ?? 0,
          finance: { revenue: finance.totalRevenue ?? 0, costs: finance.totalCosts ?? 0 },
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen operacional de Sanguis</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Donantes Registrados"
          value={stats?.donors.total ?? '—'}
          subtitle={`+${stats?.donors.newThisMonth ?? 0} este mes`}
          icon={Users}
          color="blood"
        />
        <StatCard
          title="Unidades en Stock"
          value={stats?.inventory.total ?? '—'}
          subtitle={`${stats?.inventory.expiringSoon ?? 0} vencen en 7 días`}
          icon={Droplets}
          color="blue"
        />
        <StatCard
          title="Alerta Vencimiento"
          value={stats?.inventory.expiringSoon ?? '—'}
          subtitle="Próximas 24h"
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Ingresos del Mes"
          value={`RD$ ${(stats?.finance.revenue ?? 0).toLocaleString()}`}
          subtitle={`Costos: RD$ ${(stats?.finance.costs ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Blood type inventory grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-blood-500" />
          Inventario por Tipo de Sangre
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
            <div
              key={type}
              className="text-center p-3 rounded-lg border border-gray-200 hover:border-blood-300 transition-colors"
            >
              <p className="text-lg font-bold text-blood-600">{type}</p>
              <p className="text-xs text-gray-500 mt-1">{stats?.inventory.byBloodType?.[type] ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Registrar Donación', href: '/inventory/new', color: 'bg-blood-500 text-white' },
            { label: 'Crear Evento', href: '/events/new', color: 'bg-blue-500 text-white' },
            { label: 'Alerta de Emergencia', href: '/notifications/emergency', color: 'bg-orange-500 text-white' },
            { label: 'Ver Tests Pendientes', href: '/testing', color: 'bg-purple-500 text-white' },
          ].map(({ label, href, color }) => (
            <a
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 ${color}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

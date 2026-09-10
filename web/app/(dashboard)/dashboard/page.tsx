'use client'

import { useEffect, useState } from 'react'
import { Users, Droplets, AlertTriangle, TrendingUp, Activity } from 'lucide-react'
import { fmtDOP } from '@/lib/fmt'

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

function Stat({
  title, value, subtitle, icon: Icon, tone = 'foreground',
}: {
  title: string; value: string | number; subtitle?: string
  icon: React.ComponentType<any>; tone?: 'foreground' | 'primary' | 'alert' | 'success'
}) {
  const toneClass: Record<string, string> = {
    foreground: 'text-foreground',
    primary: 'text-primary',
    alert: 'text-alert',
    success: 'text-clinical-success',
  }
  return (
    <div className="flex-1 min-w-[180px] px-6 py-5 first:pl-0 last:pr-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={15} className={toneClass[tone]} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="font-display text-3xl font-semibold text-foreground mt-2">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen operacional de Sanguis</p>
      </div>

      {/* KPI strip — una franja, no cuatro cajas idénticas */}
      <div className="flex flex-wrap divide-x divide-border border border-border rounded-md bg-card mb-6">
        <Stat
          title="Donantes registrados"
          value={stats?.donors.total ?? '—'}
          subtitle={`+${stats?.donors.newThisMonth ?? 0} este mes`}
          icon={Users}
          tone="primary"
        />
        <Stat
          title="Unidades en stock"
          value={stats?.inventory.total ?? '—'}
          subtitle="Total disponible"
          icon={Droplets}
        />
        <Stat
          title="Vencen en 7 días"
          value={stats?.inventory.expiringSoon ?? '—'}
          subtitle="Requiere acción"
          icon={AlertTriangle}
          tone="alert"
        />
        <Stat
          title="Ingresos del mes"
          value={fmtDOP(stats?.finance.revenue ?? 0)}
          subtitle={`Costos: ${fmtDOP(stats?.finance.costs ?? 0)}`}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      {/* Blood type inventory grid */}
      <div className="border border-border rounded-md bg-card p-6 mb-6">
        <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          Inventario por tipo de sangre
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => {
            const count = stats?.inventory.byBloodType?.[type] ?? 0
            return (
              <div
                key={type}
                className="text-center p-3 rounded-md border border-border hover:border-primary/40 transition-colors"
              >
                <p className="font-mono text-base font-medium text-primary">{type}</p>
                <p className={`text-xs mt-1 font-medium ${count === 0 ? 'text-alert' : 'text-muted-foreground'}`}>
                  {count}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick actions — colores semánticos, no decorativos */}
      <div className="border border-border rounded-md bg-card p-6">
        <h2 className="font-medium text-foreground mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Registrar donación', href: '/inventory/new', className: 'bg-primary text-primary-foreground hover:bg-blood-600' },
            { label: 'Crear evento', href: '/events/new', className: 'border border-border text-foreground hover:bg-muted' },
            { label: 'Alerta de emergencia', href: '/notifications', className: 'bg-alert text-white hover:bg-alert/90' },
            { label: 'Ver tests pendientes', href: '/testing', className: 'border border-border text-foreground hover:bg-muted' },
          ].map(({ label, href, className }) => (
            <a
              key={href}
              href={href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors active:scale-[0.98] ${className}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

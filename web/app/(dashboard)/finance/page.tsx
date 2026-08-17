'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Summary {
  period: { start: string; end: string }
  currency: string
  totalRevenue: number
  totalCosts: number
  netResult: number
  byCategory: Record<string, { costs: number; revenue: number }>
}

const CATEGORY_LABELS: Record<string, string> = {
  COLLECTION: 'Recolección',
  TESTING: 'Pruebas de Laboratorio',
  STORAGE: 'Almacenamiento',
  LOGISTICS: 'Logística',
  REWARD_REDEMPTION: 'Canjes de Puntos',
  PARTNER_BILLING: 'Facturación a Socios',
  OTHER: 'Otros',
}

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Período:{' '}
          {summary?.period.start
            ? `${new Date(summary.period.start).toLocaleDateString('es-DO')} — ${new Date(summary.period.end).toLocaleDateString('es-DO')}`
            : 'Mes actual'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Ingresos Totales', value: summary?.totalRevenue || 0, icon: TrendingUp, color: 'green' },
              { label: 'Costos Totales', value: summary?.totalCosts || 0, icon: TrendingDown, color: 'red' },
              { label: 'Resultado Neto', value: summary?.netResult || 0, icon: DollarSign, color: (summary?.netResult || 0) >= 0 ? 'green' : 'red' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 bg-${color}-100 rounded-lg`}>
                    <Icon size={20} className={`text-${color}-600`} />
                  </div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
                  {fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {/* By category */}
          {summary?.byCategory && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Detalle por Categoría</h2>
              <div className="space-y-3">
                {Object.entries(summary.byCategory).map(([cat, { costs, revenue }]) => (
                  <div key={cat} className="flex items-center gap-4">
                    <p className="w-48 text-sm text-gray-600">{CATEGORY_LABELS[cat] || cat}</p>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min((revenue / (summary.totalRevenue || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-green-600 font-medium w-28 text-right">{fmt(revenue)}</span>
                      <span className="text-sm text-red-500 w-28 text-right">- {fmt(costs)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

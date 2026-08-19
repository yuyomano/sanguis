'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { fmtDOP } from '@/lib/fmt'

interface Summary {
  period: { start: string; end: string }
  currency: string
  totalRevenue: number
  totalCosts: number
  netResult: number
  byCategory: Record<string, { costs: number; revenue: number }>
}

const CATEGORY_LABELS: Record<string, string> = {
  COLLECTION:        'Recolección',
  TESTING:           'Pruebas de Laboratorio',
  STORAGE:           'Almacenamiento',
  LOGISTICS:         'Logística',
  REWARD_REDEMPTION: 'Canjes de Puntos',
  PARTNER_BILLING:   'Facturación a Socios',
  OTHER:             'Otros',
}

const CARD_STYLES: Record<string, { bg: string; icon: string }> = {
  green: { bg: 'bg-green-100', icon: 'text-green-600' },
  red:   { bg: 'bg-red-100',   icon: 'text-red-600'   },
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

  const netPositive = (summary?.netResult ?? 0) >= 0

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
              { label: 'Ingresos Totales', value: summary?.totalRevenue || 0, icon: TrendingUp,  color: 'green' },
              { label: 'Costos Totales',   value: summary?.totalCosts   || 0, icon: TrendingDown, color: 'red'   },
              { label: 'Resultado Neto',   value: summary?.netResult    || 0, icon: DollarSign,  color: netPositive ? 'green' : 'red' },
            ].map(({ label, value, icon: Icon, color }) => {
              const style = CARD_STYLES[color] ?? CARD_STYLES.green
              return (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-lg ${style.bg}`}>
                      <Icon size={20} className={style.icon} />
                    </div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
                    {fmtDOP(value)}
                  </p>
                </div>
              )
            })}
          </div>

          {/* By category */}
          {summary?.byCategory && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Detalle por Categoría</h2>
              <div className="space-y-5">
                {Object.entries(summary.byCategory).map(([cat, { costs, revenue }]) => {
                  const maxVal = Math.max(summary.totalRevenue, summary.totalCosts, 1)
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm text-gray-700 font-medium">
                          {CATEGORY_LABELS[cat] || cat}
                        </p>
                        <div className="flex gap-4 text-xs">
                          <span className="text-green-600 font-medium">{fmtDOP(revenue)}</span>
                          <span className="text-red-500">−{fmtDOP(costs)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((revenue / maxVal) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-red-400 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((costs / maxVal) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-2 rounded-sm bg-green-500 inline-block" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-2 rounded-sm bg-red-400 inline-block" /> Costos
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

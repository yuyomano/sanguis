'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { fmtDOP } from '@/lib/fmt'
import { apiFetch } from '@/lib/api'

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
  green: { bg: 'bg-clinical-success/15', icon: 'text-clinical-success' },
  red:   { bg: 'bg-alert/15',            icon: 'text-alert'            },
}

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/finance/summary')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const netPositive = (summary?.netResult ?? 0) >= 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Finanzas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Período:{' '}
          {summary?.period.start
            ? `${new Date(summary.period.start).toLocaleDateString('es-DO')} — ${new Date(summary.period.end).toLocaleDateString('es-DO')}`
            : 'Mes actual'}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Ingresos totales', value: summary?.totalRevenue || 0, icon: TrendingUp,  color: 'green' },
              { label: 'Costos totales',   value: summary?.totalCosts   || 0, icon: TrendingDown, color: 'red'   },
              { label: 'Resultado neto',   value: summary?.netResult    || 0, icon: DollarSign,  color: netPositive ? 'green' : 'red' },
            ].map(({ label, value, icon: Icon, color }) => {
              const style = CARD_STYLES[color] ?? CARD_STYLES.green
              return (
                <div key={label} className="bg-card rounded-md border border-border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-md ${style.bg}`}>
                      <Icon size={20} className={style.icon} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${color === 'red' ? 'text-alert' : 'text-foreground'}`}>
                    {fmtDOP(value)}
                  </p>
                </div>
              )
            })}
          </div>

          {/* By category */}
          {summary?.byCategory && (
            <div className="bg-card rounded-md border border-border p-6">
              <h2 className="font-semibold text-foreground mb-5">Detalle por categoría</h2>
              <div className="space-y-5">
                {Object.entries(summary.byCategory).map(([cat, { costs, revenue }]) => {
                  const maxVal = Math.max(summary.totalRevenue, summary.totalCosts, 1)
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm text-foreground font-medium">
                          {CATEGORY_LABELS[cat] || cat}
                        </p>
                        <div className="flex gap-4 text-xs">
                          <span className="text-clinical-success font-medium">{fmtDOP(revenue)}</span>
                          <span className="text-alert">−{fmtDOP(costs)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-clinical-success h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((revenue / maxVal) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-alert/70 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((costs / maxVal) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-2 rounded-sm bg-clinical-success inline-block" /> Ingresos
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-2 rounded-sm bg-alert/70 inline-block" /> Costos
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Plus, Receipt } from 'lucide-react'
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

interface FinancialRecord {
  id: string
  type: 'REVENUE' | 'COST'
  category: string
  amount: number
  currency: string
  date: string
  description: string | null
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

const TYPE_LABELS: Record<string, string> = { REVENUE: 'Ingreso', COST: 'Costo' }

const CARD_STYLES: Record<string, { bg: string; icon: string }> = {
  green: { bg: 'bg-clinical-success/15', icon: 'text-clinical-success' },
  red:   { bg: 'bg-alert/15',            icon: 'text-alert'            },
}

function today() { return new Date().toISOString().split('T')[0] }
function firstOfMonth() {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split('T')[0]
}

const RECORDS_LIMIT = 15

export default function FinancePage() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())
  const [currency, setCurrency] = useState('DOP')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [recordsTotal, setRecordsTotal] = useState(0)
  const [recordsPage, setRecordsPage] = useState(1)
  const [recordsLoading, setRecordsLoading] = useState(false)

  const [form, setForm] = useState({ type: 'COST', category: 'OTHER', amount: '', date: today(), description: '' })
  const [saving, setSaving] = useState(false)

  function fetchSummary() {
    setLoading(true)
    apiFetch(`/finance/summary?startDate=${from}&endDate=${to}&currency=${currency}`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function fetchRecords() {
    setRecordsLoading(true)
    apiFetch(`/finance/records?page=${recordsPage}&limit=${RECORDS_LIMIT}`)
      .then((r) => r.json())
      .then((data) => { setRecords(data.records || []); setRecordsTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setRecordsLoading(false))
  }

  useEffect(fetchSummary, [])
  useEffect(fetchRecords, [recordsPage])

  async function submitRecord(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await apiFetch('/finance/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description || undefined,
      }),
    }).catch(() => {})
    setForm({ type: 'COST', category: 'OTHER', amount: '', date: today(), description: '' })
    setSaving(false)
    setRecordsPage(1)
    fetchRecords()
    fetchSummary()
  }

  const netPositive = (summary?.netResult ?? 0) >= 0

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Finanzas</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de ingresos, costos y movimientos</p>
      </div>

      {/* Period + currency filter */}
      <div className="bg-card rounded-md border border-border p-5 flex items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Moneda</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary">
            <option value="DOP">DOP</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <button
          onClick={fetchSummary}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          Generar resumen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground/70">
            Período:{' '}
            <span className="font-medium text-muted-foreground">
              {summary?.period.start
                ? `${new Date(summary.period.start).toLocaleDateString('es-DO')} — ${new Date(summary.period.end).toLocaleDateString('es-DO')}`
                : 'Mes actual'}
            </span>
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-6">
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

      {/* ── Movimientos ─────────────────────────────────────────────── */}
      <div className="border-t border-border pt-8">
        <div className="flex items-center gap-2 mb-5">
          <Receipt size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Movimientos</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration form */}
          <div className="bg-card rounded-md border border-border p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Registrar movimiento</h3>
            <form onSubmit={submitRecord} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="COST">Costo</option>
                  <option value="REVENUE">Ingreso</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Monto (DOP) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="2500.00"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha *</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalle opcional"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary hover:bg-blood-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
              >
                <Plus size={15} /> {saving ? 'Guardando...' : 'Registrar movimiento'}
              </button>
            </form>
          </div>

          {/* Records table */}
          <div className="lg:col-span-2 bg-card rounded-md border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">Últimos movimientos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Categoría</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Monto</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recordsLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {[60, 90, 70, 70, 120].map((w, j) => (
                          <td key={j} className="px-5 py-3">
                            <div className="h-3.5 bg-muted rounded animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground/70 text-sm">
                        Sin movimientos registrados
                      </td>
                    </tr>
                  ) : records.map(rec => (
                    <tr key={rec.id} className="hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          rec.type === 'REVENUE' ? 'bg-clinical-success/15 text-clinical-success' : 'bg-alert/15 text-alert'
                        }`}>
                          {TYPE_LABELS[rec.type] || rec.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground">{CATEGORY_LABELS[rec.category] || rec.category}</td>
                      <td className={`px-5 py-3 text-sm font-medium ${rec.type === 'REVENUE' ? 'text-clinical-success' : 'text-alert'}`}>
                        {rec.type === 'REVENUE' ? '' : '−'}{fmtDOP(rec.amount)}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(rec.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{rec.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recordsTotal > RECORDS_LIMIT && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Mostrando {(recordsPage - 1) * RECORDS_LIMIT + 1}–{Math.min(recordsPage * RECORDS_LIMIT, recordsTotal)} de {recordsTotal}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setRecordsPage(p => Math.max(1, p - 1))} disabled={recordsPage === 1}
                    className="px-3 py-1.5 text-xs border border-input rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors">
                    Anterior
                  </button>
                  <button onClick={() => setRecordsPage(p => p + 1)} disabled={recordsPage * RECORDS_LIMIT >= recordsTotal}
                    className="px-3 py-1.5 text-xs border border-input rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

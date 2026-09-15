'use client'

import { useEffect, useState, useRef } from 'react'
import { FileText, Droplets, FlaskConical, Users, Truck, AlertTriangle, Printer, Thermometer, Plus, Download } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}
const PRODUCT_LABELS: Record<string, string> = {
  WHOLE_BLOOD: 'Sangre Entera', PLATELETS: 'Plaquetas', PLASMA: 'Plasma',
}
const STATUS_LABELS: Record<string, string> = {
  STORED: 'Almacenada', APPROVED: 'Aprobada', QUARANTINE: 'Cuarentena',
  ALLOCATED: 'Asignada', REJECTED: 'Rechazada', USED: 'Usada',
  DISCARDED: 'Descartada', TESTING: 'En análisis', COLLECTED: 'Recolectada',
}

function today() { return new Date().toISOString().split('T')[0] }
function firstOfMonth() {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split('T')[0]
}

interface Report {
  period: { from: string; to: string }
  summary: {
    totalUnitsCollected: number
    totalTests: number
    viableTests: number
    rejectedTests: number
    viabilityRate: number | null
    newDonors: number
    totalActiveDonors: number
    deliveriesCompleted: number
    emergencyAlerts: number
  }
  byBloodType: Record<string, number>
  byProductType: Record<string, number>
  byStatus: Record<string, number>
}

interface TempLog {
  id: string
  tempCelsius: number
  recordedAt: string
  recordedBy: string | null
  notes: string | null
  storageLocationId: string | null
  deliveryOrderId: string | null
}

interface Location {
  id: string
  name: string
}

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }: {
  icon: React.ComponentType<any>; label: string; value: string | number; sub?: string; color?: string
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blood-50 text-primary',
    green:  'bg-clinical-success/10 text-clinical-success',
    red:    'bg-alert/10 text-alert',
    yellow: 'bg-platelet/10 text-platelet',
    blood:  'bg-blood-50 text-primary',
    purple: 'bg-plasma/10 text-plasma',
  }
  return (
    <div className="bg-card rounded-md border border-border p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-md ${colors[color]}`}><Icon size={20} /></div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<Location[]>([])
  const [tempLogs, setTempLogs] = useState<TempLog[]>([])
  const [tempLoading, setTempLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [logForm, setLogForm] = useState({ tempCelsius: '', locationId: '', recordedBy: '', notes: '' })
  const [loggingTemp, setLoggingTemp] = useState(false)

  function fetchReport() {
    setLoading(true)
    apiFetch(`/reports/sespas?from=${from}&to=${to}`)
      .then(r => r.json()).then(setReport).catch(() => {}).finally(() => setLoading(false))
  }

  function fetchTemperature() {
    setTempLoading(true)
    const params = new URLSearchParams({ limit: '30' })
    if (selectedLocation) params.set('locationId', selectedLocation)
    apiFetch(`/reports/temperature?${params}`)
      .then(r => r.json()).then(setTempLogs).catch(() => {}).finally(() => setTempLoading(false))
  }

  useEffect(() => {
    fetchReport()
    apiFetch('/blood-units/locations')
      .then(r => r.json()).then(setLocations).catch(() => {})
  }, [])

  useEffect(() => { fetchTemperature() }, [selectedLocation])

  async function submitTempLog(e: React.FormEvent) {
    e.preventDefault()
    setLoggingTemp(true)
    await apiFetch('/reports/temperature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempCelsius: parseFloat(logForm.tempCelsius),
        locationId: logForm.locationId || undefined,
        recordedBy: logForm.recordedBy || undefined,
        notes: logForm.notes || undefined,
      }),
    }).catch(() => {})
    setLogForm({ tempCelsius: '', locationId: '', recordedBy: '', notes: '' })
    setLoggingTemp(false)
    fetchTemperature()
  }

  const s = report?.summary

  function exportCSV(r: Report) {
    const rows: string[][] = [
      ['Reporte SESPAS de Sanguis'],
      ['Período', `${r.period.from} a ${r.period.to}`],
      [],
      ['Resumen'],
      ['Unidades recolectadas', String(r.summary.totalUnitsCollected)],
      ['Tests realizados', String(r.summary.totalTests)],
      ['Tests viables', String(r.summary.viableTests)],
      ['Tests rechazados', String(r.summary.rejectedTests)],
      ['Tasa de viabilidad', r.summary.viabilityRate != null ? `${r.summary.viabilityRate.toFixed(1)}%` : '—'],
      ['Nuevos donantes', String(r.summary.newDonors)],
      ['Donantes activos', String(r.summary.totalActiveDonors)],
      ['Entregas completadas', String(r.summary.deliveriesCompleted)],
      ['Alertas de emergencia', String(r.summary.emergencyAlerts)],
      [],
      ['Por grupo sanguíneo', 'Unidades'],
      ...Object.entries(r.byBloodType).map(([k, v]) => [BLOOD_LABELS[k] || k, String(v)]),
      [],
      ['Por tipo de producto', 'Unidades'],
      ...Object.entries(r.byProductType).map(([k, v]) => [PRODUCT_LABELS[k] || k, String(v)]),
      [],
      ['Por estado', 'Unidades'],
      ...Object.entries(r.byStatus).map(([k, v]) => [STATUS_LABELS[k] || k, String(v)]),
    ]
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-sespas-${r.period.from}-${r.period.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header + Date filter */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Reportes SESPAS</h1>
          <p className="text-muted-foreground text-sm mt-1">Informe regulatorio de banco de sangre para República Dominicana</p>
        </div>
        <div className="flex gap-2 print:hidden">
          {report && (
            <button
              onClick={() => exportCSV(report)}
              className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download size={16} /> Exportar CSV
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      {/* Period picker */}
      <div className="bg-card rounded-md border border-border p-5 flex items-end gap-4 print:hidden">
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
        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          Generar reporte
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
        </div>
      ) : report ? (
        <>
          {/* Período del reporte */}
          <div className="text-xs text-muted-foreground/70 flex items-center gap-2 print:block">
            <FileText size={13} />
            Período:{' '}
            <span className="font-medium text-muted-foreground">
              {new Date(report.period.from).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' — '}
              {new Date(report.period.to).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Droplets} label="Unidades recolectadas" value={s?.totalUnitsCollected ?? 0} color="blood" />
            <StatCard icon={FlaskConical} label="Tests realizados"
              value={s?.totalTests ?? 0}
              sub={s?.viabilityRate != null ? `${s.viabilityRate}% viables` : undefined}
              color="green" />
            <StatCard icon={Users} label="Donantes nuevos"
              value={s?.newDonors ?? 0}
              sub={`${s?.totalActiveDonors ?? 0} activos en total`}
              color="blue" />
            <StatCard icon={Truck} label="Entregas completadas" value={s?.deliveriesCompleted ?? 0} color="purple" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FlaskConical} label="Unidades viables" value={s?.viableTests ?? 0} color="green" />
            <StatCard icon={FlaskConical} label="Unidades rechazadas" value={s?.rejectedTests ?? 0} color="red" />
            <StatCard icon={AlertTriangle} label="Alertas de emergencia" value={s?.emergencyAlerts ?? 0} color="yellow" />
          </div>

          {/* Tablas de desglose */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Por grupo sanguíneo */}
            <div className="bg-card rounded-md border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">Por grupo sanguíneo</h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(BLOOD_LABELS).map(([key, label]) => {
                    const count = report.byBloodType[key] ?? 0
                    const total = s?.totalUnitsCollected || 1
                    return (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blood-50 text-blood-700 text-xs font-bold">{label}</span>
                        </td>
                        <td className="px-5 py-2.5 text-sm text-foreground tabular-nums">{count}</td>
                        <td className="px-5 py-2.5">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground/70 tabular-nums">{((count / total) * 100).toFixed(0)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Por tipo de producto */}
            <div className="bg-card rounded-md border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">Por tipo de producto</h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(PRODUCT_LABELS).map(([key, label]) => {
                    const count = report.byProductType[key] ?? 0
                    const total = s?.totalUnitsCollected || 1
                    return (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 text-sm text-foreground">{label}</td>
                        <td className="px-5 py-2.5 text-sm text-foreground tabular-nums">{count}</td>
                        <td className="px-5 py-2.5">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground/70 tabular-nums">{((count / total) * 100).toFixed(0)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Por estado */}
            <div className="bg-card rounded-md border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">Por estado</h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => {
                    const count = report.byStatus[key] ?? 0
                    const total = s?.totalUnitsCollected || 1
                    return count > 0 ? (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="px-5 py-2.5 text-sm text-foreground">{label}</td>
                        <td className="px-5 py-2.5 text-sm text-foreground tabular-nums">{count}</td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground/70 tabular-nums">{((count / total) * 100).toFixed(0)}%</td>
                      </tr>
                    ) : null
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Cold Chain ─────────────────────────────────────────────────── */}
      <div className="border-t border-border pt-8">
        <div className="flex items-center gap-2 mb-5">
          <Thermometer size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Cadena de frío</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log form */}
          <div className="bg-card rounded-md border border-border p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Registrar lectura</h3>
            <form onSubmit={submitTempLog} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Temperatura (°C) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={logForm.tempCelsius}
                  onChange={e => setLogForm(f => ({ ...f, tempCelsius: e.target.value }))}
                  placeholder="4.0"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Ubicación</label>
                <select
                  value={logForm.locationId}
                  onChange={e => setLogForm(f => ({ ...f, locationId: e.target.value }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Seleccionar —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Registrado por</label>
                <input
                  type="text"
                  value={logForm.recordedBy}
                  onChange={e => setLogForm(f => ({ ...f, recordedBy: e.target.value }))}
                  placeholder="Nombre del técnico"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notas</label>
                <input
                  type="text"
                  value={logForm.notes}
                  onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones opcionales"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loggingTemp}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary hover:bg-blood-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
              >
                <Plus size={15} /> {loggingTemp ? 'Guardando...' : 'Registrar lectura'}
              </button>
            </form>
          </div>

          {/* Logs table */}
          <div className="lg:col-span-2 bg-card rounded-md border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">Últimas lecturas</h3>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="px-2 py-1 border border-input rounded-md text-xs outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Temp.</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Por</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tempLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {[40, 80, 60, 100].map((w, j) => (
                          <td key={j} className="px-5 py-3">
                            <div className="h-3.5 bg-muted rounded animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : tempLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground/70 text-sm">
                        Sin lecturas de temperatura
                      </td>
                    </tr>
                  ) : tempLogs.map(log => {
                    const temp = log.tempCelsius
                    const isOk = temp >= 1 && temp <= 10
                    const isFrozen = temp < 1
                    return (
                      <tr key={log.id} className={`hover:bg-muted/50 ${isFrozen ? 'bg-platelet/5' : !isOk ? 'bg-alert/5' : ''}`}>
                        <td className="px-5 py-3">
                          <span className={`font-mono font-semibold text-sm ${isFrozen ? 'text-platelet' : !isOk ? 'text-alert' : 'text-clinical-success'}`}>
                            {temp > 0 ? '+' : ''}{temp.toFixed(1)}°C
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(log.recordedAt).toLocaleDateString('es-DO', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{log.recordedBy || '—'}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{log.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { FileText, Droplets, FlaskConical, Users, Truck, AlertTriangle, Printer, Thermometer, Plus, Download } from 'lucide-react'

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
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    blood:  'bg-blood-50 text-blood-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}><Icon size={20} /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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

  const api = process.env.NEXT_PUBLIC_API_URL
  const token = () => localStorage.getItem('sanguis_token')
  const headers = () => ({ Authorization: `Bearer ${token()}` })

  function fetchReport() {
    setLoading(true)
    fetch(`${api}/reports/sespas?from=${from}&to=${to}`, { headers: headers() })
      .then(r => r.json()).then(setReport).catch(() => {}).finally(() => setLoading(false))
  }

  function fetchTemperature() {
    setTempLoading(true)
    const params = new URLSearchParams({ limit: '30' })
    if (selectedLocation) params.set('locationId', selectedLocation)
    fetch(`${api}/reports/temperature?${params}`, { headers: headers() })
      .then(r => r.json()).then(setTempLogs).catch(() => {}).finally(() => setTempLoading(false))
  }

  useEffect(() => {
    fetchReport()
    fetch(`${api}/blood-units/locations`, { headers: headers() })
      .then(r => r.json()).then(setLocations).catch(() => {})
  }, [])

  useEffect(() => { fetchTemperature() }, [selectedLocation])

  async function submitTempLog(e: React.FormEvent) {
    e.preventDefault()
    setLoggingTemp(true)
    await fetch(`${api}/reports/temperature`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
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
      ['Reporte SESPAS — Sanguis'],
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
          <h1 className="text-2xl font-bold text-gray-900">Reportes SESPAS</h1>
          <p className="text-gray-500 text-sm mt-1">Informe regulatorio de banco de sangre — República Dominicana</p>
        </div>
        <div className="flex gap-2 print:hidden">
          {report && (
            <button
              onClick={() => exportCSV(report)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={16} /> Exportar CSV
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      {/* Period picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-end gap-4 print:hidden">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500" />
        </div>
        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-blood-500 text-white rounded-lg text-sm font-medium hover:bg-blood-600 transition-colors"
        >
          Generar reporte
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
        </div>
      ) : report ? (
        <>
          {/* Período del reporte */}
          <div className="text-xs text-gray-400 flex items-center gap-2 print:block">
            <FileText size={13} />
            Período:{' '}
            <span className="font-medium text-gray-600">
              {new Date(report.period.from).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
              {' — '}
              {new Date(report.period.to).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Droplets} label="Unidades Recolectadas" value={s?.totalUnitsCollected ?? 0} color="blood" />
            <StatCard icon={FlaskConical} label="Tests Realizados"
              value={s?.totalTests ?? 0}
              sub={s?.viabilityRate != null ? `${s.viabilityRate}% viables` : undefined}
              color="green" />
            <StatCard icon={Users} label="Donantes Nuevos"
              value={s?.newDonors ?? 0}
              sub={`${s?.totalActiveDonors ?? 0} activos en total`}
              color="blue" />
            <StatCard icon={Truck} label="Entregas Completadas" value={s?.deliveriesCompleted ?? 0} color="purple" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FlaskConical} label="Unidades Viables" value={s?.viableTests ?? 0} color="green" />
            <StatCard icon={FlaskConical} label="Unidades Rechazadas" value={s?.rejectedTests ?? 0} color="red" />
            <StatCard icon={AlertTriangle} label="Alertas de Emergencia" value={s?.emergencyAlerts ?? 0} color="yellow" />
          </div>

          {/* Tablas de desglose */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Por grupo sanguíneo */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">Por Grupo Sanguíneo</h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(BLOOD_LABELS).map(([key, label]) => {
                    const count = report.byBloodType[key] ?? 0
                    const total = s?.totalUnitsCollected || 1
                    return (
                      <tr key={key} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blood-100 text-blood-700 text-xs font-bold">{label}</span>
                        </td>
                        <td className="px-5 py-2.5 text-sm text-gray-700 tabular-nums">{count}</td>
                        <td className="px-5 py-2.5">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-blood-500 h-1.5 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-gray-400 tabular-nums">{((count / total) * 100).toFixed(0)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Por tipo de producto */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">Por Tipo de Producto</h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(PRODUCT_LABELS).map(([key, label]) => {
                    const count = report.byProductType[key] ?? 0
                    const total = s?.totalUnitsCollected || 1
                    return (
                      <tr key={key} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-2.5 text-sm text-gray-700">{label}</td>
                        <td className="px-5 py-2.5 text-sm text-gray-700 tabular-nums">{count}</td>
                        <td className="px-5 py-2.5">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-gray-400 tabular-nums">{((count / total) * 100).toFixed(0)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Por estado */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">Por Estado</h3>
              </div>
              <table className="w-full">
                <tbody>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => {
                    const count = report.byStatus[key] ?? 0
                    const total = s?.totalUnitsCollected || 1
                    return count > 0 ? (
                      <tr key={key} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-2.5 text-sm text-gray-700">{label}</td>
                        <td className="px-5 py-2.5 text-sm text-gray-700 tabular-nums">{count}</td>
                        <td className="px-5 py-2.5 text-xs text-gray-400 tabular-nums">{((count / total) * 100).toFixed(0)}%</td>
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
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center gap-2 mb-5">
          <Thermometer size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Cadena de Frío</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm text-gray-800 mb-4">Registrar lectura</h3>
            <form onSubmit={submitTempLog} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Temperatura (°C) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={logForm.tempCelsius}
                  onChange={e => setLogForm(f => ({ ...f, tempCelsius: e.target.value }))}
                  placeholder="4.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ubicación</label>
                <select
                  value={logForm.locationId}
                  onChange={e => setLogForm(f => ({ ...f, locationId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
                >
                  <option value="">— Seleccionar —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Registrado por</label>
                <input
                  type="text"
                  value={logForm.recordedBy}
                  onChange={e => setLogForm(f => ({ ...f, recordedBy: e.target.value }))}
                  placeholder="Nombre del técnico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                <input
                  type="text"
                  value={logForm.notes}
                  onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones opcionales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>
              <button
                type="submit"
                disabled={loggingTemp}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                <Plus size={15} /> {loggingTemp ? 'Guardando...' : 'Registrar lectura'}
              </button>
            </form>
          </div>

          {/* Logs table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-800">Últimas lecturas</h3>
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blood-500"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Temp.</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Por</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tempLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {[40, 80, 60, 100].map((w, j) => (
                          <td key={j} className="px-5 py-3">
                            <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : tempLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                        Sin lecturas de temperatura
                      </td>
                    </tr>
                  ) : tempLogs.map(log => {
                    const temp = log.tempCelsius
                    const isOk = temp >= 1 && temp <= 10
                    const isFrozen = temp < 1
                    return (
                      <tr key={log.id} className={`hover:bg-gray-50 ${isFrozen ? 'bg-blue-50' : !isOk ? 'bg-red-50' : ''}`}>
                        <td className="px-5 py-3">
                          <span className={`font-mono font-semibold text-sm ${isFrozen ? 'text-blue-600' : !isOk ? 'text-red-600' : 'text-green-600'}`}>
                            {temp > 0 ? '+' : ''}{temp.toFixed(1)}°C
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {new Date(log.recordedAt).toLocaleDateString('es-DO', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600">{log.recordedBy || '—'}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 max-w-[140px] truncate">{log.notes || '—'}</td>
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

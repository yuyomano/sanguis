'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  User, Crown, Droplets, Gift, Phone, Mail, Calendar,
  CheckCircle, XCircle, ArrowLeft, Plus, MapPin, FlaskConical,
} from 'lucide-react'

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}
const CATEGORY_STYLES: Record<string, string> = {
  VIP: 'bg-yellow-100 text-yellow-800',
  RECURRENT: 'bg-blue-100 text-blue-800',
  CASUAL: 'bg-gray-100 text-gray-700',
}
const STATUS_STYLES: Record<string, string> = {
  STORED: 'bg-green-100 text-green-800', APPROVED: 'bg-blue-100 text-blue-800',
  QUARANTINE: 'bg-yellow-100 text-yellow-800', TESTING: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-800', USED: 'bg-gray-100 text-gray-600',
  DISCARDED: 'bg-gray-100 text-gray-400', COLLECTED: 'bg-cyan-100 text-cyan-800',
  ALLOCATED: 'bg-purple-100 text-purple-800',
}

export default function DonorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [donor, setDonor] = useState<any>(null)
  const [eligibility, setEligibility] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const api = process.env.NEXT_PUBLIC_API_URL
  const token = () => localStorage.getItem('sanguis_token')
  const headers = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' })

  useEffect(() => {
    Promise.all([
      fetch(`${api}/donors/${id}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
      fetch(`${api}/donors/${id}/eligibility`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()),
    ]).then(([d, e]) => { setDonor(d); setEligibility(e) })
      .finally(() => setLoading(false))
  }, [id])

  async function setCategory(category: string) {
    setSaving(true)
    await fetch(`${api}/donors/${id}/category`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ category }),
    })
    setDonor((d: any) => ({ ...d, category }))
    setSaving(false)
  }

  async function togglePriority() {
    setSaving(true)
    const isPriority = !donor.isPriorityDonor
    await fetch(`${api}/donors/${id}/priority`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ isPriority }),
    })
    setDonor((d: any) => ({ ...d, isPriorityDonor: isPriority }))
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
      </div>
    )
  }
  if (!donor || donor.message) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Donante no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a Donantes
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blood-100 flex items-center justify-center">
              <User size={28} className="text-blood-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{donor.name}</h1>
                {donor.isPriorityDonor && <Crown size={18} className="text-yellow-500" />}
              </div>
              <p className="text-sm text-gray-500">{donor.idType} · {donor.idNumber}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blood-500 text-white text-sm font-bold">
                  {BLOOD_LABELS[donor.bloodType]}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[donor.category]}`}>
                  {donor.category}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push(`/inventory/new?donorId=${id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blood-500 hover:bg-blood-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={14} /> Registrar donación
            </button>
            <select
              value={donor.category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blood-500"
            >
              <option value="CASUAL">Casual</option>
              <option value="RECURRENT">Recurrente</option>
              <option value="VIP">VIP</option>
            </select>
            <button
              onClick={togglePriority}
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                donor.isPriorityDonor
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {donor.isPriorityDonor ? '⭐ Prioritario' : 'Marcar prioritario'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: 'Total donaciones', value: donor.totalDonations, icon: Droplets },
            { label: 'Puntos Sanguis', value: `${donor.pointsBalance} pts`, icon: Gift },
            { label: 'Teléfono', value: donor.phone, icon: Phone },
            { label: 'Email', value: donor.email || '—', icon: Mail },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility */}
      {eligibility && (
        <div className={`rounded-xl border p-4 mb-6 flex items-center gap-3 ${
          eligibility.eligible ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          {eligibility.eligible
            ? <CheckCircle size={20} className="text-green-600" />
            : <XCircle size={20} className="text-yellow-600" />}
          <div>
            <p className={`text-sm font-semibold ${eligibility.eligible ? 'text-green-800' : 'text-yellow-800'}`}>
              {eligibility.eligible ? 'Elegible para donar' : 'No elegible actualmente'}
            </p>
            {!eligibility.eligible && eligibility.nextEligibleDate && (
              <p className="text-xs text-yellow-700 mt-0.5">
                Puede donar a partir del{' '}
                {new Date(eligibility.nextEligibleDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}· Han pasado {eligibility.daysSinceLast} de {eligibility.requiredDays} días requeridos
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood units history */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Droplets size={16} className="text-blood-500" />
              Unidades de sangre ({donor._count?.bloodUnits ?? donor.bloodUnits?.length ?? 0})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {donor.bloodUnits?.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Sin unidades registradas</p>
            ) : donor.bloodUnits?.map((unit: any) => (
              <div key={unit.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-medium text-gray-800">{unit.bagNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {unit.productType?.replace(/_/g, ' ')} ·{' '}
                      {unit.collectionDate ? new Date(unit.collectionDate).toLocaleDateString('es-DO') : '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={11} />
                        {unit.storageLocation?.name || 'Sin ubicación'}
                      </span>
                      {unit.testResults?.length > 0 && (
                        <a
                          href={`/testing/${unit.testResults[0].id}`}
                          className="text-xs text-blood-600 hover:text-blood-700 flex items-center gap-1 font-medium"
                        >
                          <FlaskConical size={11} />
                          {unit.testResults.length} {unit.testResults.length === 1 ? 'análisis' : 'análisis'} →
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[unit.status] || ''}`}>
                    {unit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Point transactions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Gift size={16} className="text-orange-500" />
              Historial de puntos
            </h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {donor.pointTransactions?.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Sin transacciones</p>
            ) : donor.pointTransactions?.map((tx: any) => (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('es-DO') : '—'}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.points >= 0 ? '+' : ''}{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Citas recientes
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {donor.appointments?.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Sin citas registradas</p>
            ) : donor.appointments?.map((appt: any) => (
              <div key={appt.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{appt.event?.name || 'Evento'}</p>
                  <p className="text-xs text-gray-400">
                    {appt.scheduledTime ? new Date(appt.scheduledTime).toLocaleString('es-DO') : '—'}
                    {' '}· QR: <span className="font-mono">{appt.qrCode?.slice(0, 8)}…</span>
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  appt.status === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                  appt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { Gift, Star, Building2, Plus, Pencil, X, Check, Trash2, Users, ReceiptText } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailableReward { name: string; points: number }

interface Partner {
  id: string
  name: string
  category: string
  taxId: string | null
  taxDeductionPct: number
  address: string | null
  phone: string | null
  email: string | null
  availableRewards: AvailableReward[] | null
  isActive: boolean
}

interface Redemption {
  id: string
  redeemedAt: string
  pointsUsed: number
  dopValue: number
  receiptNumber: string | null
  donor: { name: string; idNumber: string }
  partner: { name: string; category: string }
}

const CATEGORIES = [
  'Farmacia', 'Clínica', 'Laboratorio', 'Restaurante', 'Supermercado',
  'Gimnasio', 'Óptica', 'Hotel', 'Servicios', 'Otro',
]

const API = process.env.NEXT_PUBLIC_API_URL

function getToken() { return localStorage.getItem('sanguis_token') }

// ─── PartnerModal ─────────────────────────────────────────────────────────────

interface PartnerModalProps {
  partner: Partner | null
  onClose: () => void
  onSaved: () => void
}

function PartnerModal({ partner, onClose, onSaved }: PartnerModalProps) {
  const editing = !!partner

  const [form, setForm] = useState({
    name: partner?.name ?? '',
    category: partner?.category ?? CATEGORIES[0],
    taxId: partner?.taxId ?? '',
    taxDeductionPct: partner?.taxDeductionPct ?? 0,
    address: partner?.address ?? '',
    phone: partner?.phone ?? '',
    email: partner?.email ?? '',
    isActive: partner?.isActive ?? true,
  })
  const [rewards, setRewards] = useState<AvailableReward[]>(
    partner?.availableRewards ?? []
  )
  const [newReward, setNewReward] = useState({ name: '', points: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addReward() {
    const pts = parseInt(newReward.points, 10)
    if (!newReward.name.trim() || isNaN(pts) || pts <= 0) return
    setRewards((r) => [...r, { name: newReward.name.trim(), points: pts }])
    setNewReward({ name: '', points: '' })
  }

  function removeReward(i: number) {
    setRewards((r) => r.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      const body = { ...form, taxDeductionPct: Number(form.taxDeductionPct), availableRewards: rewards }
      const url = editing ? `${API}/rewards/partners/${partner!.id}` : `${API}/rewards/partners`
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      onSaved()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-10 px-4 pb-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? 'Editar socio' : 'Nuevo socio'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
                placeholder="Farmacia Carol"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Deducción ITBIS %</label>
              <input
                type="number" min={0} max={100}
                value={form.taxDeductionPct}
                onChange={(e) => set('taxDeductionPct', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
          </div>

          {/* Tax ID + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">RNC / Cédula</label>
              <input
                value={form.taxId}
                onChange={(e) => set('taxId', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
                placeholder="1-23-45678-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
                placeholder="809-000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Dirección</label>
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
              />
            </div>
          </div>

          {/* Estado — solo al editar */}
          {editing && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 accent-blood-600"
              />
              <span className="text-sm text-gray-700">Activo</span>
            </label>
          )}

          {/* Available rewards */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Recompensas disponibles</label>
            <div className="space-y-2 mb-2">
              {rewards.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700">{r.name}</span>
                  <span className="text-xs font-semibold text-blood-600 flex items-center gap-0.5">
                    <Star size={11} /> {r.points} pts
                  </span>
                  <button type="button" onClick={() => removeReward(i)} className="ml-1 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newReward.name}
                onChange={(e) => setNewReward((r) => ({ ...r, name: e.target.value }))}
                placeholder="Nombre del beneficio"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addReward() } }}
              />
              <input
                type="number" min={1}
                value={newReward.points}
                onChange={(e) => setNewReward((r) => ({ ...r, points: e.target.value }))}
                placeholder="Pts"
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addReward() } }}
              />
              <button type="button" onClick={addReward} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Plus size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blood-600 hover:bg-blood-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
              {editing ? 'Guardar cambios' : 'Crear socio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [tab, setTab] = useState<'partners' | 'redemptions'>('partners')

  // Partners
  const [partners, setPartners] = useState<Partner[]>([])
  const [loadingPartners, setLoadingPartners] = useState(true)
  const [modalPartner, setModalPartner] = useState<Partner | 'new' | null>(null)

  // Redemptions
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [redemptionsTotal, setRedemptionsTotal] = useState(0)
  const [redemptionsPage, setRedemptionsPage] = useState(1)
  const [loadingRedemptions, setLoadingRedemptions] = useState(false)
  const redemptionsLoaded = useRef(false)

  function fetchPartners() {
    setLoadingPartners(true)
    fetch(`${API}/rewards/partners`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setPartners(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingPartners(false))
  }

  function fetchRedemptions(page = 1) {
    setLoadingRedemptions(true)
    fetch(`${API}/rewards/redemptions?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setRedemptions(data.redemptions ?? [])
        setRedemptionsTotal(data.total ?? 0)
        setRedemptionsPage(data.page ?? 1)
        redemptionsLoaded.current = true
      })
      .catch(() => {})
      .finally(() => setLoadingRedemptions(false))
  }

  useEffect(() => { fetchPartners() }, [])

  useEffect(() => {
    if (tab === 'redemptions' && !redemptionsLoaded.current) fetchRedemptions(1)
  }, [tab])

  const activePartners = partners.filter((p) => p.isActive)
  const inactivePartners = partners.filter((p) => !p.isActive)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="text-gray-500 text-sm mt-1">Socios aliados y canjes de puntos</p>
        </div>
        {tab === 'partners' && (
          <button
            onClick={() => setModalPartner('new')}
            className="flex items-center gap-2 bg-blood-600 hover:bg-blood-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nuevo socio
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-7">
        {([
          { key: 'partners', label: 'Socios', Icon: Building2 },
          { key: 'redemptions', label: 'Historial de canjes', Icon: ReceiptText },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── PARTNERS TAB ── */}
      {tab === 'partners' && (
        <>
          {loadingPartners ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
            </div>
          ) : partners.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 flex flex-col items-center text-center">
              <Gift size={40} className="text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-500">Sin socios registrados</h2>
              <p className="text-sm text-gray-400 mt-2">Crea el primer establecimiento aliado.</p>
            </div>
          ) : (
            <>
              {activePartners.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Activos ({activePartners.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                    {activePartners.map((partner) => (
                      <PartnerCard key={partner.id} partner={partner} onEdit={() => setModalPartner(partner)} />
                    ))}
                  </div>
                </>
              )}
              {inactivePartners.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Inactivos ({inactivePartners.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-60">
                    {inactivePartners.map((partner) => (
                      <PartnerCard key={partner.id} partner={partner} onEdit={() => setModalPartner(partner)} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── REDEMPTIONS TAB ── */}
      {tab === 'redemptions' && (
        <>
          {loadingRedemptions ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
            </div>
          ) : redemptions.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 flex flex-col items-center text-center">
              <ReceiptText size={40} className="text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-500">Sin canjes registrados</h2>
              <p className="text-sm text-gray-400 mt-2">Los canjes de los donantes aparecerán aquí.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {redemptionsTotal} canjes en total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Donante</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Establecimiento</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Puntos</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Valor DOP</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recibo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {redemptions.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{r.donor.name}</p>
                            <p className="text-xs text-gray-400">{r.donor.idNumber}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-800">{r.partner.name}</p>
                            <p className="text-xs text-gray-400">{r.partner.category}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-blood-600 flex items-center gap-1 justify-end">
                              <Star size={12} /> {r.pointsUsed.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-800">
                            RD$ {r.dopValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(r.redeemedAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                            {r.receiptNumber ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {redemptionsTotal > 20 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    Página {redemptionsPage} de {Math.ceil(redemptionsTotal / 20)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={redemptionsPage <= 1}
                      onClick={() => fetchRedemptions(redemptionsPage - 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      disabled={redemptionsPage >= Math.ceil(redemptionsTotal / 20)}
                      onClick={() => fetchRedemptions(redemptionsPage + 1)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal */}
      {modalPartner !== null && (
        <PartnerModal
          partner={modalPartner === 'new' ? null : modalPartner}
          onClose={() => setModalPartner(null)}
          onSaved={() => { setModalPartner(null); fetchPartners() }}
        />
      )}
    </div>
  )
}

function PartnerCard({ partner, onEdit }: { partner: Partner; onEdit: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-blood-50 rounded-lg flex-shrink-0">
          <Building2 size={20} className="text-blood-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{partner.name}</h3>
          <p className="text-xs text-gray-500">{partner.category}</p>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Pencil size={14} className="text-gray-400" />
        </button>
      </div>

      {partner.availableRewards && partner.availableRewards.length > 0 ? (
        <div className="space-y-1.5 mb-4">
          {partner.availableRewards.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate">{r.name}</span>
              <span className="font-medium text-blood-600 flex items-center gap-0.5 flex-shrink-0 ml-2">
                <Star size={11} /> {r.points} pts
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-4">Sin recompensas configuradas</p>
      )}

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">ITBIS: {partner.taxDeductionPct}%</p>
        {partner.email && <p className="text-xs text-gray-400 truncate max-w-32">{partner.email}</p>}
      </div>
    </div>
  )
}

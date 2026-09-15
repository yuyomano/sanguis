'use client'

import { useEffect, useState, useRef } from 'react'
import { Gift, Star, Building2, Plus, Pencil, X, Check, Trash2, Users, ReceiptText, Award, Trophy } from 'lucide-react'
import { apiFetch } from '@/lib/api'

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
      const url = editing ? `/rewards/partners/${partner!.id}` : '/rewards/partners'
      const method = editing ? 'PATCH' : 'POST'
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editing ? 'Editar socio' : 'Nuevo socio'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Farmacia Carol"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Deducción ITBIS %</label>
              <input
                type="number" min={0} max={100}
                value={form.taxDeductionPct}
                onChange={(e) => set('taxDeductionPct', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Tax ID + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">RNC / Cédula</label>
              <input
                value={form.taxId}
                onChange={(e) => set('taxId', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1-23-45678-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="809-000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Dirección</label>
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">Activo</span>
            </label>
          )}

          {/* Available rewards */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Recompensas disponibles</label>
            <div className="space-y-2 mb-2">
              {rewards.map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <span className="flex-1 text-sm text-foreground">{r.name}</span>
                  <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                    <Star size={11} /> {r.points} pts
                  </span>
                  <button type="button" onClick={() => removeReward(i)} className="ml-1 text-muted-foreground/40 hover:text-alert transition-colors">
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
                className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addReward() } }}
              />
              <input
                type="number" min={1}
                value={newReward.points}
                onChange={(e) => setNewReward((r) => ({ ...r, points: e.target.value }))}
                placeholder="Pts"
                className="w-20 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addReward() } }}
              />
              <button type="button" onClick={addReward} className="px-3 py-2 bg-muted hover:bg-border rounded-md transition-colors">
                <Plus size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-alert">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-border text-foreground rounded-md py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-blood-600 disabled:opacity-60 text-white rounded-md py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
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

interface Badge {
  id: string
  name: string
  description: string
  iconUrl: string | null
  condition: Record<string, unknown>
  createdAt: string
  _count: { donorBadges: number }
}

export default function RewardsPage() {
  const [tab, setTab] = useState<'partners' | 'redemptions' | 'badges'>('partners')

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

  // Badges
  const [badges, setBadges] = useState<Badge[]>([])
  const [loadingBadges, setLoadingBadges] = useState(false)
  const badgesLoaded = useRef(false)
  const [showBadgeForm, setShowBadgeForm] = useState(false)
  const [badgeForm, setBadgeForm] = useState({ name: '', description: '', iconUrl: '' })
  const [savingBadge, setSavingBadge] = useState(false)
  const [confirmDeleteBadge, setConfirmDeleteBadge] = useState<string | null>(null)

  function fetchPartners() {
    setLoadingPartners(true)
    apiFetch('/rewards/partners')
      .then((r) => r.json())
      .then((data) => setPartners(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingPartners(false))
  }

  function fetchRedemptions(page = 1) {
    setLoadingRedemptions(true)
    apiFetch(`/rewards/redemptions?page=${page}&limit=20`)
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

  function fetchBadges() {
    setLoadingBadges(true)
    apiFetch('/rewards/badges')
      .then(r => r.json())
      .then(data => { setBadges(Array.isArray(data) ? data : []); badgesLoaded.current = true })
      .catch(() => {})
      .finally(() => setLoadingBadges(false))
  }

  async function createBadge() {
    if (!badgeForm.name.trim()) return
    setSavingBadge(true)
    try {
      const res = await apiFetch('/rewards/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...badgeForm, condition: {} }),
      })
      if (!res.ok) throw new Error()
      setBadgeForm({ name: '', description: '', iconUrl: '' })
      setShowBadgeForm(false)
      fetchBadges()
    } catch {
      // silently fail
    } finally {
      setSavingBadge(false)
    }
  }

  async function deleteBadge(id: string) {
    await apiFetch(`/rewards/badges/${id}`, { method: 'DELETE' })
    setConfirmDeleteBadge(null)
    setBadges(prev => prev.filter(b => b.id !== id))
  }

  useEffect(() => { fetchPartners() }, [])

  useEffect(() => {
    if (tab === 'redemptions' && !redemptionsLoaded.current) fetchRedemptions(1)
    if (tab === 'badges' && !badgesLoaded.current) fetchBadges()
  }, [tab])

  const activePartners = partners.filter((p) => p.isActive)
  const inactivePartners = partners.filter((p) => !p.isActive)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Recompensas</h1>
          <p className="text-muted-foreground text-sm mt-1">Socios aliados y canjes de puntos</p>
        </div>
        {tab === 'partners' && (
          <button
            onClick={() => setModalPartner('new')}
            className="flex items-center gap-2 bg-primary hover:bg-blood-600 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nuevo socio
          </button>
        )}
        {tab === 'badges' && (
          <button
            onClick={() => setShowBadgeForm(v => !v)}
            className="flex items-center gap-2 bg-primary hover:bg-blood-600 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nueva insignia
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-md w-fit mb-7">
        {([
          { key: 'partners', label: 'Socios', Icon: Building2 },
          { key: 'redemptions', label: 'Historial de canjes', Icon: ReceiptText },
          { key: 'badges', label: 'Insignias', Icon: Award },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
            </div>
          ) : partners.length === 0 ? (
            <div className="bg-card rounded-md border border-dashed border-border p-16 flex flex-col items-center text-center">
              <Gift size={40} className="text-muted-foreground/40 mb-4" />
              <h2 className="text-lg font-semibold text-muted-foreground">Sin socios registrados</h2>
              <p className="text-sm text-muted-foreground/70 mt-2">Crea el primer establecimiento aliado.</p>
            </div>
          ) : (
            <>
              {activePartners.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
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
                  <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
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
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
            </div>
          ) : redemptions.length === 0 ? (
            <div className="bg-card rounded-md border border-dashed border-border p-16 flex flex-col items-center text-center">
              <ReceiptText size={40} className="text-muted-foreground/40 mb-4" />
              <h2 className="text-lg font-semibold text-muted-foreground">Sin canjes registrados</h2>
              <p className="text-sm text-muted-foreground/70 mt-2">Los canjes de los donantes aparecerán aquí.</p>
            </div>
          ) : (
            <>
              <div className="bg-card rounded-md border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {redemptionsTotal} canjes en total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-left">
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Donante</th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Establecimiento</th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Puntos</th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Valor DOP</th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recibo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {redemptions.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-foreground">{r.donor.name}</p>
                            <p className="text-xs text-muted-foreground/70">{r.donor.idNumber}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-foreground">{r.partner.name}</p>
                            <p className="text-xs text-muted-foreground/70">{r.partner.category}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-primary flex items-center gap-1 justify-end">
                              <Star size={12} /> {r.pointsUsed.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-foreground">
                            RD$ {r.dopValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(r.redeemedAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground/70 font-mono text-xs">
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
                  <span className="text-sm text-muted-foreground">
                    Página {redemptionsPage} de {Math.ceil(redemptionsTotal / 20)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={redemptionsPage <= 1}
                      onClick={() => fetchRedemptions(redemptionsPage - 1)}
                      className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted/50 transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      disabled={redemptionsPage >= Math.ceil(redemptionsTotal / 20)}
                      onClick={() => fetchRedemptions(redemptionsPage + 1)}
                      className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted/50 transition-colors"
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

      {/* ── BADGES TAB ── */}
      {tab === 'badges' && (
        <div className="space-y-5">
          {/* Create form */}
          {showBadgeForm && (
            <div className="bg-card rounded-md border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4">Nueva insignia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Icono (emoji)</label>
                  <input
                    value={badgeForm.iconUrl}
                    onChange={e => setBadgeForm(f => ({ ...f, iconUrl: e.target.value }))}
                    placeholder="🏅"
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre *</label>
                  <input
                    value={badgeForm.name}
                    onChange={e => setBadgeForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Donante de Hierro"
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción</label>
                  <input
                    value={badgeForm.description}
                    onChange={e => setBadgeForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="10 donaciones o más"
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowBadgeForm(false)}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted/50 transition-colors">
                  Cancelar
                </button>
                <button onClick={createBadge} disabled={!badgeForm.name || savingBadge}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blood-600 disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors">
                  {savingBadge
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Check size={15} />}
                  Crear insignia
                </button>
              </div>
            </div>
          )}

          {/* Badges grid */}
          {loadingBadges ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-md border border-border p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-muted rounded-md animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : badges.length === 0 ? (
            <div className="bg-card rounded-md border border-dashed border-border p-16 flex flex-col items-center text-center">
              <Trophy size={40} className="text-muted-foreground/40 mb-4" />
              <h2 className="text-lg font-semibold text-muted-foreground">Sin insignias creadas</h2>
              <p className="text-sm text-muted-foreground/70 mt-2">Crea insignias para reconocer los hitos de tus donantes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className="bg-card rounded-md border border-border p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blood-50 rounded-md flex items-center justify-center text-2xl flex-shrink-0">
                      {badge.iconUrl || '🏅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{badge.description || '—'}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        <span className="font-medium text-foreground">{badge._count.donorBadges}</span> donantes la han ganado
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {confirmDeleteBadge === badge.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => deleteBadge(badge.id)}
                            className="p-1.5 rounded-md bg-alert/15 hover:bg-alert/25 text-alert transition-colors">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setConfirmDeleteBadge(null)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground/70 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteBadge(badge.id)}
                          className="p-1.5 rounded-md hover:bg-alert/10 text-muted-foreground/40 hover:text-alert transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    <div className="bg-card rounded-md border border-border p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-blood-50 rounded-md flex-shrink-0">
          <Building2 size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{partner.name}</h3>
          <p className="text-xs text-muted-foreground">{partner.category}</p>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md hover:bg-muted transition-colors flex-shrink-0"
        >
          <Pencil size={14} className="text-muted-foreground/70" />
        </button>
      </div>

      {partner.availableRewards && partner.availableRewards.length > 0 ? (
        <div className="space-y-1.5 mb-4">
          {partner.availableRewards.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-foreground truncate">{r.name}</span>
              <span className="font-medium text-primary flex items-center gap-0.5 flex-shrink-0 ml-2">
                <Star size={11} /> {r.points} pts
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/70 mb-4">Sin recompensas configuradas</p>
      )}

      <div className="pt-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground/70">ITBIS: {partner.taxDeductionPct}%</p>
        {partner.email && <p className="text-xs text-muted-foreground/70 truncate max-w-32">{partner.email}</p>}
      </div>
    </div>
  )
}

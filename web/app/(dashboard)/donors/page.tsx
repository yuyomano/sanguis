'use client'

import { useEffect, useState } from 'react'
import { Search, Crown, User, Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Donor {
  id: string
  name: string
  idNumber: string
  phone: string
  bloodType: string
  rhFactor: boolean
  category: 'VIP' | 'RECURRENT' | 'CASUAL'
  totalDonations: number
  lastDonationDate: string | null
  isPriorityDonor: boolean
  pointsBalance: number
}

const CATEGORY_STYLES: Record<string, string> = {
  VIP:      'bg-yellow-100 text-yellow-800',
  RECURRENT:'bg-blue-100 text-blue-800',
  CASUAL:   'bg-gray-100 text-gray-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  VIP:      'VIP',
  RECURRENT:'Recurrente',
  CASUAL:   'Casual',
}

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i}>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-gray-100 rounded animate-pulse w-28" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
              </div>
            </div>
          </td>
          {[48, 56, 32, 40, 56].map((w, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
            </td>
          ))}
          <td className="px-6 py-4"><div className="h-3.5 bg-gray-100 rounded animate-pulse w-16" /></td>
        </tr>
      ))}
    </>
  )
}

export default function DonorsPage() {
  const router = useRouter()
  const [donors, setDonors] = useState<Donor[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const LIMIT = 20

  useEffect(() => {
    if (search === debouncedSearch) return
    setSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function fetchDonors() {
    setLoading(true)
    const token = localStorage.getItem('sanguis_token')
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (category) params.set('category', category)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/donors?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const data = await res.json()
      setDonors(data.donors || [])
      setTotal(data.total || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchDonors() }, [page, category, debouncedSearch])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donantes</h1>
          <p className="text-gray-500 text-sm mt-1">{total} donantes registrados</p>
        </div>
        <button
          onClick={() => router.push('/donors/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blood-500 hover:bg-blood-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nuevo donante
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula o teléfono..."
            className="w-full pl-9 pr-24 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blood-500 focus:border-transparent outline-none"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blood-500 font-medium animate-pulse">
              Buscando…
            </span>
          )}
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blood-500 outline-none"
        >
          <option value="">Todas las categorías</option>
          <option value="VIP">VIP</option>
          <option value="RECURRENT">Recurrente</option>
          <option value="CASUAL">Casual</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Donante</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Donaciones</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Puntos</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Última donación</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <SkeletonRows />
            ) : donors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <Users size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm font-medium">
                    {search || category ? 'Sin resultados para este filtro' : 'No hay donantes registrados'}
                  </p>
                  {!search && !category && (
                    <p className="text-gray-300 text-xs mt-1">Registra el primer donante</p>
                  )}
                </td>
              </tr>
            ) : (
              donors.map((donor) => (
                <tr key={donor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blood-100 flex items-center justify-center shrink-0">
                        <User size={16} className="text-blood-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                          {donor.name}
                          {donor.isPriorityDonor && <Crown size={13} className="text-yellow-500" />}
                        </p>
                        <p className="text-xs text-gray-500">{donor.idNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blood-100 text-blood-700 text-xs font-bold">
                      {BLOOD_LABELS[donor.bloodType] || donor.bloodType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[donor.category]}`}>
                      {CATEGORY_LABELS[donor.category] || donor.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 tabular-nums">{donor.totalDonations}</td>
                  <td className="px-6 py-4 text-sm font-medium text-blood-600 tabular-nums">{donor.pointsBalance} pts</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {donor.lastDonationDate
                      ? new Date(donor.lastDonationDate).toLocaleDateString('es-DO')
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`/donors/${donor.id}`}
                      className="text-blood-600 hover:text-blood-700 text-sm font-medium"
                    >
                      Ver perfil
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * LIMIT >= total}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Search, Crown, User, Plus } from 'lucide-react'
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
  VIP: 'bg-yellow-100 text-yellow-800',
  RECURRENT: 'bg-blue-100 text-blue-800',
  CASUAL: 'bg-gray-100 text-gray-700',
}

function bloodTypeLabel(type: string, rh: boolean) {
  const map: Record<string, string> = {
    A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
  }
  return map[type] || type
}

export default function DonorsPage() {
  const router = useRouter()
  const [donors, setDonors] = useState<Donor[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  async function fetchDonors() {
    setLoading(true)
    const token = localStorage.getItem('sanguis_token')
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
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

  useEffect(() => { fetchDonors() }, [page, category])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donantes</h1>
          <p className="text-gray-500 text-sm mt-1">{total} donantes registrados</p>
        </div>
        <button
          onClick={() => router.push('/donors/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blood-500 hover:bg-blood-600 text-white rounded-lg text-sm font-medium transition-colors"
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
            onKeyDown={(e) => e.key === 'Enter' && fetchDonors()}
            placeholder="Buscar por nombre, cédula o teléfono..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blood-500 focus:border-transparent outline-none"
          />
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
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
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">Cargando...</td>
              </tr>
            ) : donors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">Sin resultados</td>
              </tr>
            ) : (
              donors.map((donor) => (
                <tr key={donor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blood-100 flex items-center justify-center">
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
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blood-500 text-white text-sm font-bold">
                      {bloodTypeLabel(donor.bloodType, donor.rhFactor)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[donor.category]}`}>
                      {donor.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{donor.totalDonations}</td>
                  <td className="px-6 py-4 text-sm font-medium text-blood-600">{donor.pointsBalance} pts</td>
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
        {total > 20 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
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

'use client'

import { useEffect, useState } from 'react'
import { Gift, Star, Building2, Clock } from 'lucide-react'

interface Partner {
  id: string
  name: string
  category: string
  taxDeductionPct: number
  availableRewards: { name: string; points: number }[]
}

export default function RewardsPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/rewards/partners`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setPartners(data.partners || data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards & Socios</h1>
          <p className="text-gray-500 text-sm mt-1">Establecimientos aliados y programa de puntos</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
        </div>
      ) : partners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 bg-blood-50 rounded-lg">
                  <Building2 size={20} className="text-blood-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                  <p className="text-xs text-gray-500">{partner.category}</p>
                </div>
              </div>
              <div className="space-y-2">
                {partner.availableRewards?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{r.name}</span>
                    <span className="font-medium text-blood-600 flex items-center gap-1">
                      <Star size={12} /> {r.points} pts
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Deducción ITBIS: {partner.taxDeductionPct}%
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 flex flex-col items-center text-center">
          <Gift size={40} className="text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-500">Sin socios registrados</h2>
          <p className="text-sm text-gray-400 mt-2">Agrega establecimientos aliados desde el API.</p>
        </div>
      )}
    </div>
  )
}

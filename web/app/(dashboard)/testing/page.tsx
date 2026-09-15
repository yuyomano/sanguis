'use client'

import { useEffect, useState } from 'react'
import { FlaskConical, CheckCircle, XCircle, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface PendingTest {
  id: string
  testDate: string
  labType: string
  bloodUnit: {
    bagNumber: string
    bloodType: string
    productType: string
    donor: { name: string }
  }
  externalLab?: { name: string }
}

export default function TestingPage() {
  const [pending, setPending] = useState<PendingTest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/testing/pending')
      .then((r) => r.json())
      .then(setPending)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function quickApprove(testId: string, viable: boolean) {
    setSubmitting(testId)
    const results = viable
      ? { HBsAg: 'negative', HIV: 'negative', HCV: 'negative', Syphilis: 'negative', Chagas: 'negative', Hemoglobin: 14.0 }
      : { HBsAg: 'positive', HIV: 'negative', HCV: 'negative', Syphilis: 'negative' }

    await apiFetch(`/testing/tests/${testId}/results`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    })

    setPending((prev) => prev.filter((t) => t.id !== testId))
    setSubmitting(null)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Tests pendientes</h1>
        <p className="text-muted-foreground text-sm mt-1">{pending.length} tests esperando resultado</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/70">
          <FlaskConical size={40} className="mx-auto mb-3 opacity-40" />
          <p>No hay tests pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((test) => (
            <div key={test.id} className="bg-card rounded-md border border-border p-5 flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Clock size={22} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-foreground">{test.bloodUnit.bagNumber}</p>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {test.bloodUnit.productType.replace('_', ' ')}
                  </span>
                  <span className="text-xs bg-blood-50 text-primary px-2 py-0.5 rounded-full font-bold">
                    {test.bloodUnit.bloodType.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Donante: {test.bloodUnit.donor.name} •{' '}
                  {test.labType === 'EXTERNAL' && test.externalLab
                    ? `Lab: ${test.externalLab.name}`
                    : 'Laboratorio propio'}{' '}
                  • {new Date(test.testDate).toLocaleDateString('es-DO')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => quickApprove(test.id, true)}
                  disabled={submitting === test.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-clinical-success hover:bg-clinical-success/90 text-white text-sm font-medium rounded-md transition disabled:opacity-60"
                >
                  <CheckCircle size={15} />
                  Viable
                </button>
                <button
                  onClick={() => quickApprove(test.id, false)}
                  disabled={submitting === test.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-alert hover:bg-alert/90 text-white text-sm font-medium rounded-md transition disabled:opacity-60"
                >
                  <XCircle size={15} />
                  Rechazar
                </button>
                <a
                  href={`/testing/${test.id}`}
                  className="px-4 py-2 border border-input text-foreground text-sm font-medium rounded-md hover:bg-muted/50 transition"
                >
                  Ingresar resultados
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

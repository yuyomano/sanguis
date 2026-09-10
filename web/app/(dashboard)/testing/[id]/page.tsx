'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FlaskConical, CheckCircle, XCircle, Share2 } from 'lucide-react'

const SEROLOGICAL_MARKERS = [
  { key: 'HBsAg',    label: 'HBsAg (Hepatitis B)' },
  { key: 'HIV',      label: 'HIV-1/2' },
  { key: 'HCV',      label: 'HCV (Hepatitis C)' },
  { key: 'HTLV',     label: 'HTLV-I/II' },
  { key: 'Syphilis', label: 'Sífilis' },
  { key: 'Chagas',   label: 'Chagas' },
]
const NUMERIC_MARKERS = [
  { key: 'Hemoglobin',  label: 'Hemoglobina (g/dL)', placeholder: '14.2', min: 5, max: 25, step: '0.1' },
  { key: 'Hematocrit',  label: 'Hematocrito (%)',     placeholder: '42',   min: 15, max: 60, step: '1' },
  { key: 'Platelets',   label: 'Plaquetas (×10³/µL)', placeholder: '250',  min: 50, max: 1000, step: '1' },
]
const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

export default function TestResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [test, setTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [markers, setMarkers] = useState<Record<string, string>>(
    Object.fromEntries(SEROLOGICAL_MARKERS.map(m => [m.key, 'negative']))
  )
  const [numerics, setNumerics] = useState<Record<string, string>>(
    Object.fromEntries(NUMERIC_MARKERS.map(m => [m.key, '']))
  )

  const token = () => localStorage.getItem('sanguis_token')
  const api = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    fetch(`${api}/testing/tests/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(data => {
        setTest(data)
        // Pre-fill if results already exist
        if (data.results) {
          const r = data.results
          setMarkers(prev => Object.fromEntries(
            SEROLOGICAL_MARKERS.map(m => [m.key, r[m.key] ?? 'negative'])
          ))
          setNumerics(prev => Object.fromEntries(
            NUMERIC_MARKERS.map(m => [m.key, r[m.key] != null ? String(r[m.key]) : ''])
          ))
          if (data.resultDate) setSubmitted(true)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function submitResults() {
    setSubmitting(true)
    setError(null)
    const results: Record<string, any> = { ...markers }
    for (const m of NUMERIC_MARKERS) {
      if (numerics[m.key]) results[m.key] = parseFloat(numerics[m.key])
    }

    try {
      const res = await fetch(`${api}/testing/tests/${id}/results`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Error al guardar resultados')
        return
      }
      const updated = await res.json()
      setTest((t: any) => ({ ...t, ...updated }))
      setSubmitted(true)
    } catch {
      setError('Error de red.')
    } finally {
      setSubmitting(false)
    }
  }

  async function shareWithDonor() {
    setSharing(true)
    try {
      await fetch(`${api}/testing/tests/${id}/share`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}` },
      })
      setTest((t: any) => ({ ...t, sharedWithDonor: true }))
    } finally {
      setSharing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" /></div>
  }
  if (!test || test.message) {
    return <div className="p-8 text-center text-muted-foreground">Test no encontrado.</div>
  }

  const isViable = test.isViable
  const hasResult = test.resultDate != null || submitted

  return (
    <div className="p-8 max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a Laboratorio
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Ingresar resultados de test</h1>
        <p className="text-muted-foreground text-sm mt-1">Análisis de viabilidad sanguínea</p>
      </div>

      {/* Test info */}
      <div className="bg-card rounded-md border border-border p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground/70 mb-0.5">Bolsa</p>
            <p className="font-mono font-medium text-foreground">{test.bloodUnit?.bagNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-0.5">Tipo de sangre</p>
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-sm font-bold">
              {BLOOD_LABELS[test.bloodUnit?.bloodType] || '?'}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-0.5">Producto</p>
            <p className="font-medium text-foreground">{test.bloodUnit?.productType?.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-0.5">Donante</p>
            <p className="font-medium text-foreground">{test.bloodUnit?.donor?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-0.5">Laboratorio</p>
            <p className="font-medium text-foreground">
              {test.labType === 'EXTERNAL' ? test.externalLab?.name || 'Externo' : 'Laboratorio propio'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground/70 mb-0.5">Fecha test</p>
            <p className="font-medium text-foreground">
              {test.testDate ? new Date(test.testDate).toLocaleDateString('es-DO') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Result banner if already submitted */}
      {hasResult && (
        <div className={`rounded-md border p-4 mb-6 flex items-center justify-between ${
          isViable ? 'bg-clinical-success/5 border-clinical-success/30' : 'bg-alert/5 border-alert/30'
        }`}>
          <div className="flex items-center gap-3">
            {isViable
              ? <CheckCircle size={22} className="text-clinical-success" />
              : <XCircle size={22} className="text-alert" />}
            <div>
              <p className={`font-semibold ${isViable ? 'text-clinical-success' : 'text-alert'}`}>
                {isViable ? 'Sangre viable, pasa a cuarentena' : 'Sangre rechazada'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Resultado registrado el {new Date(test.resultDate || Date.now()).toLocaleDateString('es-DO')}
              </p>
            </div>
          </div>
          {isViable && !test.sharedWithDonor && (
            <button
              onClick={shareWithDonor}
              disabled={sharing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-clinical-success hover:bg-clinical-success/90 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Share2 size={14} /> {sharing ? 'Compartiendo…' : 'Compartir con donante'}
            </button>
          )}
          {test.sharedWithDonor && (
            <span className="text-xs text-clinical-success flex items-center gap-1">
              <CheckCircle size={13} /> Compartido con donante
            </span>
          )}
        </div>
      )}

      {/* Results form */}
      <div className="bg-card rounded-md border border-border p-6">
        <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
          <FlaskConical size={18} className="text-primary" />
          Marcadores serológicos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {SEROLOGICAL_MARKERS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
              <div className="flex gap-2">
                {['negative', 'positive'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={hasResult}
                    onClick={() => setMarkers(m => ({ ...m, [key]: val }))}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      markers[key] === val
                        ? val === 'negative'
                          ? 'bg-clinical-success border-clinical-success text-white'
                          : 'bg-alert border-alert text-white'
                        : 'border-input text-muted-foreground hover:border-primary/40'
                    } disabled:cursor-not-allowed`}
                  >
                    {val === 'negative' ? '✓ Negativo' : '✗ Positivo'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-semibold text-foreground mb-4">Parámetros hematológicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {NUMERIC_MARKERS.map(({ key, label, placeholder, min, max, step }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                disabled={hasResult}
                value={numerics[key]}
                onChange={(e) => setNumerics(n => ({ ...n, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary disabled:bg-muted/50 disabled:text-muted-foreground"
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-alert/5 border border-alert/30 text-alert text-sm px-4 py-3 rounded-md">{error}</div>
        )}

        {!hasResult && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMarkers(Object.fromEntries(SEROLOGICAL_MARKERS.map(m => [m.key, 'negative'])))
                setNumerics({ Hemoglobin: '14.2', Hematocrit: '42', Platelets: '250' })
              }}
              className="px-4 py-2.5 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Auto-rellenar normales
            </button>
            <button
              onClick={submitResults}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : 'Guardar resultados y determinar viabilidad'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Search, X, Upload } from 'lucide-react'

const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

const COUNTRY_CODES = [
  { code: '+1-809', label: 'RD (+1-809)' },
  { code: '+1-829', label: 'RD (+1-829)' },
  { code: '+1-849', label: 'RD (+1-849)' },
  { code: '+1', label: 'EE.UU. / CA (+1)' },
  { code: '+52', label: 'México (+52)' },
  { code: '+57', label: 'Colombia (+57)' },
  { code: '+58', label: 'Venezuela (+58)' },
  { code: '+54', label: 'Argentina (+54)' },
  { code: '+55', label: 'Brasil (+55)' },
  { code: '+56', label: 'Chile (+56)' },
  { code: '+51', label: 'Perú (+51)' },
  { code: '+34', label: 'España (+34)' },
  { code: '+44', label: 'Reino Unido (+44)' },
  { code: '+33', label: 'Francia (+33)' },
  { code: '+49', label: 'Alemania (+49)' },
  { code: '+39', label: 'Italia (+39)' },
  { code: '+593', label: 'Ecuador (+593)' },
  { code: '+507', label: 'Panamá (+507)' },
  { code: '+504', label: 'Honduras (+504)' },
  { code: '+503', label: 'El Salvador (+503)' },
  { code: '+502', label: 'Guatemala (+502)' },
  { code: '+506', label: 'Costa Rica (+506)' },
]

export default function NewDonorPage() {
  const router = useRouter()
  const api = process.env.NEXT_PUBLIC_API_URL
  const token = () => localStorage.getItem('sanguis_token')
  const authHeaders = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    idType: 'CEDULA',
    idNumber: '',
    countryCode: '+1-809',
    phoneNumber: '',
    email: '',
    bloodType: '',
    password: '',
    adminNotes: '',
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)

  // Referral search
  const [refSearch, setRefSearch] = useState('')
  const [refResults, setRefResults] = useState<any[]>([])
  const [refSearching, setRefSearching] = useState(false)
  const [referredBy, setReferredBy] = useState<any>(null)

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const original = reader.result as string
      // Resize via canvas to max 300x300 to keep payload small
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 300
        const ratio = Math.min(MAX / img.width, MAX / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const resized = canvas.toDataURL('image/jpeg', 0.8)
        setPhotoPreview(resized)
        setPhotoBase64(resized)
      }
      img.src = original
    }
    reader.readAsDataURL(file)
  }

  async function searchReferral() {
    if (!refSearch.trim()) return
    setRefSearching(true)
    try {
      const res = await fetch(
        `${api}/donors?search=${encodeURIComponent(refSearch)}&limit=5`,
        { headers: { Authorization: `Bearer ${token()}` } },
      )
      const data = await res.json()
      setRefResults(data.donors || [])
    } catch {}
    setRefSearching(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const tok = token()
    if (!tok) { router.replace('/login'); return }
    if (!form.bloodType) { setError('Selecciona el tipo de sangre'); return }
    if (!form.phoneNumber.trim()) { setError('Ingresa el número de teléfono'); return }

    setLoading(true)
    setError(null)

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`
    const fullPhone = `${form.countryCode} ${form.phoneNumber.trim()}`

    const body: Record<string, any> = {
      name: fullName,
      idType: form.idType,
      idNumber: form.idNumber,
      phone: fullPhone,
      bloodType: form.bloodType,
      rhFactor: form.bloodType.endsWith('_POSITIVE'),
    }
    // Sin contraseña explícita, la API genera una temporal aleatoria (no usar la cédula).
    if (form.password.trim()) body.password = form.password.trim()
    if (form.email) body.email = form.email
    if (referredBy) body.referredById = referredBy.id
    if (photoBase64) body.photoUrl = photoBase64
    if (form.adminNotes.trim()) body.adminNotes = form.adminNotes.trim()

    try {
      const res = await fetch(`${api}/donors`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.status === 401) { router.replace('/login'); return }
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : data.message)
        return
      }
      if (data.generatedPassword) {
        alert(`Contraseña temporal generada para ${data.name}: ${data.generatedPassword}\n\nAnótala — no se volverá a mostrar.`)
      }
      router.push(`/donors/${data.id}`)
    } catch {
      setError('Error de red. Verifica que la API esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a donantes
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blood-50 flex items-center justify-center">
          <User size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Nuevo donante</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Registrar perfil en el sistema</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Foto + Datos personales */}
        <div className="bg-card rounded-md border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Datos personales</h2>

          {/* Foto */}
          <div className="flex items-start gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-input flex items-center justify-center cursor-pointer overflow-hidden hover:border-blood-400 transition-colors shrink-0"
            >
              {photoPreview
                ? <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                : <Upload size={20} className="text-muted-foreground/70" />
              }
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium text-foreground">Foto del donante</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Opcional · Clic en el círculo para subir</p>
              {photoPreview && (
                <button type="button" onClick={() => { setPhotoPreview(null); setPhotoBase64(null) }}
                  className="text-xs text-alert hover:text-alert/80 mt-1 flex items-center gap-1">
                  <X size={12} /> Quitar foto
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Nombres / Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nombres *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="Ej: María Elena"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Apellidos *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                placeholder="Ej: García López"
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Documento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tipo de documento *</label>
              <select
                value={form.idType}
                onChange={(e) => set('idType', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="CEDULA">Cédula</option>
                <option value="PASSPORT">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Número de documento *</label>
              <input
                required
                value={form.idNumber}
                onChange={(e) => set('idNumber', e.target.value)}
                placeholder="001-0000000-0"
                className="w-full px-3 py-2 border border-input rounded-md text-sm font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-card rounded-md border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contacto</h2>

          {/* Teléfono internacional */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Teléfono *</label>
            <div className="flex gap-2">
              <select
                value={form.countryCode}
                onChange={(e) => set('countryCode', e.target.value)}
                className="w-44 px-2 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-primary shrink-0"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                required
                value={form.phoneNumber}
                onChange={(e) => set('phoneNumber', e.target.value)}
                placeholder="000-000-0000"
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Tipo de sangre */}
        <div className="bg-card rounded-md border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Tipo de sangre *</h2>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(BLOOD_LABELS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => set('bloodType', k)}
                className={`py-2.5 rounded-md text-sm font-semibold border transition-colors ${
                  form.bloodType === k
                    ? 'bg-primary border-blood-500 text-white'
                    : 'border-input text-foreground hover:border-blood-300 hover:bg-blood-50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Info adicional */}
        <div className="bg-card rounded-md border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Información adicional</h2>

          {/* Referido por */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Referido por</label>
            {referredBy ? (
              <div className="flex items-center justify-between bg-clinical-success/5 border border-clinical-success/30 rounded-md px-3 py-2">
                <span className="text-sm text-clinical-success">✓ {referredBy.name} · {referredBy.idNumber}</span>
                <button type="button" onClick={() => { setReferredBy(null); setRefSearch('') }}
                  className="text-clinical-success hover:text-clinical-success/80">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  value={refSearch}
                  onChange={(e) => { setRefSearch(e.target.value); if (!e.target.value) setRefResults([]) }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchReferral())}
                  placeholder="Buscar donante que refirió (Enter)"
                  className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                {refSearching && <p className="text-xs text-muted-foreground/70 mt-1">Buscando...</p>}
                {refResults.length > 0 && (
                  <div className="mt-1 border border-border rounded-md overflow-hidden shadow-sm">
                    {refResults.map((d) => (
                      <button key={d.id} type="button"
                        onClick={() => { setReferredBy(d); setRefResults([]) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center justify-between text-sm border-b border-border last:border-0">
                        <span className="font-medium text-foreground">{d.name}</span>
                        <span className="text-xs text-muted-foreground">{d.idNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comentarios del admin */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Comentarios / Notas internas</label>
            <textarea
              rows={3}
              value={form.adminNotes}
              onChange={(e) => set('adminNotes', e.target.value)}
              placeholder="Observaciones relevantes para el equipo médico..."
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Contraseña temporal */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Contraseña temporal (app móvil)</label>
            <input
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Dejar en blanco para generar una automáticamente"
              className="w-full px-3 py-2 border border-input rounded-md text-sm font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
            <p className="text-xs text-muted-foreground/70 mt-1">Si la dejas en blanco, el sistema genera una contraseña aleatoria y te la muestra al crear el donante.</p>
          </div>
        </div>

        {error && (
          <div className="bg-alert/5 border border-alert/30 text-alert text-sm px-4 py-3 rounded-md">{error}</div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading || !form.bloodType}
            className="flex-1 px-4 py-2.5 bg-primary hover:bg-blood-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60">
            {loading ? 'Registrando...' : 'Crear donante'}
          </button>
        </div>
      </form>
    </div>
  )
}

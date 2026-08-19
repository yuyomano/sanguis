'use client'

import { useEffect, useState } from 'react'
import { Bell, MessageCircle, Mail, AlertTriangle, History, Zap, Droplets } from 'lucide-react'
import {
  type BloodType, type ComponentType, type UrgencyLevel,
  BLOOD_LABELS, COMPONENT_LABELS,
  getCompatibleDonorTypes, getRecommendedMethod, isUrgentCase,
  buildMessageTemplate,
} from '../../../lib/hematology'

const BLOOD_TYPES: BloodType[] = ['O_POSITIVE', 'O_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE']
const COMPONENTS: ComponentType[] = ['WHOLE_BLOOD', 'PLATELETS', 'PLASMA']

const URGENCY_OPTS: { value: UrgencyLevel; label: string; level: number }[] = [
  { value: 'NORMAL', label: 'Normal', level: 1 },
  { value: 'ALTA', label: 'Alta', level: 2 },
  { value: 'CRITICA', label: 'Crítica', level: 3 },
]

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  NORMAL: 'bg-gray-100 text-gray-700',
  ALTA: 'bg-yellow-100 text-yellow-700',
  CRITICA: 'bg-red-100 text-red-700',
}

const TYPE_LABELS: Record<string, string> = { WHATSAPP: 'WhatsApp', EMAIL: 'Email', PUSH: 'Push' }
const STATUS_STYLES: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-700',
  SENT:      'bg-blue-100 text-blue-700',
  FAILED:    'bg-red-100 text-red-700',
  PENDING:   'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<string, string> = {
  DELIVERED: 'Entregada', SENT: 'Enviada', FAILED: 'Error', PENDING: 'Pendiente',
}

interface NotifRecord {
  id: string
  type: string
  recipient: string
  subject: string | null
  body: string
  status: string
  createdAt: string
  donor: { name: string } | null
}

interface PreviewData { compatibleTypes: string[]; donorCount: number }

export default function NotificationsPage() {
  const [tab, setTab] = useState<'enviar' | 'historial'>('enviar')

  // Emergency form
  const [bloodType, setBloodType] = useState<BloodType>('O_NEGATIVE')
  const [component, setComponent] = useState<ComponentType>('WHOLE_BLOOD')
  const [urgency, setUrgency] = useState<UrgencyLevel>('ALTA')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // History
  const [history, setHistory] = useState<NotifRecord[]>([])
  const [histTotal, setHistTotal] = useState(0)
  const [histPage, setHistPage] = useState(1)
  const [histLoading, setHistLoading] = useState(false)
  const HIST_LIMIT = 30

  const token = () => localStorage.getItem('sanguis_token')
  const api = process.env.NEXT_PUBLIC_API_URL

  const compatibleTypes = getCompatibleDonorTypes(bloodType, component)
  const recommendedMethod = getRecommendedMethod(component)
  const urgent = isUrgentCase(bloodType, component)

  // Auto-generate message when inputs change
  useEffect(() => {
    setMessage(buildMessageTemplate(bloodType, component, urgency, compatibleTypes))
  }, [bloodType, component, urgency])

  // Fetch real donor count from API
  useEffect(() => {
    setPreviewLoading(true)
    setPreview(null)
    fetch(`${api}/notifications/emergency/preview?bloodType=${bloodType}&productType=${component}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then((d: PreviewData) => setPreview(d))
      .catch(() => {})
      .finally(() => setPreviewLoading(false))
  }, [bloodType, component])

  async function sendEmergency() {
    setSending(true)
    setResult(null)
    const urgencyLevel = URGENCY_OPTS.find(o => o.value === urgency)?.level ?? 2
    try {
      const res = await fetch(`${api}/notifications/emergency`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloodType, productType: component, message, urgencyLevel }),
      })
      const data = await res.json()
      setResult(`Alerta enviada a ${data.notified} donantes compatibles`)
    } catch {
      setResult('Error al enviar la alerta')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (tab !== 'historial') return
    setHistLoading(true)
    fetch(`${api}/notifications?page=${histPage}&limit=${HIST_LIMIT}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(data => { setHistory(data.notifications || []); setHistTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [tab, histPage])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de Notificaciones</h1>
          <p className="text-gray-500 text-sm mt-1">WhatsApp, Email y Push notifications</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['enviar', 'historial'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'enviar' ? 'Enviar' : 'Historial'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'enviar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Smart Emergency Alert */}
          <div className="bg-white rounded-xl border border-red-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-lg">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Alerta de Emergencia</h2>
                <p className="text-sm text-gray-500">Convocatoria inteligente por compatibilidad clínica</p>
              </div>
            </div>

            {/* Selectors row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Grupo paciente</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value as BloodType)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400"
                >
                  {BLOOD_TYPES.map(t => <option key={t} value={t}>{BLOOD_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Componente</label>
                <select
                  value={component}
                  onChange={e => setComponent(e.target.value as ComponentType)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400"
                >
                  {COMPONENTS.map(c => <option key={c} value={c}>{COMPONENT_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Urgencia</label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400"
                >
                  {URGENCY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Clinical Preview Panel */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Análisis clínico</p>

              <div>
                <p className="text-xs text-gray-500 mb-1.5">Grupos donantes compatibles (prioridad clínica)</p>
                <div className="flex flex-wrap gap-1.5">
                  {compatibleTypes.map((t, i) => (
                    <span
                      key={t}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                        i === 0 ? 'bg-blood-500 text-white' : 'bg-blood-100 text-blood-700'
                      }`}
                    >
                      {BLOOD_LABELS[t as BloodType]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Método recomendado</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 ${
                    recommendedMethod === 'APHERESIS' ? 'text-purple-700' : 'text-blue-700'
                  }`}>
                    <Zap size={11} />
                    {recommendedMethod === 'APHERESIS' ? 'Aféresis' : 'Sangre Total'}
                  </span>
                </div>
                {urgent && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Difusión prioritaria
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Droplets size={13} className="text-gray-400" />
                <span className="text-xs text-gray-600">
                  {previewLoading ? (
                    <span className="inline-block w-32 h-3 bg-gray-200 rounded animate-pulse" />
                  ) : preview != null ? (
                    <>
                      <strong className="text-gray-800">{preview.donorCount}</strong> donantes compatibles en la base
                      {' · '}~<strong className="text-gray-800">{Math.round(preview.donorCount * 0.12)}</strong> respuestas esperadas
                    </>
                  ) : 'Calculando...'}
                </span>
              </div>
            </div>

            {/* Message textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Emergencia</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="El mensaje se genera automáticamente..."
              />
              <p className="text-xs text-gray-400 mt-0.5">Puedes editar el mensaje antes de enviar</p>
            </div>

            {result && (
              <div className={`border text-sm px-4 py-3 rounded-lg ${
                result.startsWith('Error')
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                {result}
              </div>
            )}

            <button
              onClick={sendEmergency}
              disabled={!message || sending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {sending ? 'Enviando...' : `Enviar Alerta ${urgency === 'CRITICA' ? 'Crítica' : urgency === 'ALTA' ? 'Urgente' : ''}`}
            </button>
          </div>

          {/* Channels info */}
          <div className="space-y-4">
            {[
              { icon: MessageCircle, iconCls: 'bg-green-100 text-green-600', title: 'WhatsApp Business', desc: 'Notificaciones de eventos, citas, resultados de test y alertas de emergencia via Meta Cloud API.' },
              { icon: Mail, iconCls: 'bg-blue-100 text-blue-600', title: 'Email (SendGrid)', desc: 'Emails de bienvenida, resúmenes mensuales de donación y certificados en PDF.' },
              { icon: Bell, iconCls: 'bg-purple-100 text-purple-600', title: 'Push (Firebase)', desc: 'Notificaciones push en la app móvil para recordatorios y actualizaciones en tiempo real.' },
            ].map(({ icon: Icon, iconCls, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${iconCls}`}><Icon size={20} /></div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{title}</p>
                  <p className="text-sm text-gray-500 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Historial ──────────────────────────────────────────────── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Canal</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destinatario</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mensaje</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {histLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[40, 90, 180, 60, 70].map((w, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3.5 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <History size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm">Sin notificaciones enviadas</p>
                  </td>
                </tr>
              ) : history.map(n => (
                <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800 font-medium">{n.donor?.name || '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{n.recipient}</p>
                  </td>
                  <td className="px-6 py-4 max-w-[260px]">
                    {n.subject && <p className="text-xs font-semibold text-gray-700 mb-0.5">{n.subject}</p>}
                    <p className="text-xs text-gray-500 truncate">{n.body}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[n.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[n.status] || n.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {histTotal > HIST_LIMIT && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Mostrando {(histPage - 1) * HIST_LIMIT + 1}–{Math.min(histPage * HIST_LIMIT, histTotal)} de {histTotal}</p>
              <div className="flex gap-2">
                <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={histPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors">
                  Anterior
                </button>
                <button onClick={() => setHistPage(p => p + 1)} disabled={histPage * HIST_LIMIT >= histTotal}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors">
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Bell, MessageCircle, Mail, AlertTriangle, History, Zap, Droplets } from 'lucide-react'
import {
  type BloodType, type ComponentType, type UrgencyLevel,
  BLOOD_LABELS, COMPONENT_LABELS,
  getCompatibleDonorTypes, getRecommendedMethod, isUrgentCase,
  buildMessageTemplate,
} from '../../../lib/hematology'
import { apiFetch } from '@/lib/api'

const BLOOD_TYPES: BloodType[] = ['O_POSITIVE', 'O_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE']
const COMPONENTS: ComponentType[] = ['WHOLE_BLOOD', 'PLATELETS', 'PLASMA']

const URGENCY_OPTS: { value: UrgencyLevel; label: string; level: number }[] = [
  { value: 'NORMAL', label: 'Normal', level: 1 },
  { value: 'ALTA', label: 'Alta', level: 2 },
  { value: 'CRITICA', label: 'Crítica', level: 3 },
]

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  NORMAL: 'bg-muted text-foreground',
  ALTA: 'bg-blood-50 text-primary',
  CRITICA: 'bg-alert/15 text-alert',
}

const TYPE_LABELS: Record<string, string> = { WHATSAPP: 'WhatsApp', EMAIL: 'Email', PUSH: 'Push' }
const STATUS_STYLES: Record<string, string> = {
  DELIVERED: 'bg-clinical-success/15 text-clinical-success',
  SENT:      'bg-blood-50 text-primary',
  FAILED:    'bg-alert/15 text-alert',
  PENDING:   'bg-muted text-muted-foreground',
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
    apiFetch(`/notifications/emergency/preview?bloodType=${bloodType}&productType=${component}`)
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
      const res = await apiFetch('/notifications/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    apiFetch(`/notifications?page=${histPage}&limit=${HIST_LIMIT}`)
      .then(r => r.json())
      .then(data => { setHistory(data.notifications || []); setHistTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [tab, histPage])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Centro de notificaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">WhatsApp, Email y Push notifications</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {(['enviar', 'historial'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
          <div className="bg-card rounded-md border border-alert/30 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-alert/10 rounded-md">
                <AlertTriangle size={20} className="text-alert" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Alerta de emergencia</h2>
                <p className="text-sm text-muted-foreground">Convocatoria inteligente por compatibilidad clínica</p>
              </div>
            </div>

            {/* Selectors row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Grupo paciente</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value as BloodType)}
                  className="w-full px-2 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-alert/40"
                >
                  {BLOOD_TYPES.map(t => <option key={t} value={t}>{BLOOD_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Componente</label>
                <select
                  value={component}
                  onChange={e => setComponent(e.target.value as ComponentType)}
                  className="w-full px-2 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-alert/40"
                >
                  {COMPONENTS.map(c => <option key={c} value={c}>{COMPONENT_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Urgencia</label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full px-2 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-alert/40"
                >
                  {URGENCY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Clinical Preview Panel */}
            <div className="bg-muted/50 rounded-md p-4 space-y-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Análisis clínico</p>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Grupos donantes compatibles (prioridad clínica)</p>
                <div className="flex flex-wrap gap-1.5">
                  {compatibleTypes.map((t, i) => (
                    <span
                      key={t}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                        i === 0 ? 'bg-primary text-white' : 'bg-blood-50 text-primary'
                      }`}
                    >
                      {BLOOD_LABELS[t as BloodType]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Método recomendado</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 ${
                    recommendedMethod === 'APHERESIS' ? 'text-plasma' : 'text-primary'
                  }`}>
                    <Zap size={11} />
                    {recommendedMethod === 'APHERESIS' ? 'Aféresis' : 'Sangre Total'}
                  </span>
                </div>
                {urgent && (
                  <span className="text-xs font-medium text-alert bg-alert/10 px-2 py-0.5 rounded-full">
                    Difusión prioritaria
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Droplets size={13} className="text-muted-foreground/70" />
                <span className="text-xs text-muted-foreground">
                  {previewLoading ? (
                    <span className="inline-block w-32 h-3 bg-muted rounded animate-pulse" />
                  ) : preview != null ? (
                    <>
                      <strong className="text-foreground">{preview.donorCount}</strong> donantes compatibles en la base
                      {' · '}~<strong className="text-foreground">{Math.round(preview.donorCount * 0.12)}</strong> respuestas esperadas
                    </>
                  ) : 'Calculando...'}
                </span>
              </div>
            </div>

            {/* Message textarea */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Mensaje de Emergencia</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-alert/40 resize-none"
                placeholder="El mensaje se genera automáticamente..."
              />
              <p className="text-xs text-muted-foreground/70 mt-0.5">Puedes editar el mensaje antes de enviar</p>
            </div>

            {result && (
              <div className={`border text-sm px-4 py-3 rounded-md ${
                result.startsWith('Error')
                  ? 'bg-alert/5 border-alert/30 text-alert'
                  : 'bg-clinical-success/5 border-clinical-success/30 text-clinical-success'
              }`}>
                {result}
              </div>
            )}

            <button
              onClick={sendEmergency}
              disabled={!message || sending}
              className="w-full bg-alert hover:bg-alert/90 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-60"
            >
              {sending ? 'Enviando…' : `Enviar alerta${urgency === 'CRITICA' ? ' crítica' : urgency === 'ALTA' ? ' urgente' : ''}`}
            </button>
          </div>

          {/* Channels info */}
          <div className="space-y-4">
            {[
              { icon: MessageCircle, iconCls: 'bg-green-100 text-green-600', title: 'WhatsApp Business', desc: 'Notificaciones de eventos, citas, resultados de test y alertas de emergencia via Meta Cloud API.' },
              { icon: Mail, iconCls: 'bg-blue-100 text-blue-600', title: 'Email (SendGrid)', desc: 'Emails de bienvenida, resúmenes mensuales de donación y certificados en PDF.' },
              { icon: Bell, iconCls: 'bg-purple-100 text-purple-600', title: 'Push (Firebase)', desc: 'Notificaciones push en la app móvil para recordatorios y actualizaciones en tiempo real.' },
            ].map(({ icon: Icon, iconCls, title, desc }) => (
              <div key={title} className="bg-card rounded-md border border-border p-5 flex items-start gap-4">
                <div className={`p-2.5 rounded-md ${iconCls}`}><Icon size={20} /></div>
                <div>
                  <p className="font-medium text-foreground text-sm">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Historial ──────────────────────────────────────────────── */
        <div className="bg-card rounded-md border border-border overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Canal</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destinatario</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mensaje</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {histLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[40, 90, 180, 60, 70].map((w, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3.5 bg-muted rounded animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <History size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground/70 text-sm">Sin notificaciones enviadas</p>
                  </td>
                </tr>
              ) : history.map(n => (
                <tr key={n.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground font-medium">{n.donor?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">{n.recipient}</p>
                  </td>
                  <td className="px-6 py-4 max-w-[260px]">
                    {n.subject && <p className="text-xs font-semibold text-foreground mb-0.5">{n.subject}</p>}
                    <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[n.status] || 'bg-muted text-muted-foreground'}`}>
                      {STATUS_LABELS[n.status] || n.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {histTotal > HIST_LIMIT && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Mostrando {(histPage - 1) * HIST_LIMIT + 1}–{Math.min(histPage * HIST_LIMIT, histTotal)} de {histTotal}</p>
              <div className="flex gap-2">
                <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={histPage === 1}
                  className="px-3 py-1.5 text-sm border border-input rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors">
                  Anterior
                </button>
                <button onClick={() => setHistPage(p => p + 1)} disabled={histPage * HIST_LIMIT >= histTotal}
                  className="px-3 py-1.5 text-sm border border-input rounded-md disabled:opacity-50 hover:bg-muted/50 transition-colors">
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

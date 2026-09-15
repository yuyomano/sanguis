'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, MessageCircle, Mail, History, ArrowRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'

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

export default function NotificationsPage() {
  const [tab, setTab] = useState<'canales' | 'historial'>('canales')

  // History
  const [history, setHistory] = useState<NotifRecord[]>([])
  const [histTotal, setHistTotal] = useState(0)
  const [histPage, setHistPage] = useState(1)
  const [histLoading, setHistLoading] = useState(false)
  const HIST_LIMIT = 30

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
          {(['canales', 'historial'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'canales' ? 'Canales' : 'Historial'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'canales' ? (
        <div className="space-y-4">
          <Link
            href="/emergency"
            className="flex items-center justify-between bg-card rounded-md border border-alert/30 p-5 hover:bg-alert/5 transition-colors"
          >
            <div>
              <h2 className="font-semibold text-foreground">Alertas de emergencia</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Registrar una solicitud y convocar donantes compatibles</p>
            </div>
            <ArrowRight size={18} className="text-alert" />
          </Link>

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

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Mail, Bell, Database, Server } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface SystemStatus {
  whatsapp: boolean
  sendgrid: boolean
  firebase: boolean
  database: boolean
  environment: string
}

const INTEGRATIONS = [
  {
    key: 'whatsapp' as const,
    label: 'Meta WhatsApp Business',
    Icon: MessageSquare,
    color: '#25D366',
    envVars: ['META_WHATSAPP_TOKEN', 'META_PHONE_NUMBER_ID'],
    description: 'Mensajes automáticos a donantes — alertas, confirmaciones y eventos.',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
  },
  {
    key: 'sendgrid' as const,
    label: 'SendGrid Email',
    Icon: Mail,
    color: '#1A82E2',
    envVars: ['SENDGRID_API_KEY'],
    description: 'Correos transaccionales — registro, resultados de laboratorio y eventos.',
    docsUrl: 'https://docs.sendgrid.com/for-developers/sending-email/api-getting-started',
  },
  {
    key: 'firebase' as const,
    label: 'Firebase Cloud Messaging',
    Icon: Bell,
    color: '#F59E0B',
    envVars: ['FIREBASE_SERVICE_ACCOUNT_JSON'],
    description: 'Push notifications en la app móvil — foreground, background y app cerrada.',
    docsUrl: 'https://firebase.google.com/docs/cloud-messaging',
  },
  {
    key: 'database' as const,
    label: 'Base de datos PostgreSQL',
    Icon: Database,
    color: '#3B82F6',
    envVars: ['DATABASE_URL'],
    description: 'Conexión a la base de datos principal. Si el API responde, está activa.',
    docsUrl: null,
  },
]

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    apiFetch('/auth/admin/status')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => setStatus(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const activeCount = status
    ? INTEGRATIONS.filter((i) => status[i.key]).length
    : 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Estado del sistema e integraciones</p>
      </div>

      {/* Summary banner */}
      {!loading && status && (
        <div className={`rounded-md px-6 py-4 mb-8 flex items-center gap-4 ${
          activeCount === INTEGRATIONS.length
            ? 'bg-clinical-success/5 border border-clinical-success/30'
            : activeCount === 0
            ? 'bg-alert/5 border border-alert/30'
            : 'bg-platelet/5 border border-platelet/30'
        }`}>
          <Server size={22} className={activeCount === INTEGRATIONS.length ? 'text-clinical-success' : activeCount === 0 ? 'text-alert' : 'text-platelet'} />
          <div>
            <p className="font-semibold text-sm text-foreground">
              {activeCount} de {INTEGRATIONS.length} integraciones activas
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Entorno: <span className="font-mono font-semibold">{status.environment}</span>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary" />
        </div>
      ) : error ? (
        <div className="bg-alert/5 border border-alert/30 rounded-md p-8 text-center">
          <XCircle size={32} className="text-alert/70 mx-auto mb-3" />
          <p className="text-alert font-medium">No se pudo obtener el estado del sistema</p>
          <p className="text-sm text-alert/70 mt-1">Verifica que el API esté corriendo y que tu sesión esté activa.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {INTEGRATIONS.map(({ key, label, Icon, color, envVars, description, docsUrl }) => {
            const active = status?.[key] ?? false
            return (
              <div key={key} className={`bg-card rounded-md border p-6 transition-all ${active ? 'border-border' : 'border-dashed border-input'}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="p-2.5 rounded-md flex-shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground">{label}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-clinical-success/15 text-clinical-success'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {active
                          ? <><CheckCircle2 size={11} /> Activo</>
                          : <><XCircle size={11} /> No configurado</>
                        }
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{description}</p>

                    {!active && (
                      <div className="bg-muted/50 rounded-md px-4 py-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                          Variables de entorno requeridas:
                        </p>
                        <div className="space-y-1">
                          {envVars.map((v) => (
                            <code key={v} className="block text-xs font-mono text-foreground bg-card border border-border px-2 py-1 rounded">
                              {v}=<span className="text-muted-foreground/70">tu_valor_aquí</span>
                            </code>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          Agrega estas variables en el archivo <code className="font-mono">.env</code> del API y reinicia el servidor.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {active
                      ? <CheckCircle2 size={22} className="text-clinical-success" />
                      : <XCircle size={22} className="text-muted-foreground/40" />
                    }
                  </div>
                </div>

                {docsUrl && !active && (
                  <div className="mt-3 pl-14">
                    <a
                      href={docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:text-blood-700 hover:underline"
                    >
                      Ver documentación
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

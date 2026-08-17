'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, MessageSquare, Mail, Bell, Database, Server } from 'lucide-react'

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
    const token = localStorage.getItem('sanguis_token')
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Estado del sistema e integraciones</p>
      </div>

      {/* Summary banner */}
      {!loading && status && (
        <div className={`rounded-xl px-6 py-4 mb-8 flex items-center gap-4 ${
          activeCount === INTEGRATIONS.length
            ? 'bg-green-50 border border-green-200'
            : activeCount === 0
            ? 'bg-red-50 border border-red-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <Server size={22} className={activeCount === INTEGRATIONS.length ? 'text-green-600' : activeCount === 0 ? 'text-red-500' : 'text-amber-500'} />
          <div>
            <p className="font-semibold text-sm text-gray-800">
              {activeCount} de {INTEGRATIONS.length} integraciones activas
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Entorno: <span className="font-mono font-semibold">{status.environment}</span>
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blood-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium">No se pudo obtener el estado del sistema</p>
          <p className="text-sm text-red-400 mt-1">Verifica que el API esté corriendo y que tu sesión esté activa.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {INTEGRATIONS.map(({ key, label, Icon, color, envVars, description, docsUrl }) => {
            const active = status?.[key] ?? false
            return (
              <div key={key} className={`bg-white rounded-xl border p-6 transition-all ${active ? 'border-gray-200' : 'border-dashed border-gray-300'}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{label}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {active
                          ? <><CheckCircle2 size={11} /> Activo</>
                          : <><XCircle size={11} /> No configurado</>
                        }
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{description}</p>

                    {!active && (
                      <div className="bg-gray-50 rounded-lg px-4 py-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">
                          Variables de entorno requeridas:
                        </p>
                        <div className="space-y-1">
                          {envVars.map((v) => (
                            <code key={v} className="block text-xs font-mono text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded">
                              {v}=<span className="text-gray-400">tu_valor_aquí</span>
                            </code>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Agrega estas variables en el archivo <code className="font-mono">.env</code> del API y reinicia el servidor.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {active
                      ? <CheckCircle2 size={22} className="text-green-500" />
                      : <XCircle size={22} className="text-gray-300" />
                    }
                  </div>
                </div>

                {docsUrl && !active && (
                  <div className="mt-3 pl-14">
                    <a
                      href={docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blood-600 hover:text-blood-700 hover:underline"
                    >
                      Ver documentación →
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

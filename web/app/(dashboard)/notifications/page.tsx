'use client'

import { useState } from 'react'
import { Bell, MessageCircle, Mail, AlertTriangle } from 'lucide-react'

const BLOOD_TYPES = ['O_POSITIVE', 'O_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE']
const BLOOD_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
}

export default function NotificationsPage() {
  const [emergencyBloodType, setEmergencyBloodType] = useState('O_NEGATIVE')
  const [emergencyProduct, setEmergencyProduct] = useState('WHOLE_BLOOD')
  const [emergencyMessage, setEmergencyMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function sendEmergency() {
    setSending(true)
    setResult(null)
    const token = localStorage.getItem('sanguis_token')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/emergency`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodType: emergencyBloodType,
          productType: emergencyProduct,
          message: emergencyMessage,
        }),
      })
      const data = await res.json()
      setResult(`Alerta enviada a ${data.notified} donantes compatibles`)
    } catch {
      setResult('Error al enviar la alerta')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Centro de Notificaciones</h1>
        <p className="text-gray-500 text-sm mt-1">WhatsApp, Email y Push notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Alert */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Alerta de Emergencia</h2>
              <p className="text-sm text-gray-500">Notifica a donantes compatibles por WhatsApp</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sangre</label>
                <select
                  value={emergencyBloodType}
                  onChange={(e) => setEmergencyBloodType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400"
                >
                  {BLOOD_TYPES.map((t) => (
                    <option key={t} value={t}>{BLOOD_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select
                  value={emergencyProduct}
                  onChange={(e) => setEmergencyProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="WHOLE_BLOOD">Sangre Entera</option>
                  <option value="PLATELETS">Plaquetas</option>
                  <option value="PLASMA">Plasma</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Emergencia</label>
              <textarea
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none"
                placeholder="Ej: Escasez crítica de sangre tipo O- en Centro Médico Las Américas. Necesitamos donantes urgentes..."
              />
            </div>

            {result && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                {result}
              </div>
            )}

            <button
              onClick={sendEmergency}
              disabled={!emergencyMessage || sending}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {sending ? 'Enviando...' : 'Enviar Alerta de Emergencia'}
            </button>
          </div>
        </div>

        {/* Channels info */}
        <div className="space-y-4">
          {[
            {
              icon: MessageCircle, color: 'green', title: 'WhatsApp Business',
              desc: 'Notificaciones de eventos, citas, resultados de test y alertas de emergencia via Meta Cloud API.',
            },
            {
              icon: Mail, color: 'blue', title: 'Email (SendGrid)',
              desc: 'Emails de bienvenida, resúmenes mensuales de donación y certificados en PDF.',
            },
            {
              icon: Bell, color: 'purple', title: 'Push (Firebase)',
              desc: 'Notificaciones push en la app móvil para recordatorios y actualizaciones en tiempo real.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
              <div className={`p-2.5 bg-${color}-100 rounded-lg`}>
                <Icon size={20} className={`text-${color}-600`} />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{title}</p>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

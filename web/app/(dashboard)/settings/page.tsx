'use client'

import { Settings, Bell, Shield, Globe, Clock } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Ajustes del sistema Sanguis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[
          { icon: Bell, title: 'Notificaciones', desc: 'WhatsApp, Email y Push — configuración de canales y plantillas' },
          { icon: Shield, title: 'Seguridad', desc: 'Roles, permisos y gestión de usuarios administradores' },
          { icon: Globe, title: 'Operación', desc: 'País, moneda, idioma y configuración regional' },
          { icon: Settings, title: 'Integraciones', desc: 'Meta WhatsApp API, SendGrid, Firebase y Cloudflare R2' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4 opacity-60">
            <div className="p-2.5 bg-gray-100 rounded-lg">
              <Icon size={20} className="text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">{title}</h3>
              <p className="text-sm text-gray-400 mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center text-center">
        <Clock size={36} className="text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-500">Configuración del sistema</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Panel de ajustes en construcción. Próximamente.</p>
      </div>
    </div>
  )
}

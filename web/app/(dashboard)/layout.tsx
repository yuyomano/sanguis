'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAccessToken, hydrateSession, apiLogout } from '@/lib/api'
import {
  LayoutDashboard,
  Users,
  Droplets,
  FlaskConical,
  CalendarDays,
  Truck,
  Gift,
  Bell,
  DollarSign,
  Settings,
  LogOut,
  FileBarChart,
  Siren,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/donors', label: 'Donantes', icon: Users },
  { href: '/inventory', label: 'Inventario', icon: Droplets },
  { href: '/testing', label: 'Laboratorio', icon: FlaskConical },
  { href: '/events', label: 'Eventos', icon: CalendarDays },
  { href: '/emergency', label: 'Emergencias', icon: Siren },
  { href: '/logistics', label: 'Logística', icon: Truck },
  { href: '/rewards', label: 'Socios y Canjes', icon: Gift },
  { href: '/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/finance', label: 'Finanzas', icon: DollarSign },
  { href: '/reports', label: 'Reportes SESPAS', icon: FileBarChart },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  // El layout no se remonta al navegar entre secciones del dashboard, así que
  // esto corre una sola vez por carga de la app — no en cada cambio de ruta
  // (evita golpear /auth/refresh, que está limitado a 10 req/5min).
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (getAccessToken()) {
      setChecking(false)
      return
    }
    hydrateSession().then((ok) => {
      if (!ok) router.replace('/login')
      setChecking(false)
    })
  }, [])

  if (checking) return null

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
          <img src="/logo.png" alt="Sanguis" className="h-9 w-auto shrink-0" />
          <p className="text-xs text-muted-foreground">Panel de administración</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blood-50 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={async () => {
              await apiLogout()
              window.location.href = '/login'
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-alert/5 hover:text-alert transition-colors w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
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
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/donors', label: 'Donantes', icon: Users },
  { href: '/inventory', label: 'Inventario', icon: Droplets },
  { href: '/testing', label: 'Laboratorio', icon: FlaskConical },
  { href: '/events', label: 'Eventos', icon: CalendarDays },
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

  useEffect(() => {
    const token = localStorage.getItem('sanguis_token')
    if (!token) router.replace('/login')
  }, [pathname])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <svg width="26" height="26" viewBox="0 0 34 34" fill="none" aria-hidden="true" className="shrink-0">
            <rect x="1" y="1" width="32" height="32" rx="6" stroke="#8E2436" strokeWidth="1.5" />
            <path d="M17 8c3.5 4.8 6 8.1 6 11a6 6 0 1 1-12 0c0-2.9 2.5-6.2 6-11Z" fill="#8E2436" />
          </svg>
          <div>
            <p className="font-display font-semibold text-foreground leading-none">Sanguis</p>
            <p className="text-xs text-muted-foreground mt-1">Panel de administración</p>
          </div>
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
            onClick={() => {
              localStorage.removeItem('sanguis_token')
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

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-9 h-9 rounded-full bg-blood-500 flex items-center justify-center text-white text-lg">
            🩸
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">Sanguis</p>
            <p className="text-xs text-gray-500">Admin Panel</p>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blood-50 text-blood-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={() => {
              localStorage.removeItem('sanguis_token')
              window.location.href = '/login'
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
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

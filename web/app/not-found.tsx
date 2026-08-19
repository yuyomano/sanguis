import Link from 'next/link'
import { Droplets } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-blood-100 flex items-center justify-center mb-6">
        <Droplets size={32} className="text-blood-500" />
      </div>
      <p className="text-blood-500 text-sm font-semibold uppercase tracking-widest mb-2">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-xs">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/dashboard"
        className="bg-blood-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blood-600 transition-colors"
      >
        Volver al dashboard
      </Link>
    </div>
  )
}

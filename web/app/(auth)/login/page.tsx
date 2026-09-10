'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setError('Credenciales inválidas')
        return
      }

      const { accessToken, refreshToken } = await res.json()
      localStorage.setItem('sanguis_token', accessToken)
      localStorage.setItem('sanguis_refresh', refreshToken)
      router.push('/dashboard')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-[fade-up_0.4s_ease-out]">
        {/* Marca: sin emoji — una marca de unidad de sangre trazada, no decoración */}
        <div className="flex items-center gap-3 mb-10">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="32" height="32" rx="6" stroke="#8E2436" strokeWidth="1.5" />
            <path d="M17 8c3.5 4.8 6 8.1 6 11a6 6 0 1 1-12 0c0-2.9 2.5-6.2 6-11Z" fill="#8E2436" />
          </svg>
          <div>
            <h1 className="font-display text-xl font-semibold leading-none text-foreground">Sanguis</h1>
            <p className="text-xs text-muted-foreground mt-1">Panel de administración</p>
          </div>
        </div>

        <div className="border border-border bg-card rounded-md p-8">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Iniciar sesión</h2>
          <p className="text-sm text-muted-foreground mb-6">Accede con tus credenciales de administrador</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="admin@sanguis.do"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div role="alert" className="border border-alert/30 bg-alert/5 text-alert text-sm px-3.5 py-2.5 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-blood-600 active:scale-[0.99] text-primary-foreground font-medium py-2.5 rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

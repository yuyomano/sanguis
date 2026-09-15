'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setAccessToken } from '@/lib/api'

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
        credentials: 'include', // recibe la cookie httpOnly con el refresh token
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setError('Credenciales inválidas')
        return
      }

      const { accessToken } = await res.json()
      setAccessToken(accessToken) // solo en memoria — nunca en localStorage
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
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Sanguis" className="h-20 w-auto" />
          <p className="text-xs text-muted-foreground mt-1">Panel de administración</p>
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

// Cliente HTTP compartido del panel admin.
//
// El access token vive solo en memoria (nunca en localStorage/sessionStorage) —
// un XSS ya no puede leerlo de un storage persistente. El refresh token es una
// cookie httpOnly (la pone /auth/admin/login) que el navegador nunca expone a
// JS; hydrateSession() la usa para reponer el access token, incluso tras
// recargar la página. apiFetch() es el reemplazo directo del fetch() manual
// que hacía cada página con localStorage.getItem('sanguis_token').
const API_URL = process.env.NEXT_PUBLIC_API_URL

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!res.ok) {
      accessToken = null
      return false
    }
    const data = await res.json()
    accessToken = data.accessToken
    return true
  } catch {
    accessToken = null
    return false
  }
}

// Deduplica refrescos concurrentes: el refresh token rota en cada uso, así que
// dos llamadas simultáneas harían que la segunda invalide la cookie que puso
// la primera. Toda la app comparte esta única promesa en curso.
export function hydrateSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export async function apiLogout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
  } catch {}
  accessToken = null
}

// Reemplazo de fetch(`${api}/...`, { headers: { Authorization } }): adjunta el
// access token en memoria y, si el servidor responde 401 (vida de 15 min),
// refresca una vez con la cookie httpOnly y reintenta la petición original.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const build = (): RequestInit => ({
    ...init,
    credentials: 'include',
    headers: { ...(init.headers || {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  })

  let res = await fetch(`${API_URL}${path}`, build())
  if (res.status === 401) {
    const ok = await hydrateSession()
    if (ok) {
      res = await fetch(`${API_URL}${path}`, build())
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
  return res
}

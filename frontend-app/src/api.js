const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const SESSION_KEY = 'jepret_session'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // penyimpanan browser tidak tersedia
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // penyimpanan browser tidak tersedia
  }
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) }

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const session = getSession()

  if (session?.accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.message || 'Terjadi kesalahan pada server')
    error.status = response.status
    throw error
  }

  return body
}
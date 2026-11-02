const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const SESSION_KEY = 'jepret_session'
const NO_RETRY_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh']

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

let refreshing = null

function refreshSession() {
  const session = getSession()

  if (!session?.refreshToken) return Promise.resolve(false)

  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return false

        const body = await response.json()

        saveSession({ ...session, ...body.session })

        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })
  }

  return refreshing
}

export async function apiFetch(path, options = {}, retried = false) {
  const headers = { ...(options.headers || {}) }
  let attachedToken = false

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  const session = getSession()

  if (session?.accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${session.accessToken}`
    attachedToken = true
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))

  if (
    response.status === 401 &&
    attachedToken &&
    !retried &&
    !NO_RETRY_PATHS.includes(path)
  ) {
    if (await refreshSession()) {
      return apiFetch(path, options, true)
    }
  }

  if (!response.ok) {
    const error = new Error(body.message || 'Terjadi kesalahan pada server')
    error.status = response.status
    throw error
  }

  return body
}
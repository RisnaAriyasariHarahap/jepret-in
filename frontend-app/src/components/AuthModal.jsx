import { useEffect, useState } from 'react'

export default function AuthModal({
  mode,
  onModeChange,
  onClose,
  onLogin,
  onRegister,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isLogin = mode === 'login'

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  function switchMode(nextMode) {
    setError('')
    setInfo('')
    onModeChange(nextMode)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') || '')
    const password = String(data.get('password') || '')

    setLoading(true)
    setError('')
    setInfo('')

    try {
      if (isLogin) {
        await onLogin(email, password)
        onClose()
      } else {
        const result = await onRegister(String(data.get('fullName') || ''), email, password)

        if (result.needsConfirmation) {
          setInfo(result.message)
        } else {
          onClose()
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="camera-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="camera-panel auth-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className="camera-header">
          <span className="section-label">JEPRET.IN ACCOUNT</span>

          <button
            type="button"
            className="camera-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="camera-title">
          <h2 id="auth-title">
            {isLogin ? (
              <>Selamat <span>datang</span> ♡</>
            ) : (
              <>Buat <span>akun</span> ♡</>
            )}
          </h2>

          <p>
            {isLogin
              ? 'Masuk untuk membeli paket Premium dan menyimpan akunmu.'
              : 'Daftar gratis untuk mulai memakai Jepret.in.'}
          </p>
        </div>

        <form className="event-request-form auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="checkout-field">
              <label htmlFor="auth-name">Nama lengkap</label>
              <input
                id="auth-name"
                name="fullName"
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
              />
            </div>
          )}

          <div className="checkout-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="Masukkan email aktif"
              autoComplete="email"
              required
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              placeholder={isLogin ? 'Masukkan password' : 'Minimal 8 karakter'}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={isLogin ? undefined : 8}
              required
            />
          </div>

          {error && <p role="alert" className="auth-message auth-error">{error}</p>}
          {info && <p role="status" className="auth-message">{info}</p>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            type="button"
            className="auth-switch-button"
            onClick={() => switchMode(isLogin ? 'register' : 'login')}
          >
            {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
          </button>
        </p>
      </section>
    </div>
  )
}
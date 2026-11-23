import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Navbar() {
  const { profile, isLoggedIn, openAuth, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className={`navbar ${menuOpen ? 'is-open' : ''}`}>
      <a className="brand" href="/">
        <span className="brand-icon">
          <span className="admin-brand-camera">
            <span className="admin-brand-lens"></span>
          </span>
        </span>
        <span>Jepret<span className="pink">.in</span></span>
      </a>

      <button
        type="button"
        className="nav-toggle"
        aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <div className="nav-links" onClick={closeMenu}>
        <a href="/#home">Home</a>
        <a href="/#cara-kerja">Cara Kerja</a>
        <a href="/#templates">Templates</a>
        <a href="/form-custom-event">Custom Event</a>
        {isAdmin && <a href="/admin">Dashboard Admin</a>}
        {isLoggedIn && !isAdmin && <a href="/event-saya">Event Saya</a>}
        {isLoggedIn && !isAdmin && <a href="/riwayat-transaksi">Riwayat</a>}
        <a href="/#pricing">Pricing</a>
      </div>

      <div className="nav-actions">
        {isLoggedIn ? (
          <button
            type="button"
            className="nav-button"
            onClick={() => {
              closeMenu()
              logout()
            }}
          >
            Keluar
          </button>
        ) : (
          <>
            <button
              type="button"
              className="nav-auth-button"
              onClick={() => {
                closeMenu()
                openAuth('login')
              }}
            >
              Masuk
            </button>

            <button
              type="button"
              className="nav-button"
              onClick={() => {
                closeMenu()
                openAuth('register')
              }}
            >
              Daftar gratis
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
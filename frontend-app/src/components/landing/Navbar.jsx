import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Navbar({ onStart }) {
  const { profile, isLoggedIn, openAuth, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const firstName = profile?.fullName?.split(' ')[0] || 'Kamu'

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
        {isLoggedIn && <a href="/event-saya">Event Saya</a>}
        {isLoggedIn && <a href="/riwayat-transaksi">Riwayat Transaksi</a>}
        <a href="/#pricing">Pricing</a>
      </div>

      <div className="nav-actions">
        {isLoggedIn ? (
          <div className="nav-auth">
            <span>
              Halo, {firstName}
              {profile?.isPremium ? ' ✨' : ''}
            </span>
            <button type="button" className="nav-auth-button" onClick={logout}>
              Keluar
            </button>
          </div>
        ) : (
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
        )}

        <button
          className="nav-button"
          onClick={() => {
            closeMenu()
            onStart()
          }}
        >
          Mulai Jepret ♡
        </button>
      </div>
    </nav>
  )
}
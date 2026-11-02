import { useAuth } from '../../context/AuthContext.jsx'

export default function Navbar({ onStart }) {
  const { profile, isLoggedIn, openAuth, logout } = useAuth()

  const firstName = profile?.fullName?.split(' ')[0] || 'Kamu'

  return (
    <nav className="navbar">
      <a className="brand" href="/">
        <span className="brand-icon">
          <span className="admin-brand-camera">
            <span className="admin-brand-lens"></span>
          </span>
        </span>
        <span>Jepret<span className="pink">.in</span></span>
      </a>

      <div className="nav-links">
        <a href="/#home">Home</a>
        <a href="/#cara-kerja">Cara Kerja</a>
        <a href="/#templates">Templates</a>
        <a href="/form-custom-event">Custom Event</a>
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
            onClick={() => openAuth('login')}
          >
            Masuk
          </button>
        )}

        <button className="nav-button" onClick={onStart}>
          Mulai Jepret ♡
        </button>
      </div>
    </nav>
  )
}
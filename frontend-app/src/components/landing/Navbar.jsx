export default function Navbar({ onStart }) {
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

      <button className="nav-button" onClick={onStart}>
        Mulai Jepret ♡
      </button>
    </nav>
  )
}
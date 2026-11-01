export default function Hero({ onStart, onScrollToTemplates }) {
  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <p className="eyebrow">
          <span className="dot" />
          YOUR LITTLE PHOTO MOMENT
        </p>

        <h1>Jepret<span>.in</span></h1>

        <p className="hero-description">
          Abadikan momen spesialmu dengan berbagai template
          photobooth yang manis. Pilih frame favorit, ambil
          empat foto, dan simpan kenanganmu.
        </p>

        <div className="hero-actions">
          <button className="primary-button" onClick={onStart}>
            Mulai Jepret →
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onScrollToTemplates}
          >
            Lihat Template ↓
          </button>
        </div>

        <div className="social-proof">
          <div className="emoji-stack">
            <span>♡</span>
            <span>✿</span>
            <span>✨</span>
          </div>

          <div>
            <strong>Little moments, lovely memories</strong>
            <p>Abadikan momenmu dengan Jepret.in</p>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-glow" />

        <div className="hero-photo">
          <div className="hero-photo-top">
            <span>JEPRET.IN</span>
            <span>♡</span>
          </div>

          <div className="hero-photo-images">
            <div className="mock-photo mock-pink">♡</div>
            <div className="mock-photo mock-yellow">✿</div>
            <div className="mock-photo mock-purple">✦</div>
          </div>

          <p>our little moments</p>
        </div>

        <div className="floating-note note-top">
          ✨ Capture your memories
        </div>

        <div className="floating-note note-bottom">
          Made with <span>♡</span> love
        </div>

        <span className="decor decor-one">✿</span>
        <span className="decor decor-two">✧</span>
        <span className="decor decor-three">♡</span>
      </div>
    </section>
  )
}
export default function Showcase({ onStart }) {
  return (
    <section className="custom-section">
      <div className="custom-art">
        <div className="custom-art-circle">
          <span className="custom-heart">♡</span>
          <div className="custom-art-note">
            your memories, your way ✨
          </div>
        </div>
      </div>

      <div className="custom-content">
        <span className="section-label">MADE FOR YOUR MOMENTS</span>
        <h2>Every moment is <span>special</span></h2>
        <p>
          Dari senyum kecil sampai momen bersama teman,
          simpan semuanya dalam photostrip buatanmu sendiri.
        </p>

        <button className="primary-button" onClick={onStart}>
          Abadikan Momennya ♡
        </button>
      </div>
    </section>
  )
}
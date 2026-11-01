export default function HowItWorks() {
  return (
    <section className="info-section" id="cara-kerja">
      <div className="section-heading">
        <span className="section-label">SIMPLE & FUN</span>
        <h2>Three steps to <span>memories</span></h2>
        <p>
          Membuat photostrip sendiri itu mudah. Ikuti tiga
          langkah sederhana untuk membawa pulang kenanganmu.
        </p>
      </div>

      <div className="steps">
        <article className="step-card">
          <span className="step-number">STEP 01</span>
          <div className="step-icon">♡</div>
          <h3>Pilih Template</h3>
          <p>Pilih desain photostrip yang kamu suka.</p>
        </article>

        <article className="step-card">
          <span className="step-number">STEP 02</span>
          <div className="step-icon">◎</div>
          <h3>Ambil Empat Foto</h3>
          <p>Setiap foto menggunakan hitung mundur tiga detik.</p>
        </article>

        <article className="step-card">
          <span className="step-number">STEP 03</span>
          <div className="step-icon">↓</div>
          <h3>Unduh Photostrip</h3>
          <p>Simpan hasil foto dalam format PNG.</p>
        </article>
      </div>
    </section>
  )
}
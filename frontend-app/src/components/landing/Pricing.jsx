import { useState } from 'react'

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [showPaymentStep, setShowPaymentStep] = useState(false)

  function chooseShortcut(plan) {
    setSelectedPlan(plan)
    setCheckoutMessage('')
    document.getElementById('checkout')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  function closeCheckout() {
    setSelectedPlan(null)
    setCheckoutMessage('')
    setShowPaymentStep(false)
  }

  return (
    <section id="pricing" className="pricing-section">
      <div className="section-heading">
        <span className="section-label">SIMPLE PRICING</span>
        <h2>Choose Your <span>Plan</span> ✨</h2>
      </div>

      <div className="pricing-grid">
        <article className="pricing-card">
          <h3>Basic</h3>
          <p className="price">Rp9.900</p>
          <p>✓ Semua fitur Free</p>
          <p>✓ Pilihan frame eksklusif</p>
          <p>✓ Variasi photostrip tambahan</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => chooseShortcut({ name: 'Basic', price: 9900 })}
          >
            Pilih Basic
          </button>
        </article>

        <article className="pricing-card">
          <h3>Premium</h3>
          <p className="price">Rp19.900</p>
          <p>✓ Semua fitur Basic</p>
          <p>✓ Tema premium</p>
          <p>✓ Kustomisasi photostrip</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => chooseShortcut({ name: 'Premium', price: 19900 })}
          >
            Pilih Premium
          </button>
        </article>

        <article className="pricing-card">
          <h3>Custom Event</h3>
          <p className="price">Sesuai kebutuhan</p>
          <p>✓ Request tema acara</p>
          <p>✓ Konsep desain personal</p>
          <p>✓ Untuk acara spesial</p>

          <a href="/form-custom-event" className="primary-button pricing-link">
            Request Custom
          </a>
        </article>
      </div>

      <p className="pricing-note">
        Harga layanan custom dikonfirmasi sesuai kebutuhan acara.
      </p>

      {selectedPlan && (
        <section id="checkout" className="checkout-screen">
          <div className="custom-content checkout-layout">
            <button
              type="button"
              className="checkout-close-button"
              aria-label="Tutup checkout"
              onClick={closeCheckout}
            >
              ×
            </button>

            <div className="checkout-heading">
              <span className="section-label">CHECKOUT</span>
              <h2>Selesaikan <span>Pesananmu</span></h2>
              <p>Periksa detail pesanan sebelum melanjutkan.</p>
            </div>

            <div className="checkout-columns">
              {/* KOLOM KIRI: DATA PEMESAN */}
              <div className="checkout-left">
                <h3 className="checkout-subtitle">Data Pemesan</h3>

                <form
                  id="checkout-form"
                  className="event-request-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setCheckoutMessage('')
                    setShowPaymentStep(true)
                  }}
                >
                  <div className="checkout-field">
                    <label htmlFor="checkout-name">Nama lengkap</label>
                    <input
                      id="checkout-name"
                      name="name"
                      placeholder="Masukkan nama lengkap"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label htmlFor="checkout-email">Email</label>
                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      placeholder="Masukkan email aktif"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button type="submit" className="primary-button">
                    Lanjut ke Pembayaran
                  </button>
                </form>

                {checkoutMessage && (
                  <p role="status">{checkoutMessage}</p>
                )}
              </div>

              {/* KOLOM KANAN: RINGKASAN DAN PEMBAYARAN */}
              <div className="checkout-right">
                <h3 className="checkout-subtitle">Ringkasan Pesanan</h3>

                <div className="pricing-card">
                  <h3>{selectedPlan.name}</h3>
                  <p className="price">
                    Rp{selectedPlan.price.toLocaleString('id-ID')}
                  </p>
                  <p>Photobooth digital Jepret.in</p>
                  <div className="checkout-total">
                    <span>Total pembayaran</span>
                    <strong>
                      Rp{selectedPlan.price.toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                {showPaymentStep && (
                  <div className="checkout-payment" aria-live="polite">
                    <h3>Pembayaran QRIS</h3>

                    <div className="checkout-qr-placeholder">
                      <span className="checkout-qr-icon">
                        <icon name="qr-code" size="3xl" />
                      </span>
                      <p>QRIS akan ditampilkan di sini</p>
                      <small>
                        Integrasi pembayaran belum tersedia.
                        Belum ada transaksi yang dilakukan.
                      </small>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="primary-button checkout-back-button"
                  onClick={() => {
                    closeCheckout()

                    requestAnimationFrame(() => {
                      document.getElementById('pricing')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    })
                  }}
                >
                  Kembali ke Paket
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </section>
  )
}
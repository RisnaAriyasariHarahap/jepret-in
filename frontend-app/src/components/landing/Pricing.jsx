import { useEffect, useState } from 'react'
import { apiFetch } from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { payWithSnap } from '../../utils/midtrans.js'

const premiumFeatures = [
  'Semua fitur Free',
  'Template premium bermotif & penuh stiker',
  'Filter wajah (kacamata, bando, telinga, dll)',
]

function formatPrice(price) {
  return `Rp${Number(price).toLocaleString('id-ID')}`
}

export default function Pricing() {
  const { profile, isLoggedIn, openAuth, updateProfile } = useAuth()
  const [plans, setPlans] = useState([])
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadPlans() {
      try {
        const result = await apiFetch('/api/plans')

        if (!cancelled && Array.isArray(result.data)) {
          setPlans(result.data)
        }
      } catch {
        // harga bawaan tetap ditampilkan jika backend belum aktif
      }
    }

    loadPlans()

    return () => {
      cancelled = true
    }
  }, [])

  const premiumPlan = plans.find((plan) => plan.id === 'premium')

  const premiumPrice = premiumPlan?.price ?? 19900
  const premiumDays = premiumPlan?.durationDays ?? 30

  async function checkStatus(orderId) {
    const result = await apiFetch(`/api/transactions/${orderId}/sync`, {
      method: 'POST',
    })

    updateProfile(result.data.profile)

    return result.data.status
  }

  async function handleBuyPremium() {
    setMessage('')

    if (!isLoggedIn) {
      openAuth('login')
      return
    }

    setPaying(true)

    try {
      const created = await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ planId: 'premium' }),
      })

      const { orderId, token, snapJsUrl, clientKey } = created.data

      await payWithSnap({ token, snapJsUrl, clientKey })

      const status = await checkStatus(orderId)

      if (status === 'settlement') {
        setMessage('Pembayaran berhasil! Akun kamu sekarang Premium. ✨')
      } else if (status === 'pending') {
        setMessage(
          'Pembayaran belum selesai. Selesaikan pembayaran, lalu klik tombol Premium lagi untuk memeriksa status.'
        )
      } else {
        setMessage('Pembayaran tidak berhasil atau dibatalkan. Silakan coba lagi.')
      }
    } catch (error) {
      setMessage(error.message || 'Terjadi kesalahan saat memproses pembayaran.')
    } finally {
      setPaying(false)
    }
  }

  const premiumUntil = profile?.premiumUntil
    ? new Date(profile.premiumUntil).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <section id="pricing" className="pricing-section">
      <div className="section-heading">
        <span className="section-label">SIMPLE PRICING</span>
        <h2>Choose Your <span>Plan</span> ✨</h2>
      </div>

      <div className="pricing-grid">
        <article className="pricing-card">
          <h3>Free</h3>
          <p className="price">Rp0</p>
          <p>✓ Photo booth berbasis web</p>
          <p>✓ Template dasar</p>
          <p>✓ Download hasil foto</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Coba Gratis
          </button>
        </article>

        <article className="pricing-card">
          <h3>Premium</h3>
          <p className="price">{formatPrice(premiumPrice)}</p>
          <p>{premiumDays} hari akses</p>
          {premiumFeatures.map((feature) => (
            <p key={feature}>✓ {feature}</p>
          ))}

          {profile?.isPremium ? (
            <p className="premium-active">Premium aktif sampai {premiumUntil}</p>
          ) : null}

          <button
            type="button"
            className="primary-button"
            disabled={paying}
            onClick={handleBuyPremium}
          >
            {paying
              ? 'Memproses...'
              : profile?.isPremium
                ? 'Perpanjang Premium'
                : 'Pilih Premium'}
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

      {message && (
        <p className="pricing-note premium-message" role="status">
          {message}
        </p>
      )}

      <p className="pricing-note">
        Harga layanan custom dikonfirmasi sesuai kebutuhan acara.
      </p>
    </section>
  )
}
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { formatDateTime, formatRupiah } from '../utils/eventPricing.js'

const statusInfo = {
  pending: { label: 'Menunggu pembayaran', className: 'is-pending' },
  settlement: { label: 'Berhasil', className: 'is-paid' },
  failed: { label: 'Gagal', className: 'is-rejected' },
  cancelled: { label: 'Dibatalkan', className: 'is-muted' },
  expired: { label: 'Kedaluwarsa', className: 'is-muted' },
}

const paymentLabels = {
  bank_transfer: 'Transfer bank',
  echannel: 'Mandiri Bill',
  qris: 'QRIS',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  credit_card: 'Kartu kredit',
  cstore: 'Minimarket',
}

function paymentLabel(type) {
  if (!type) return null

  return paymentLabels[type] ?? type.replace(/_/g, ' ')
}

export default function TransactionHistoryPage() {
  const { isLoggedIn, openAuth, updateProfile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingId, setCheckingId] = useState('')
  const [message, setMessage] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiFetch('/api/transactions/me')

      setItems(result.data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat riwayat transaksi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) loadHistory()
  }, [isLoggedIn, loadHistory])

  async function handleCheck(item) {
    setMessage('')
    setCheckingId(item.orderId)

    try {
      const synced = await apiFetch(`/api/transactions/${item.orderId}/sync`, {
        method: 'POST',
      })

      if (synced.data.profile) updateProfile(synced.data.profile)

      setMessage(
        synced.data.status === 'settlement'
          ? 'Pembayaran sudah diterima. Terima kasih!'
          : 'Status pembayaran diperbarui.'
      )

      await loadHistory()
    } catch (err) {
      setMessage(err.message || 'Gagal memeriksa status pembayaran')
    } finally {
      setCheckingId('')
    }
  }

  return (
    <main className="website">
      <Navbar
        onStart={() => {
          window.location.href = '/#templates'
        }}
      />

      <section className="my-events">
        <span className="section-label">RIWAYAT</span>
        <h2>Riwayat <span>transaksi</span> kamu</h2>

        {!isLoggedIn ? (
          <div className="my-events-empty">
            <p>Masuk dulu untuk melihat riwayat pembayaranmu.</p>
            <button type="button" className="pricing-button" onClick={() => openAuth('login')}>
              Masuk
            </button>
          </div>
        ) : loading && items.length === 0 ? (
          <p className="my-events-note">Memuat riwayat transaksi...</p>
        ) : error ? (
          <p className="my-events-note is-error">{error}</p>
        ) : items.length === 0 ? (
          <div className="my-events-empty">
            <p>Belum ada transaksi.</p>
            <a className="pricing-button" href="/#pricing">Lihat paket</a>
          </div>
        ) : (
          <div className="my-events-list">
            {message && <p className="my-events-message" role="status">{message}</p>}

            {items.map((item) => {
              const info = statusInfo[item.status] ?? statusInfo.pending
              const method = paymentLabel(item.paymentType)

              return (
                <article key={item.orderId} className="my-event-card">
                  <div className="my-event-head">
                    <h3>{item.title}</h3>
                    <span className={`my-event-status ${info.className}`}>{info.label}</span>
                  </div>

                  <p className="my-event-line">
                    Total: <strong>{formatRupiah(item.amount)}</strong>
                    {method && <> · {method}</>}
                  </p>

                  <p className="my-event-line">
                    Dibuat: {formatDateTime(new Date(item.createdAt))}
                    {item.paidAt && <> · Dibayar: {formatDateTime(new Date(item.paidAt))}</>}
                  </p>

                  <p className="my-event-line tx-order-id">No. pesanan: {item.orderId}</p>

                  {item.status === 'pending' && (
                    <button
                      type="button"
                      className="pricing-button"
                      onClick={() => handleCheck(item)}
                      disabled={checkingId === item.orderId}
                    >
                      {checkingId === item.orderId ? 'Memeriksa...' : 'Periksa status'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
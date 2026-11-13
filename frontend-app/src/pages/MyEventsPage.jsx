import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { payWithSnap } from '../utils/midtrans.js'
import { formatDateTime, formatRupiah } from '../utils/eventPricing.js'

const unitLabels = { hour: 'jam', day: 'hari', week: 'minggu', month: 'bulan' }

const statusInfo = {
  pending: { label: 'Menunggu persetujuan', className: 'is-pending' },
  approved: { label: 'Disetujui, menunggu pembayaran', className: 'is-approved' },
  rejected: { label: 'Ditolak', className: 'is-rejected' },
  paid: { label: 'Sudah dibayar', className: 'is-paid' },
}

export default function MyEventsPage() {
  const { isLoggedIn, openAuth } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payingId, setPayingId] = useState('')
  const [message, setMessage] = useState('')

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiFetch('/api/custom-events/me')

      setEvents(result.data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat event kamu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) loadEvents()
  }, [isLoggedIn, loadEvents])

  async function handlePay(item) {
    setMessage('')
    setPayingId(item.id)

    try {
      const created = await apiFetch('/api/transactions/event', {
        method: 'POST',
        body: JSON.stringify({ customEventId: item.id }),
      })

      const { orderId, token, snapJsUrl, clientKey } = created.data

      await payWithSnap({ token, snapJsUrl, clientKey })

      const synced = await apiFetch(`/api/transactions/${orderId}/sync`, {
        method: 'POST',
      })

      if (synced.data.status === 'settlement') {
        setMessage('Pembayaran berhasil! Admin akan menyiapkan template eventmu.')
      } else if (synced.data.status === 'pending') {
        setMessage('Pembayaran belum selesai. Selesaikan pembayaran, lalu klik Bayar lagi untuk memeriksa status.')
      } else {
        setMessage('Pembayaran tidak berhasil atau dibatalkan. Silakan coba lagi.')
      }

      await loadEvents()
    } catch (err) {
      setMessage(err.message || 'Gagal memulai pembayaran')
    } finally {
      setPayingId('')
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
        <span className="section-label">EVENT SAYA</span>
        <h2>Permintaan <span>custom event</span> kamu</h2>

        {!isLoggedIn ? (
          <div className="my-events-empty">
            <p>Masuk dulu untuk melihat permintaan event dan status pembayaranmu.</p>
            <button type="button" className="pricing-button" onClick={() => openAuth('login')}>
              Masuk
            </button>
          </div>
        ) : loading && events.length === 0 ? (
          <p className="my-events-note">Memuat event kamu...</p>
        ) : error ? (
          <p className="my-events-note is-error">{error}</p>
        ) : events.length === 0 ? (
          <div className="my-events-empty">
            <p>Kamu belum mengajukan custom event.</p>
            <a className="pricing-button" href="/form-custom-event">Ajukan sekarang</a>
          </div>
        ) : (
          <div className="my-events-list">
            {message && <p className="my-events-message" role="status">{message}</p>}

            {events.map((item) => {
              const info = statusInfo[item.status] ?? statusInfo.pending
              const price = item.finalPrice ?? item.quotedPrice
              const expired = item.endsAt && new Date(item.endsAt) <= new Date()
              const canPay = item.status === 'approved' && item.finalPrice > 0 && !expired

              return (
                <article key={item.id} className="my-event-card">
                  <div className="my-event-head">
                    <h3>{item.eventName}</h3>
                    <span className={`my-event-status ${info.className}`}>{info.label}</span>
                  </div>

                  {item.startsAt && (
                    <p className="my-event-line">
                      Aktif: {formatDateTime(new Date(item.startsAt))} sampai{' '}
                      {formatDateTime(new Date(item.endsAt))} ({item.durationValue}{' '}
                      {unitLabels[item.durationUnit] ?? ''})
                    </p>
                  )}

                  {price != null && (
                    <p className="my-event-line">
                      {item.finalPrice != null ? 'Harga' : 'Estimasi harga'}:{' '}
                      <strong>{formatRupiah(price)}</strong>
                    </p>
                  )}

                  {item.adminNotes && (
                    <p className="my-event-line">Catatan admin: {item.adminNotes}</p>
                  )}

                  {item.status === 'approved' && expired && (
                    <p className="my-event-line">Periode event ini sudah berakhir, hubungi admin untuk penjadwalan ulang.</p>
                  )}

                  {item.status === 'paid' && (
                    <p className="my-event-line">
                      Terima kasih! Template eventmu akan muncul di halaman Templates setelah admin selesai menyiapkannya.
                    </p>
                  )}

                  {canPay && (
                    <button
                      type="button"
                      className="pricing-button"
                      onClick={() => handlePay(item)}
                      disabled={payingId === item.id}
                    >
                      {payingId === item.id ? 'Memproses...' : `Bayar ${formatRupiah(item.finalPrice)}`}
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
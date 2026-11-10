import { useEffect, useState } from 'react'
import { apiFetch } from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  computeEndsAt,
  formatDateTime,
  formatRupiah,
  toLocalInputValue,
} from '../../utils/eventPricing.js'

export default function CustomEventForm() {
  const { profile, isLoggedIn, openAuth } = useAuth()

  const [requestSent, setRequestSent] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState('')

  const [rates, setRates] = useState([])
  const [ratesError, setRatesError] = useState(false)
  const [durationUnit, setDurationUnit] = useState('day')
  const [durationValue, setDurationValue] = useState('1')
  const [startsAt, setStartsAt] = useState('')

  // Mengambil tarif sewa dari backend
  useEffect(() => {
    let cancelled = false

    async function loadRates() {
      try {
        const result = await apiFetch('/api/event-rates')

        if (!cancelled) setRates(result.data)
      } catch {
        if (!cancelled) setRatesError(true)
      }
    }

    loadRates()

    return () => {
      cancelled = true
    }
  }, [])

  const rate = rates.find((item) => item.unit === durationUnit)
  const amount = Number(durationValue)

  const validDuration =
    rate &&
    Number.isInteger(amount) &&
    amount >= rate.minValue &&
    amount <= rate.maxValue

  const estimatedPrice = validDuration ? rate.price * amount : null

  const estimatedEnd =
    validDuration && startsAt
      ? computeEndsAt(new Date(startsAt), durationUnit, amount)
      : null

  async function handleEventRequest(event) {
    event.preventDefault()

    if (!isLoggedIn) {
      openAuth('login')
      return
    }

    const form = event.currentTarget
    const data = new FormData(form)

    setRequestLoading(true)
    setRequestError('')
    setRequestSent(false)

    try {
      await apiFetch('/api/custom-events', {
        method: 'POST',
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          eventName: data.get('eventName'),
          eventType: data.get('eventType'),
          eventDate: data.get('eventDate'),
          location: data.get('location'),
          guestCount: data.get('guestCount'),
          themeNotes: data.get('themeNotes'),
          startsAt: new Date(startsAt).toISOString(),
          durationUnit,
          durationValue: amount,
        }),
      })

      setRequestSent(true)
      form.reset()
      setStartsAt('')
      setDurationValue('1')
    } catch (error) {
      setRequestError(error.message)
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <section id="custom" className="custom-section">
      <div className="custom-content">
        <span className="section-label">CUSTOM PHOTOBOOTH</span>
        <h2>Make your event <span>special</span> ♡</h2>
        <p>Buat photobooth khusus untuk acara spesialmu!</p>

        {!isLoggedIn && (
          <div className="event-login-notice">
            <p>
              Masuk dulu agar permintaanmu tercatat dan template event bisa kamu
              akses setelah disetujui.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => openAuth('login')}
            >
              Masuk untuk mengajukan
            </button>
          </div>
        )}

        <form
          key={profile?.id ?? 'guest'}
          className="event-request-form"
          onSubmit={handleEventRequest}
        >
          <div className="checkout-field">
            <label htmlFor="event-contact-name">Nama lengkap</label>
            <input id="event-contact-name" name="name" defaultValue={profile?.fullName ?? ''} placeholder="Masukkan nama lengkap" autoComplete="name" maxLength={100} required />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-contact-email">Email</label>
            <input id="event-contact-email" name="email" type="email" defaultValue={profile?.email ?? ''} placeholder="Masukkan email aktif" autoComplete="email" maxLength={150} required />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-contact-phone">Nomor WhatsApp (opsional)</label>
            <input id="event-contact-phone" name="phone" type="tel" placeholder="Contoh: 081234567890" autoComplete="tel" maxLength={30} />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-title">Nama acara</label>
            <input id="event-title" name="eventName" placeholder="Contoh: Wisuda Teknik 2026" maxLength={150} required />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-type">Jenis acara</label>
            <select id="event-type" name="eventType" defaultValue="" required>
              <option value="" disabled>Pilih jenis acara</option>
              <option value="birthday">Ulang tahun</option>
              <option value="graduation">Wisuda</option>
              <option value="wedding">Pernikahan</option>
              <option value="gathering">Gathering</option>
              <option value="campus">Acara kampus</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <div className="checkout-field">
            <label htmlFor="event-date">Tanggal acara (opsional)</label>
            <input id="event-date" name="eventDate" type="date" min={new Date().toISOString().slice(0, 10)} />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-location">Lokasi (opsional)</label>
            <input id="event-location" name="location" placeholder="Contoh: Makassar" maxLength={200} />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-guests">Perkiraan jumlah tamu (opsional)</label>
            <input id="event-guests" name="guestCount" type="number" min="1" max="100000" placeholder="Contoh: 100" />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-starts-at">Photobooth mulai dipakai</label>
            <input
              id="event-starts-at"
              type="datetime-local"
              value={startsAt}
              min={toLocalInputValue(new Date())}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-duration">Lama pemakaian</label>
            <div className="duration-row">
              <input
                id="event-duration"
                type="number"
                min={rate?.minValue ?? 1}
                max={rate?.maxValue ?? 72}
                value={durationValue}
                onChange={(event) => setDurationValue(event.target.value)}
                required
              />

              <select
                aria-label="Satuan durasi"
                value={durationUnit}
                onChange={(event) => setDurationUnit(event.target.value)}
              >
                {(rates.length > 0
                  ? rates
                  : [{ unit: 'day', label: 'Hari' }]
                ).map((item) => (
                  <option key={item.unit} value={item.unit}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="event-estimate" aria-live="polite">
            {ratesError && <p>Tarif belum dapat dimuat. Coba muat ulang halaman.</p>}

            {!ratesError && rate && (
              <p className="event-estimate-rate">
                Tarif: {formatRupiah(rate.price)} per {rate.label.toLowerCase()}
                {' '}(maks. {rate.maxValue} {rate.label.toLowerCase()})
              </p>
            )}

            {rate && !validDuration && (
              <p>
                Isi durasi antara {rate.minValue} dan {rate.maxValue} {rate.label.toLowerCase()}.
              </p>
            )}

            {estimatedPrice !== null && (
              <>
                <p className="event-estimate-total">
                  Estimasi biaya: <strong>{formatRupiah(estimatedPrice)}</strong>
                </p>
                {estimatedEnd && (
                  <p>Template aktif sampai {formatDateTime(estimatedEnd)}</p>
                )}
                <small>Harga final dikonfirmasi admin saat permintaan disetujui.</small>
              </>
            )}
          </div>

          <div className="checkout-field">
            <label htmlFor="event-notes">Tema dan kebutuhan desain (opsional)</label>
            <textarea id="event-notes" name="themeNotes" rows="3" maxLength={1000} placeholder="Ceritakan warna, tema, atau ide desain photobooth yang kamu mau" />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={requestLoading || ratesError || !validDuration}
          >
            {requestLoading ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>
        </form>

        {requestSent && (
          <p role="status">
            Permintaan berhasil dikirim! Tim Jepret.in akan menghubungi lewat email. ♡
          </p>
        )}

        {requestError && (
          <p role="status">{requestError}</p>
        )}
      </div>
    </section>
  )
}
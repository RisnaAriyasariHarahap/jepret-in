import { useState } from 'react'
import { apiFetch } from '../../api.js'

export default function CustomEventForm() {
  const [requestSent, setRequestSent] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState('')

  async function handleEventRequest(event) {
    event.preventDefault()

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
        }),
      })

      setRequestSent(true)
      form.reset()
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

        <form className="event-request-form" onSubmit={handleEventRequest}>
          <div className="checkout-field">
            <label htmlFor="event-contact-name">Nama lengkap</label>
            <input id="event-contact-name" name="name" placeholder="Masukkan nama lengkap" autoComplete="name" maxLength={100} required />
          </div>

          <div className="checkout-field">
            <label htmlFor="event-contact-email">Email</label>
            <input id="event-contact-email" name="email" type="email" placeholder="Masukkan email aktif" autoComplete="email" maxLength={150} required />
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
            <label htmlFor="event-notes">Tema dan kebutuhan desain (opsional)</label>
            <textarea id="event-notes" name="themeNotes" rows="3" maxLength={1000} placeholder="Ceritakan warna, tema, atau ide desain photobooth yang kamu mau" />
          </div>

          <button type="submit" className="primary-button" disabled={requestLoading}>
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
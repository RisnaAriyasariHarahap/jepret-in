import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { optionalAuth } from '../middleware/auth.js'
import { EVENT_TYPES } from '../utils/customEvent.js'

const router = Router()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

router.post('/', optionalAuth, async (req, res) => {
  const body = req.body || {}

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const phone = String(body.phone ?? '').trim()
  const eventName = String(body.eventName ?? '').trim()
  const eventType = String(body.eventType ?? '').trim()
  const eventDate = String(body.eventDate ?? '').trim()
  const location = String(body.location ?? '').trim()
  const themeNotes = String(body.themeNotes ?? '').trim()
  const guestCountRaw = String(body.guestCount ?? '').trim()

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Nama lengkap harus 2 sampai 100 karakter' })
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 150) {
    return res.status(400).json({ message: 'Format email tidak valid' })
  }

  if (phone.length > 30) {
    return res.status(400).json({ message: 'Nomor telepon maksimal 30 karakter' })
  }

  if (eventName.length < 2 || eventName.length > 150) {
    return res.status(400).json({ message: 'Nama acara harus 2 sampai 150 karakter' })
  }

  if (!EVENT_TYPES.includes(eventType)) {
    return res.status(400).json({ message: 'Jenis acara tidak valid' })
  }

  if (location.length > 200) {
    return res.status(400).json({ message: 'Lokasi maksimal 200 karakter' })
  }

  if (themeNotes.length > 1000) {
    return res.status(400).json({ message: 'Catatan tema maksimal 1000 karakter' })
  }

  let eventDateValue = null

  if (eventDate) {
    if (!DATE_PATTERN.test(eventDate) || Number.isNaN(Date.parse(eventDate))) {
      return res.status(400).json({ message: 'Format tanggal acara tidak valid' })
    }

    eventDateValue = eventDate
  }

  let guestCount = null

  if (guestCountRaw) {
    guestCount = Number(guestCountRaw)

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 100000) {
      return res.status(400).json({ message: 'Jumlah tamu tidak valid' })
    }
  }

  const { data, error } = await supabase
    .from('custom_events')
    .insert({
      user_id: req.user?.id ?? null,
      name,
      email,
      phone: phone || null,
      event_name: eventName,
      event_type: eventType,
      event_date: eventDateValue,
      location: location || null,
      guest_count: guestCount,
      theme_notes: themeNotes || null,
    })
    .select('id, status')
    .single()

  if (error) throw error

  return res.status(201).json({
    message: 'Permintaan berhasil dikirim',
    data: { id: data.id, status: data.status },
  })
})

export default router
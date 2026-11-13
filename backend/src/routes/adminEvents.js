import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { EVENT_STATUSES, toCustomEvent } from '../utils/customEvent.js'
import { calculateQuote, getRates } from '../utils/pricing.js'

const router = Router()

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_PRICE = 100000000

// Semua endpoint di file ini khusus admin
router.use(requireAuth, requireAdmin)

router.get('/', async (req, res) => {
  const status = String(req.query.status ?? '').trim()
  const search = String(req.query.search ?? '').trim()

  let query = supabase
    .from('custom_events')
    .select('*')
    .order('created_at', { ascending: false })

  if ([...EVENT_STATUSES, 'paid'].includes(status)) {
    query = query.eq('status', status)
  }

  if (search) {
    const safe = search.replace(/[%,()*]/g, ' ').slice(0, 100)

    query = query.or(
      `name.ilike.%${safe}%,event_name.ilike.%${safe}%,email.ilike.%${safe}%`
    )
  }

  const { data, error } = await query

  if (error) throw error

  res.json({ data: data.map(toCustomEvent) })
})

router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const body = req.body || {}

  if (!UUID_PATTERN.test(id)) {
    return res.status(404).json({ message: 'Permintaan tidak ditemukan' })
  }

  const { data: current, error: findError } = await supabase
    .from('custom_events')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (findError) throw findError

  if (!current) {
    return res.status(404).json({ message: 'Permintaan tidak ditemukan' })
  }

  if (current.status === 'paid') {
    return res.status(409).json({ message: 'Event yang sudah dibayar tidak bisa diubah' })
  }

  const updates = {}

  if (body.status !== undefined) {
    if (!EVENT_STATUSES.includes(body.status)) {
      return res.status(400).json({ message: 'Status tidak valid' })
    }

    updates.status = body.status
  }

  if (body.adminNotes !== undefined) {
    const notes = String(body.adminNotes ?? '').trim()

    if (notes.length > 1000) {
      return res.status(400).json({ message: 'Catatan admin maksimal 1000 karakter' })
    }

    updates.admin_notes = notes || null
  }

  if (body.finalPrice !== undefined && body.finalPrice !== null && body.finalPrice !== '') {
    const price = Number(body.finalPrice)

    if (!Number.isInteger(price) || price < 0 || price > MAX_PRICE) {
      return res.status(400).json({ message: 'Harga final tidak valid' })
    }

    updates.final_price = price
  }

  // Periode boleh disesuaikan admin (ketiga field harus dikirim bersamaan)
  if (body.startsAt !== undefined || body.durationUnit !== undefined || body.durationValue !== undefined) {
    const quote = calculateQuote(await getRates(), {
      startsAt: body.startsAt,
      unit: String(body.durationUnit ?? '').trim(),
      value: body.durationValue,
    })

    if (quote.error) {
      return res.status(400).json({ message: quote.error })
    }

    updates.starts_at = new Date(body.startsAt).toISOString()
    updates.duration_unit = String(body.durationUnit).trim()
    updates.duration_value = Number(body.durationValue)
    updates.ends_at = quote.endsAt.toISOString()
  }

  if (updates.status === 'approved') {
    const finalPrice = updates.final_price ?? current.final_price ?? current.quoted_price

    if (finalPrice === null || finalPrice === undefined) {
      return res.status(400).json({ message: 'Harga final wajib diisi untuk menyetujui permintaan' })
    }

    if (!(updates.starts_at ?? current.starts_at)) {
      return res.status(400).json({ message: 'Periode pemakaian belum diisi' })
    }

    updates.final_price = finalPrice
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Tidak ada perubahan yang dikirim' })
  }

  const { data, error } = await supabase
    .from('custom_events')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  res.json({ message: 'Permintaan diperbarui', data: toCustomEvent(data) })
})

export default router
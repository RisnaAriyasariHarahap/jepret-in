import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { EVENT_STATUSES, toCustomEvent } from '../utils/customEvent.js'
import { calculateQuote, getRates } from '../utils/pricing.js'
import { toTemplate } from '../utils/template.js'
import { sanitizeTemplateInput } from '../utils/templateConfig.js'

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

router.get('/:id/template', async (req, res) => {
  const { id } = req.params

  if (!UUID_PATTERN.test(id)) {
    return res.status(404).json({ message: 'Permintaan tidak ditemukan' })
  }

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('custom_event_id', id)
    .maybeSingle()

  if (error) throw error

  res.json({ data: data ? toTemplate(data) : null })
})

router.put('/:id/template', async (req, res) => {
  const { id } = req.params

  if (!UUID_PATTERN.test(id)) {
    return res.status(404).json({ message: 'Permintaan tidak ditemukan' })
  }

  const { data: event, error: eventError } = await supabase
    .from('custom_events')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (eventError) throw eventError

  if (!event) {
    return res.status(404).json({ message: 'Permintaan tidak ditemukan' })
  }

  if (event.status !== 'paid') {
    return res.status(400).json({ message: 'Template hanya bisa dibuat untuk event yang sudah dibayar' })
  }

  if (!event.user_id) {
    return res.status(400).json({ message: 'Event ini tidak punya akun pemilik (diajukan sebelum wajib login)' })
  }

  if (!event.starts_at || !event.ends_at) {
    return res.status(400).json({ message: 'Periode event belum lengkap' })
  }

  const input = sanitizeTemplateInput(req.body)

  if (input.error) {
    return res.status(400).json({ message: input.error })
  }

  const fields = {
    ...input.value,
    description: `Template khusus ${event.event_name}`,
    category: 'Custom Event',
    is_premium: false,
    is_active: true,
    owner_id: event.user_id,
    custom_event_id: event.id,
    active_from: event.starts_at,
    active_until: event.ends_at,
  }

  const { data: existing, error: existingError } = await supabase
    .from('templates')
    .select('id')
    .eq('custom_event_id', id)
    .maybeSingle()

  if (existingError) throw existingError

  const query = existing
    ? supabase.from('templates').update(fields).eq('id', existing.id)
    : supabase.from('templates').insert({ slug: `event-${id.slice(0, 8)}`, ...fields })

  const { data, error } = await query.select('*').single()

  if (error) throw error

  res.json({ message: 'Template event disimpan', data: toTemplate(data) })
})

export default router
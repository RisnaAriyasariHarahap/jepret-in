import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { EVENT_STATUSES, toCustomEvent } from '../utils/customEvent.js'
import { toProfile } from '../utils/profile.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/me', (req, res) => {
  res.json({ profile: toProfile(req.profile) })
})

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

router.get('/custom-events', async (req, res) => {
  const status = String(req.query.status || '')
  const search = String(req.query.search || '').replace(/[%,()*\\]/g, ' ').trim()

  let query = supabase
    .from('custom_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (EVENT_STATUSES.includes(status)) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,event_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  res.json({ data: data.map(toCustomEvent) })
})

router.patch('/custom-events/:id', async (req, res) => {
  const { id } = req.params

  if (!UUID_PATTERN.test(id)) {
    return res.status(400).json({ message: 'ID permintaan tidak valid' })
  }

  const body = req.body || {}
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

  if (body.quotedPrice !== undefined) {
    if (body.quotedPrice === null || body.quotedPrice === '') {
      updates.quoted_price = null
    } else {
      const price = Number(body.quotedPrice)

      if (!Number.isInteger(price) || price < 0) {
        return res.status(400).json({ message: 'Harga penawaran tidak valid' })
      }

      updates.quoted_price = price
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Tidak ada data yang diubah' })
  }

  const { data, error } = await supabase
    .from('custom_events')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return res.status(404).json({ message: 'Permintaan tidak ditemukan' })
  }

  res.json({ data: toCustomEvent(data) })
})

export default router
import crypto from 'node:crypto'
import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { toTemplate } from '../utils/template.js'
import { sanitizeTemplateInput } from '../utils/templateConfig.js'

const router = Router()

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Harus sama dengan TEMPLATE_CATEGORIES di EventTemplateEditor.jsx
const CATEGORIES = [
  'Birthday', 'Graduation', 'Friendship', 'Couple',
  'Wedding', 'Travel', 'Minimalist', 'Lainnya',
]

// Semua endpoint di file ini khusus admin
router.use(requireAuth, requireAdmin)

function toAdminTemplate(row) {
  return {
    ...toTemplate(row),
    slug: row.slug,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  }
}

// Membaca field non-desain: kategori, deskripsi, Premium, aktif.
// partial = true: hanya field yang dikirim yang diproses (untuk PATCH/PUT).
function readMeta(body, { partial }) {
  const out = {}

  if (!partial || body.category !== undefined) {
    const category = String(body.category ?? '').trim()

    if (!CATEGORIES.includes(category)) {
      return { error: 'Kategori tidak valid' }
    }

    out.category = category
  }

  if (!partial || body.description !== undefined) {
    const description = String(body.description ?? '').trim()

    if (description.length > 120) {
      return { error: 'Deskripsi maksimal 120 karakter' }
    }

    out.description = description
  }

  for (const [key, column] of [
    ['isPremium', 'is_premium'],
    ['isActive', 'is_active'],
  ]) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'boolean') {
        return { error: `${key} harus bernilai true atau false` }
      }

      out[column] = body[key]
    }
  }

  return { value: out }
}

// Hanya template umum (owner_id kosong). Template event dikelola lewat halaman Permintaan Event.
async function findPublicTemplate(id) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .is('owner_id', null)
    .maybeSingle()

  if (error) throw error

  return data
}

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .is('owner_id', null)
    .order('is_premium', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  res.json({ data: data.map(toAdminTemplate) })
})

router.post('/', async (req, res) => {
  const input = sanitizeTemplateInput(req.body)

  if (input.error) {
    return res.status(400).json({ message: input.error })
  }

  const meta = readMeta(req.body || {}, { partial: false })

  if (meta.error) {
    return res.status(400).json({ message: meta.error })
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      // Prefix "tpl-" supaya tidak bentrok dengan class CSS template bawaan (birthday, wedding, dst.)
      slug: `tpl-${crypto.randomBytes(4).toString('hex')}`,
      is_premium: false,
      is_active: true,
      owner_id: null,
      ...input.value,
      ...meta.value,
    })
    .select('*')
    .single()

  if (error) throw error

  res.status(201).json({ message: 'Template dibuat', data: toAdminTemplate(data) })
})

// Mengubah desain + data template (hanya template berbasis config)
router.put('/:id', async (req, res) => {
  const { id } = req.params

  if (!UUID_PATTERN.test(id)) {
    return res.status(404).json({ message: 'Template tidak ditemukan' })
  }

  const current = await findPublicTemplate(id)

  if (!current) {
    return res.status(404).json({ message: 'Template tidak ditemukan' })
  }

  if (!current.config) {
    return res.status(400).json({
      message:
        'Template bawaan tidak bisa diubah desainnya. Kamu masih bisa mengatur kategori, Premium, dan status aktifnya.',
    })
  }

  const input = sanitizeTemplateInput(req.body)

  if (input.error) {
    return res.status(400).json({ message: input.error })
  }

  const meta = readMeta(req.body || {}, { partial: true })

  if (meta.error) {
    return res.status(400).json({ message: meta.error })
  }

  const { data, error } = await supabase
    .from('templates')
    .update({ ...input.value, ...meta.value })
    .eq('id', id)
    .is('owner_id', null)
    .select('*')
    .single()

  if (error) throw error

  res.json({ message: 'Template diperbarui', data: toAdminTemplate(data) })
})

// Mengubah data ringan tanpa menyentuh desain (berlaku untuk template bawaan juga)
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const body = req.body || {}

  if (!UUID_PATTERN.test(id)) {
    return res.status(404).json({ message: 'Template tidak ditemukan' })
  }

  const current = await findPublicTemplate(id)

  if (!current) {
    return res.status(404).json({ message: 'Template tidak ditemukan' })
  }

  const meta = readMeta(body, { partial: true })

  if (meta.error) {
    return res.status(400).json({ message: meta.error })
  }

  const updates = { ...meta.value }

  if (body.name !== undefined) {
    const name = String(body.name ?? '').trim()

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ message: 'Nama template harus 2 sampai 60 karakter' })
    }

    updates.name = name
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Tidak ada perubahan yang dikirim' })
  }

  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .is('owner_id', null)
    .select('*')
    .single()

  if (error) throw error

  res.json({ message: 'Template diperbarui', data: toAdminTemplate(data) })
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params

  if (!UUID_PATTERN.test(id)) {
    return res.status(404).json({ message: 'Template tidak ditemukan' })
  }

  const current = await findPublicTemplate(id)

  if (!current) {
    return res.status(404).json({ message: 'Template tidak ditemukan' })
  }

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .is('owner_id', null)

  if (error) throw error

  res.json({ message: 'Template dihapus' })
})

export default router
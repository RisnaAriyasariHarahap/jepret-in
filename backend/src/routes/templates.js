import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

function toTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    className: row.slug,
    category: row.category,
    description: row.description,
    background: row.background,
    accent: row.accent,
    decoration: row.decoration,
    tag: row.tag,
    imageUrl: row.image_url,
    isPremium: row.is_premium,
  }
}

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  res.json({ data: data.map(toTemplate) })
})

export default router
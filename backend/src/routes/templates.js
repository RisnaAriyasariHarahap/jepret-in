import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { toProfile } from '../utils/profile.js'

const router = Router()

// Apakah pengunjung boleh memakai template premium? (Premium aktif atau admin)
async function viewerHasPremiumAccess(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return false

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) return false

    return profile.role === 'admin' || toProfile(profile).isPremium
  } catch {
    return false
  }
}

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .order('is_premium', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  const hasAccess = await viewerHasPremiumAccess(req)

  res.json({
    data: data.map((template) => ({
      id: template.id,
      name: template.name,
      className: template.slug,
      category: template.category,
      description: template.description,
      background: template.background,
      accent: template.accent,
      decoration: template.decoration,
      tag: template.tag,
      imageUrl: template.image_url,
      isPremium: Boolean(template.is_premium),
      locked: Boolean(template.is_premium) && !hasAccess,
      config: template.config ?? null,
    })),
  })
})

export default router
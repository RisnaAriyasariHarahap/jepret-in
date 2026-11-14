import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { toProfile } from '../utils/profile.js'
import { toTemplate } from '../utils/template.js'

const router = Router()

// Mengenali pengunjung dari token (opsional): id akun dan hak akses Premium
async function getViewer(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return null

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) return null

    return {
      id: profile.id,
      hasPremiumAccess: profile.role === 'admin' || toProfile(profile).isPremium,
    }
  } catch {
    return null
  }
}

router.get('/', async (req, res) => {
  const viewer = await getViewer(req)
  const nowIso = new Date().toISOString()

  // Template umum (bukan milik event tertentu)
  const { data: publicTemplates, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)
    .is('owner_id', null)
    .order('is_premium', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error

  // Template event: hanya untuk pemiliknya, hanya selama masa aktif
  let eventTemplates = []

  if (viewer) {
    const { data, error: eventError } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .eq('owner_id', viewer.id)
      .lte('active_from', nowIso)
      .gte('active_until', nowIso)
      .order('created_at', { ascending: false })

    if (eventError) throw eventError

    eventTemplates = data
  }

  const hasAccess = Boolean(viewer?.hasPremiumAccess)

  res.json({
    data: [
      ...eventTemplates.map((template) => toTemplate(template)),
      ...publicTemplates.map((template) =>
        toTemplate(template, { locked: Boolean(template.is_premium) && !hasAccess })
      ),
    ],
  })
})

export default router
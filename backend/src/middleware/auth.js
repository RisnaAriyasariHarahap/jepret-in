import { supabase } from '../config/supabase.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu' })
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    return res.status(401).json({ message: 'Sesi tidak valid atau sudah berakhir' })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    return res.status(403).json({ message: 'Profil pengguna tidak ditemukan' })
  }

  req.user = data.user
  req.profile = profile
  req.token = token
  next()
}

export function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({ message: 'Akses khusus admin' })
  }

  next()
}

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (token) {
    const { data } = await supabase.auth.getUser(token)

    if (data?.user) {
      req.user = data.user
    }
  }

  next()
}
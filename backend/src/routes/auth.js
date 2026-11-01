import { Router } from 'express'
import { supabase, createAuthClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { toProfile } from '../utils/profile.js'

const router = Router()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toSession(session) {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
  }
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  return toProfile(data)
}

router.post('/register', async (req, res) => {
  const fullName = String(req.body?.fullName || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (fullName.length < 2) {
    return res.status(400).json({ message: 'Nama lengkap minimal 2 karakter' })
  }

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid' })
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password minimal 8 karakter' })
  }

  const { data, error } = await createAuthClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    return res.status(400).json({ message: error.message })
  }

  if (!data.session) {
    return res.status(201).json({
      needsConfirmation: true,
      message: 'Registrasi berhasil. Silakan cek email untuk konfirmasi.',
    })
  }

  const profile = await getProfile(data.user.id)

  return res.status(201).json({ session: toSession(data.session), profile })
})

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' })
  }

  const { data, error } = await createAuthClient().auth.signInWithPassword({
    email,
    password,
  })

  if (error?.code === 'email_not_confirmed') {
    return res.status(403).json({ message: 'Email belum dikonfirmasi' })
  }

  if (error || !data.session) {
    return res.status(401).json({ message: 'Email atau password salah' })
  }

  const profile = await getProfile(data.user.id)

  return res.json({ session: toSession(data.session), profile })
})

router.post('/refresh', async (req, res) => {
  const refreshToken = String(req.body?.refreshToken || '')

  if (!refreshToken) {
    return res.status(400).json({ message: 'refreshToken wajib diisi' })
  }

  const { data, error } = await createAuthClient().auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error || !data.session) {
    return res.status(401).json({ message: 'Sesi berakhir, silakan login kembali' })
  }

  return res.json({ session: toSession(data.session) })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ profile: toProfile(req.profile) })
})

router.post('/logout', requireAuth, async (req, res) => {
  await supabase.auth.admin.signOut(req.token)

  res.json({ message: 'Berhasil keluar' })
})

export default router
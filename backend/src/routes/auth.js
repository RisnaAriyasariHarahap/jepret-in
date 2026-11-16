cat << 'EOF' > ~/jepret-in/backend/src/routes/auth.js
import { Router } from 'express'
import { supabase, createAuthClient } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { toProfile } from '../utils/profile.js'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (error) throw error

    // Ambil profil jika ada, fallback aman jika null
    let profile = null
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()
      profile = profileData ? toProfile(profileData) : { id: data.user.id, email, fullName, plan_id: 'free' }
    }

    res.json({
      message: 'Registrasi berhasil',
      session: data.session,
      user: data.user,
      profile
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    const profile = profileData ? toProfile(profileData) : { id: data.user.id, email, plan_id: 'free' }

    res.json({
      message: 'Login berhasil',
      session: data.session,
      user: data.user,
      profile
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new Error('Refresh token diperlukan')

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
    if (error) throw error

    res.json({ session: data.session })
  } catch (err) {
    res.status(401).json({ message: err.message })
  }
})

// Get Me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle()

    const profile = profileData ? toProfile(profileData) : { id: req.user.id, plan_id: 'free' }

    res.json({ user: req.user, profile })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router
EOF
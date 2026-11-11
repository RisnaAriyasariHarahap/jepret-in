import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { toProfile } from '../utils/profile.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/me', (req, res) => {
  res.json({ profile: toProfile(req.profile) })
})

export default router
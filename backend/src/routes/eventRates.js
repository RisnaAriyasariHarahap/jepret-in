import { Router } from 'express'
import { getRates, toRate } from '../utils/pricing.js'

const router = Router()

router.get('/', async (req, res) => {
  const rates = await getRates()

  res.json({ data: rates.map(toRate) })
})

export default router
import { Router } from 'express'
import { supabase } from '../config/supabase.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) throw error

  res.json({
    data: data.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      durationDays: plan.duration_days,
      features: plan.features,
    })),
  })
})

export default router
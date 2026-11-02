import crypto from 'node:crypto'
import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import {
  createSnapTransaction,
  getPublicConfig,
  getTransactionStatus,
} from '../services/midtrans.js'
import { applyMidtransStatus } from '../services/transactions.js'
import { toProfile } from '../utils/profile.js'

const router = Router()

const ONE_HOUR_IN_MS = 60 * 60 * 1000

router.post('/', requireAuth, async (req, res) => {
  const planId = String(req.body?.planId ?? '').trim()

  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle()

  if (planError) throw planError

  if (!plan) {
    return res.status(404).json({ message: 'Paket tidak ditemukan' })
  }

  if (plan.price <= 0) {
    return res.status(400).json({ message: 'Paket ini gratis dan tidak perlu dibayar' })
  }

  const publicConfig = getPublicConfig()

  const since = new Date(Date.now() - ONE_HOUR_IN_MS).toISOString()

  const { data: existing, error: existingError } = await supabase
    .from('transactions')
    .select('order_id, snap_token')
    .eq('user_id', req.profile.id)
    .eq('plan_id', plan.id)
    .eq('gross_amount', plan.price)
    .eq('status', 'pending')
    .not('snap_token', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingError) throw existingError

  if (existing.length > 0) {
    return res.json({
      data: {
        orderId: existing[0].order_id,
        token: existing[0].snap_token,
        ...publicConfig,
      },
    })
  }

  const orderId = `JPT-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(4)
    .toString('hex')
    .toUpperCase()}`

  const { error: insertError } = await supabase.from('transactions').insert({
    order_id: orderId,
    user_id: req.profile.id,
    plan_id: plan.id,
    gross_amount: plan.price,
    status: 'pending',
  })

  if (insertError) throw insertError

  try {
    const snap = await createSnapTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: plan.price,
      },
      item_details: [
        {
          id: plan.id,
          price: plan.price,
          quantity: 1,
          name: `Jepret.in ${plan.name} (${plan.duration_days ?? 30} hari)`,
        },
      ],
      customer_details: {
        first_name: req.profile.full_name || 'Pelanggan',
        email: req.profile.email,
      },
      credit_card: { secure: true },
    })

    const { error: tokenError } = await supabase
      .from('transactions')
      .update({ snap_token: snap.token })
      .eq('order_id', orderId)

    if (tokenError) throw tokenError

    return res.status(201).json({
      data: { orderId, token: snap.token, ...publicConfig },
    })
  } catch (error) {
    await supabase
      .from('transactions')
      .update({ status: 'failed' })
      .eq('order_id', orderId)

    throw error
  }
})

router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('order_id, plan_id, gross_amount, status, payment_type, created_at, paid_at')
    .eq('user_id', req.profile.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  res.json({
    data: data.map((item) => ({
      orderId: item.order_id,
      planId: item.plan_id,
      amount: item.gross_amount,
      status: item.status,
      paymentType: item.payment_type,
      createdAt: item.created_at,
      paidAt: item.paid_at,
    })),
  })
})

router.post('/:orderId/sync', requireAuth, async (req, res) => {
  const { orderId } = req.params

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('order_id, user_id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) throw error

  if (!transaction || transaction.user_id !== req.profile.id) {
    return res.status(404).json({ message: 'Transaksi tidak ditemukan' })
  }

  const midtrans = await getTransactionStatus(orderId)

  if (midtrans) {
    await applyMidtransStatus(midtrans)
  }

  const { data: fresh, error: freshError } = await supabase
    .from('transactions')
    .select('status')
    .eq('order_id', orderId)
    .single()

  if (freshError) throw freshError

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.profile.id)
    .single()

  if (profileError) throw profileError

  res.json({ data: { status: fresh.status, profile: toProfile(profile) } })
})

export default router
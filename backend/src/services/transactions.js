import { supabase } from '../config/supabase.js'
import { mapTransactionStatus } from './midtrans.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000

async function activatePremium(userId, planId) {
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('duration_days')
    .eq('id', planId)
    .single()

  if (planError) throw planError

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('premium_until')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  const currentEnd = profile.premium_until
    ? new Date(profile.premium_until).getTime()
    : 0

  const start = Math.max(Date.now(), currentEnd)
  const days = plan.duration_days ?? 30
  const premiumUntil = new Date(start + days * DAY_IN_MS).toISOString()

  const { error } = await supabase
    .from('profiles')
    .update({ plan_id: planId, premium_until: premiumUntil })
    .eq('id', userId)

  if (error) throw error
}

export async function applyMidtransStatus(midtrans) {
  const orderId = midtrans.order_id

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) throw error

  if (!transaction) {
    return { found: false }
  }

  const paidAmount = Math.round(Number(midtrans.gross_amount))

  if (paidAmount !== transaction.gross_amount) {
    console.error(
      `Nominal tidak cocok untuk ${orderId}: Midtrans ${midtrans.gross_amount}, database ${transaction.gross_amount}`
    )

    return { found: true, ignored: true, status: transaction.status }
  }

  const newStatus = mapTransactionStatus(
    midtrans.transaction_status,
    midtrans.fraud_status
  )

  if (!newStatus || transaction.status === 'settlement') {
    return { found: true, status: transaction.status }
  }

  const updates = {
    status: newStatus,
    payment_type: midtrans.payment_type ?? transaction.payment_type,
    midtrans_transaction_id:
      midtrans.transaction_id ?? transaction.midtrans_transaction_id,
    raw_notification: midtrans,
  }

  if (newStatus === 'settlement') {
    updates.paid_at = new Date().toISOString()
  }

  const { data: updated, error: updateError } = await supabase
    .from('transactions')
    .update(updates)
    .eq('order_id', orderId)
    .neq('status', 'settlement')
    .select('order_id')

  if (updateError) throw updateError

  const justSettled = newStatus === 'settlement' && updated.length > 0
  
  if (justSettled && transaction.user_id && transaction.plan_id) {
    try {
      await activatePremium(transaction.user_id, transaction.plan_id)
    } catch (activationError) {
      await supabase
        .from('transactions')
        .update({ status: 'pending', paid_at: null })
        .eq('order_id', orderId)

      throw activationError
    }
  }

  if (justSettled && transaction.custom_event_id) {
    const { error: eventError } = await supabase
      .from('custom_events')
      .update({ status: 'paid' })
      .eq('id', transaction.custom_event_id)
      .eq('status', 'approved')

    if (eventError) {
      await supabase
        .from('transactions')
        .update({ status: 'pending', paid_at: null })
        .eq('order_id', orderId)

      throw eventError
    }
  }

  return { found: true, status: newStatus }
}
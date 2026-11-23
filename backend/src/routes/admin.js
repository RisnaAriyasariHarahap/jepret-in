import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { toProfile } from '../utils/profile.js'

const router = Router()

router.use(requireAuth, requireAdmin)

const PAGE_SIZE = 20
const TX_STATUSES = ['pending', 'settlement', 'failed', 'cancelled', 'expired']
const TX_COLUMNS =
  'order_id, user_id, plan_id, custom_event_id, gross_amount, status, payment_type, created_at, paid_at'
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

router.get('/me', (req, res) => {
  res.json({ profile: toProfile(req.profile) })
})

// ---------- Helper ----------

// Hanya huruf, angka, @ . _ - dan spasi; aman dipakai di filter PostgREST
function cleanSearch(value) {
  return String(value ?? '')
    .replace(/[^\p{L}\p{N}@._ -]/gu, '')
    .trim()
    .slice(0, 60)
}

function readPage(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)

  return { page, from: (page - 1) * PAGE_SIZE, to: page * PAGE_SIZE - 1 }
}

async function countRows(query) {
  const { count, error } = await query

  if (error) throw error

  return count ?? 0
}

const head = { count: 'exact', head: true }

// PostgREST membatasi 1000 baris per permintaan, jadi diambil bertahap
async function loadSettledTransactions() {
  const rows = []
  const size = 1000

  for (let from = 0; ; from += size) {
    const { data, error } = await supabase
      .from('transactions')
      .select('gross_amount, paid_at, created_at, custom_event_id')
      .eq('status', 'settlement')
      .order('created_at', { ascending: false })
      .range(from, from + size - 1)

    if (error) throw error

    rows.push(...data)

    if (data.length < size) break
  }

  return rows
}

// Bulan dihitung dalam WIB (UTC+7)
function jakartaMonthKey(date) {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS)

  return shifted.getUTCFullYear() * 12 + shifted.getUTCMonth()
}

function buildRevenue(settled) {
  const nowKey = jakartaMonthKey(new Date())
  const months = []

  for (let offset = 5; offset >= 0; offset -= 1) {
    const key = nowKey - offset
    const year = Math.floor(key / 12)

    months.push({ key, label: `${MONTH_LABELS[key % 12]} ${String(year).slice(2)}`, amount: 0 })
  }

  let total = 0
  let premium = 0
  let event = 0

  for (const row of settled) {
    const amount = Number(row.gross_amount) || 0

    total += amount

    if (row.custom_event_id) event += amount
    else premium += amount

    const month = months.find((item) => item.key === jakartaMonthKey(new Date(row.paid_at ?? row.created_at)))

    if (month) month.amount += amount
  }

  return {
    total,
    premium,
    event,
    thisMonth: months[months.length - 1].amount,
    settledCount: settled.length,
    monthly: months.map(({ label, amount }) => ({ label, amount })),
  }
}

async function enrichTransactions(rows) {
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))]
  const eventIds = [...new Set(rows.map((row) => row.custom_event_id).filter(Boolean))]
  const planIds = [...new Set(rows.map((row) => row.plan_id).filter(Boolean))]
  const empty = { data: [], error: null }

  const [users, events, plans] = await Promise.all([
    userIds.length ? supabase.from('profiles').select('id, email, full_name').in('id', userIds) : empty,
    eventIds.length ? supabase.from('custom_events').select('id, event_name').in('id', eventIds) : empty,
    planIds.length ? supabase.from('plans').select('id, name, duration_days').in('id', planIds) : empty,
  ])

  for (const result of [users, events, plans]) {
    if (result.error) throw result.error
  }

  const userMap = new Map(users.data.map((item) => [item.id, item]))
  const eventMap = new Map(events.data.map((item) => [item.id, item.event_name]))
  const planMap = new Map(plans.data.map((item) => [item.id, item]))

  return rows.map((row) => {
    const user = userMap.get(row.user_id)
    const plan = planMap.get(row.plan_id)
    const isEvent = Boolean(row.custom_event_id)

    return {
      orderId: row.order_id,
      type: isEvent ? 'event' : 'premium',
      title: isEvent
        ? `Custom Event: ${eventMap.get(row.custom_event_id) ?? 'Event'}`
        : `Jepret.in ${plan?.name ?? 'Premium'} (${plan?.duration_days ?? 30} hari)`,
      customerName: user?.full_name ?? '-',
      customerEmail: user?.email ?? '-',
      amount: row.gross_amount,
      status: row.status,
      paymentType: row.payment_type,
      createdAt: row.created_at,
      paidAt: row.paid_at,
    }
  })
}

// ---------- Statistik dashboard ----------

router.get('/stats', async (req, res) => {
  const nowIso = new Date().toISOString()
  const publicTemplates = () => supabase.from('templates').select('id', head).is('owner_id', null)
  const eventsWith = (status) => supabase.from('custom_events').select('id', head).eq('status', status)
  const transactionsWith = (status) => supabase.from('transactions').select('order_id', head).eq('status', status)

  const [
    templatesTotal, templatesActive, templatesPremium,
    customers, premiumActive,
    eventsPending, eventsApproved, eventsRejected, eventsPaid,
    txPending, txSettlement,
    settled, recent,
  ] = await Promise.all([
    countRows(publicTemplates()),
    countRows(publicTemplates().eq('is_active', true)),
    countRows(publicTemplates().eq('is_premium', true)),
    countRows(supabase.from('profiles').select('id', head).neq('role', 'admin')),
    countRows(
      supabase.from('profiles').select('id', head)
        .neq('role', 'admin').eq('plan_id', 'premium').gt('premium_until', nowIso)
    ),
    countRows(eventsWith('pending')),
    countRows(eventsWith('approved')),
    countRows(eventsWith('rejected')),
    countRows(eventsWith('paid')),
    countRows(transactionsWith('pending')),
    countRows(transactionsWith('settlement')),
    loadSettledTransactions(),
    supabase.from('transactions').select(TX_COLUMNS).order('created_at', { ascending: false }).limit(5),
  ])

  if (recent.error) throw recent.error

  res.json({
    data: {
      templates: { total: templatesTotal, active: templatesActive, premium: templatesPremium },
      customers: { total: customers, premiumActive },
      events: { pending: eventsPending, approved: eventsApproved, rejected: eventsRejected, paid: eventsPaid },
      transactions: { pending: txPending, settlement: txSettlement },
      revenue: buildRevenue(settled),
      recentTransactions: await enrichTransactions(recent.data),
    },
  })
})

// ---------- Daftar transaksi ----------

router.get('/transactions', async (req, res) => {
  const { page, from, to } = readPage(req.query)
  const status = TX_STATUSES.includes(req.query.status) ? req.query.status : ''
  const search = cleanSearch(req.query.q)

  let query = supabase
    .from('transactions')
    .select(TX_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  if (search) {
    const { data: matches, error: matchError } = await supabase
      .from('profiles')
      .select('id')
      .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      .limit(50)

    if (matchError) throw matchError

    const conditions = [`order_id.ilike.%${search}%`]

    if (matches.length > 0) {
      conditions.push(`user_id.in.(${matches.map((item) => item.id).join(',')})`)
    }

    query = query.or(conditions.join(','))
  }

  const { data, count, error } = await query

  if (error) throw error

  res.json({ data: await enrichTransactions(data), total: count ?? 0, page, pageSize: PAGE_SIZE })
})

// ---------- Daftar pelanggan ----------

router.get('/customers', async (req, res) => {
  const { page, from, to } = readPage(req.query)
  const search = cleanSearch(req.query.q)
  const plan = ['premium', 'free'].includes(req.query.plan) ? req.query.plan : ''
  const nowIso = new Date().toISOString()

  function buildQuery(orderColumn) {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('role', 'admin')
      .order(orderColumn, { ascending: orderColumn !== 'created_at' })
      .range(from, to)

    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)

    if (plan === 'premium') {
      query = query.eq('plan_id', 'premium').gt('premium_until', nowIso)
    } else if (plan === 'free') {
      query = query.or(`plan_id.neq.premium,premium_until.is.null,premium_until.lte.${nowIso}`)
    }

    return query
  }

  let result = await buildQuery('created_at')

  // 42703 = kolom created_at tidak ada di tabel profiles; urutkan berdasarkan email saja
  if (result.error?.code === '42703') result = await buildQuery('email')

  const { data, count, error } = result

  if (error) throw error

  res.json({
    data: data.map((row) => ({ ...toProfile(row), createdAt: row.created_at ?? null })),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  })
})

export default router
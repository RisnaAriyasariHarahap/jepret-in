import crypto from 'node:crypto'

function getConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const clientKey = process.env.MIDTRANS_CLIENT_KEY

  if (!serverKey || !clientKey) {
    console.error('MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY belum diisi di file .env')

    const error = new Error('Layanan pembayaran belum dikonfigurasi')
    error.status = 503
    throw error
  }

  const production = process.env.MIDTRANS_IS_PRODUCTION === 'true'

  return {
    serverKey,
    clientKey,
    snapApiUrl: production
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
    coreApiUrl: production
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2',
    snapJsUrl: production
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js',
  }
}

function authHeader(serverKey) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`
}

export function getPublicConfig() {
  const { clientKey, snapJsUrl } = getConfig()

  return { clientKey, snapJsUrl }
}

export async function createSnapTransaction(payload) {
  const config = getConfig()

  const response = await fetch(config.snapApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader(config.serverKey),
    },
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok || !body.token) {
    console.error('Midtrans Snap error:', response.status, body)

    const error = new Error('Gagal membuat transaksi pembayaran')
    error.status = 502
    throw error
  }

  return body
}

export async function getTransactionStatus(orderId) {
  const config = getConfig()

  const response = await fetch(
    `${config.coreApiUrl}/${encodeURIComponent(orderId)}/status`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: authHeader(config.serverKey),
      },
    }
  )

  const body = await response.json().catch(() => ({}))

  if (String(body.status_code) === '404') {
    return null
  }

  if (!response.ok && !body.transaction_status) {
    console.error('Midtrans status error:', response.status, body)

    const error = new Error('Gagal memeriksa status pembayaran')
    error.status = 502
    throw error
  }

  return body
}

export function verifyNotificationSignature(notification) {
  const { serverKey } = getConfig()

  const expected = crypto
    .createHash('sha512')
    .update(
      `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`
    )
    .digest('hex')

  const given = String(notification.signature_key || '')

  if (expected.length !== given.length) return false

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))
}

export function mapTransactionStatus(transactionStatus, fraudStatus) {
  switch (transactionStatus) {
    case 'capture':
      if (fraudStatus === 'challenge') return 'pending'
      if (fraudStatus === 'deny') return 'failed'
      return 'settlement'
    case 'settlement':
      return 'settlement'
    case 'pending':
      return 'pending'
    case 'deny':
    case 'failure':
      return 'failed'
    case 'cancel':
      return 'cancelled'
    case 'expire':
      return 'expired'
    default:
      return null
  }
}
import { rateLimit } from 'express-rate-limit'

function limiter({ windowMs, limit, message, skipSuccessfulRequests = false, skip }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip,
    message: { message },
  })
}

const MINUTE = 60 * 1000

// Seluruh API: batas longgar. Webhook Midtrans dan health check dikecualikan.
export const apiLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 600,
  message: 'Terlalu banyak permintaan. Coba lagi beberapa menit lagi.',
  skip: (req) =>
    req.originalUrl.startsWith('/api/midtrans') || req.originalUrl.startsWith('/api/health'),
})

// Login: hanya percobaan gagal yang dihitung
export const loginLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
})

export const registerLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: 'Terlalu banyak pendaftaran dari jaringan ini. Coba lagi dalam 1 jam.',
})

export const refreshLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 60,
  message: 'Terlalu banyak permintaan sesi. Coba lagi beberapa menit lagi.',
})

// Pembuatan transaksi, sinkronisasi status, dan pengajuan event
export const paymentLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 60,
  message: 'Terlalu banyak permintaan pembayaran. Coba lagi beberapa menit lagi.',
})

export const eventSubmitLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 30,
  message: 'Terlalu banyak pengajuan. Coba lagi beberapa menit lagi.',
})
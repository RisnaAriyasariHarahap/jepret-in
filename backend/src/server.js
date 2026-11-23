import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { supabase } from './config/supabase.js'
import templatesRouter from './routes/templates.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import customEventsRouter from './routes/customEvents.js'
import plansRouter from './routes/plans.js'
import transactionsRouter from './routes/transactions.js'
import midtransRouter from './routes/midtrans.js'
import eventRatesRouter from './routes/eventRates.js'
import adminEventsRouter from './routes/adminEvents.js'
import adminTemplatesRouter from './routes/adminTemplates.js'
import {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  paymentLimiter,
  eventSubmitLimiter,
} from './middleware/rateLimit.js'

const app = express()
const PORT = process.env.PORT || 5000

// Di belakang proxy (Railway, dll.) isi TRUST_PROXY=1 agar IP pengunjung terbaca benar.
// Di lokal biarkan 0.
app.set('trust proxy', Number(process.env.TRUST_PROXY || 0))

app.use(
  helmet({
    // API ini dipanggil dari domain frontend yang berbeda
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(
        Object.assign(new Error('Origin tidak diizinkan oleh CORS'), { status: 403 })
      )
    },
    credentials: true,
  })
)

app.use(express.json({ limit: '200kb' }))

app.use('/api', apiLimiter)
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth/register', registerLimiter)
app.use('/api/auth/refresh', refreshLimiter)
app.use('/api/transactions', paymentLimiter)
app.use('/api/custom-events', eventSubmitLimiter)

app.use('/api/templates', templatesRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin/custom-events', adminEventsRouter)
app.use('/api/admin/templates', adminTemplatesRouter)
app.use('/api/admin', adminRouter)
app.use('/api/custom-events', customEventsRouter)
app.use('/api/event-rates', eventRatesRouter)
app.use('/api/plans', plansRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/midtrans', midtransRouter)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'jepret-in-backend',
    time: new Date().toISOString(),
  })
})

app.get('/api/health/db', async (req, res) => {
  const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })

  if (error) {
    console.error('Health check DB gagal:', error)

    return res.status(500).json({ status: 'error', message: 'Database tidak dapat dihubungi' })
  }

  return res.json({ status: 'ok', database: 'terhubung ke Supabase' })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' })
})

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format JSON tidak valid' })
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Data yang dikirim terlalu besar' })
  }

  const status = err.status || err.statusCode || 500

  // Pesan error internal (database, library) tidak dikirim ke klien.
  // Hanya error 4xx atau error yang sengaja ditandai expose = true yang pesannya tampil.
  if (status >= 500 && !err.expose) {
    console.error(err)

    return res.status(500).json({ message: 'Terjadi kesalahan pada server' })
  }

  res.status(status).json({ message: err.message })
})

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`)
})
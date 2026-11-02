import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { supabase } from './config/supabase.js'
import templatesRouter from './routes/templates.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import customEventsRouter from './routes/customEvents.js'
import plansRouter from './routes/plans.js'
import transactionsRouter from './routes/transactions.js'
import midtransRouter from './routes/midtrans.js'

const app = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Origin tidak diizinkan oleh CORS'))
    },
    credentials: true,
  })
)

app.use(express.json({ limit: '1mb' }))

app.use('/api/templates', templatesRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/custom-events', customEventsRouter)
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
    return res.status(500).json({ status: 'error', message: error.message })
  }

  return res.json({ status: 'ok', database: 'terhubung ke Supabase' })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Terjadi kesalahan pada server' })
})

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`)
})
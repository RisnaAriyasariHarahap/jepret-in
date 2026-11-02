import { Router } from 'express'
import {
  getTransactionStatus,
  verifyNotificationSignature,
} from '../services/midtrans.js'
import { applyMidtransStatus } from '../services/transactions.js'

const router = Router()

router.post('/notification', async (req, res) => {
  const notification = req.body || {}

  if (!notification.order_id || !notification.signature_key) {
    return res.status(400).json({ message: 'Notifikasi tidak valid' })
  }

  if (!verifyNotificationSignature(notification)) {
    return res.status(403).json({ message: 'Signature tidak valid' })
  }

  const midtrans = await getTransactionStatus(notification.order_id)

  if (!midtrans) {
    return res.status(200).json({ message: 'Transaksi belum ditemukan di Midtrans' })
  }

  await applyMidtransStatus(midtrans)

  return res.status(200).json({ message: 'OK' })
})

export default router
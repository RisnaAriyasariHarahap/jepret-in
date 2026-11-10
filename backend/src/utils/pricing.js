import { supabase } from '../config/supabase.js'

export const DURATION_UNITS = ['hour', 'day', 'week', 'month']

const HOUR_IN_MS = 60 * 60 * 1000

export async function getRates() {
  const { data, error } = await supabase
    .from('event_rates')
    .select('*')

  if (error) throw error

  return DURATION_UNITS
    .map((unit) => data.find((rate) => rate.unit === unit))
    .filter(Boolean)
}

export function toRate(row) {
  return {
    unit: row.unit,
    label: row.label,
    price: row.price,
    minValue: row.min_value,
    maxValue: row.max_value,
  }
}

// Menghitung waktu selesai dari waktu mulai + durasi
export function computeEndsAt(startsAt, unit, value) {
  const end = new Date(startsAt)

  if (unit === 'hour') return new Date(end.getTime() + value * HOUR_IN_MS)
  if (unit === 'day') end.setDate(end.getDate() + value)
  else if (unit === 'week') end.setDate(end.getDate() + value * 7)
  else if (unit === 'month') end.setMonth(end.getMonth() + value)

  return end
}

// Memvalidasi durasi dan menghitung harga dari tarif di database.
// Mengembalikan { error } jika tidak valid, atau { price, endsAt }.
export function calculateQuote(rates, { startsAt, unit, value }) {
  const rate = rates.find((item) => item.unit === unit)

  if (!rate) {
    return { error: 'Satuan durasi tidak valid' }
  }

  const amount = Number(value)

  if (!Number.isInteger(amount) || amount < rate.min_value || amount > rate.max_value) {
    return {
      error: `Durasi ${rate.label.toLowerCase()} harus antara ${rate.min_value} dan ${rate.max_value}`,
    }
  }

  const start = new Date(startsAt)

  if (Number.isNaN(start.getTime())) {
    return { error: 'Waktu mulai tidak valid' }
  }

  return {
    price: rate.price * amount,
    endsAt: computeEndsAt(start, unit, amount),
  }
}
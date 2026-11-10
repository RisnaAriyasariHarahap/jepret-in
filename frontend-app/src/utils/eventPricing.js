const HOUR_IN_MS = 60 * 60 * 1000

export function computeEndsAt(startsAt, unit, value) {
  const end = new Date(startsAt)

  if (unit === 'hour') return new Date(end.getTime() + value * HOUR_IN_MS)
  if (unit === 'day') end.setDate(end.getDate() + value)
  else if (unit === 'week') end.setDate(end.getDate() + value * 7)
  else if (unit === 'month') end.setMonth(end.getMonth() + value)

  return end
}

export function formatRupiah(amount) {
  return `Rp${Number(amount).toLocaleString('id-ID')}`
}

export function formatDateTime(date) {
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Nilai untuk input datetime-local (waktu setempat)
export function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset() * 60000

  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
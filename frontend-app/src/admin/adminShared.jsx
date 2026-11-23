import { useEffect, useMemo, useState } from 'react'
import { apiFetch, clearSession } from '../api.js'

export const txStatusInfo = {
  pending: { label: 'Menunggu', className: 'is-warn' },
  settlement: { label: 'Berhasil', className: 'is-active' },
  failed: { label: 'Gagal', className: 'is-bad' },
  cancelled: { label: 'Dibatalkan', className: 'is-off' },
  expired: { label: 'Kedaluwarsa', className: 'is-off' },
}

const paymentLabels = {
  bank_transfer: 'Transfer bank',
  echannel: 'Mandiri Bill',
  qris: 'QRIS',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  credit_card: 'Kartu kredit',
  cstore: 'Minimarket',
}

export function paymentLabel(type) {
  if (!type) return '-'

  return paymentLabels[type] ?? type.replace(/_/g, ' ')
}

// Token tidak valid atau bukan admin: kembali ke halaman login admin
export function handleAdminAuthError(err) {
  if (err.status === 401 || err.status === 403) {
    clearSession()
    window.location.replace('/admin/login')

    return true
  }

  return false
}

// Memuat daftar berhalaman dari API admin. Filter berubah -> kembali ke halaman 1.
export function useAdminList(path, filters) {
  const filterKey = JSON.stringify(filters)
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ data: [], total: 0, pageSize: 20, loading: true, error: '' })

  useEffect(() => {
    setPage(1)
  }, [filterKey])

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(async () => {
      setState((current) => ({ ...current, loading: true, error: '' }))

      try {
        const params = new URLSearchParams({ page: String(page) })

        for (const [key, value] of Object.entries(JSON.parse(filterKey))) {
          if (value) params.set(key, value)
        }

        const result = await apiFetch(`${path}?${params}`)

        if (!cancelled) {
          setState({
            data: result.data || [],
            total: result.total || 0,
            pageSize: result.pageSize || 20,
            loading: false,
            error: '',
          })
        }
      } catch (err) {
        if (cancelled || handleAdminAuthError(err)) return

        setState((current) => ({ ...current, loading: false, error: err.message || 'Gagal memuat data' }))
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [path, filterKey, page])

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(state.total / state.pageSize)),
    [state.total, state.pageSize]
  )

  return { ...state, page, setPage, pageCount }
}

export function Pager({ page, pageCount, total, onChange }) {
  return (
    <div className="admin-pager">
      <span>{total} data · Halaman {page} dari {pageCount}</span>
      <div>
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Sebelumnya</button>
        <button type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>Berikutnya →</button>
      </div>
    </div>
  )
}
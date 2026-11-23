import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api.js'
import { formatRupiah } from '../utils/eventPricing.js'
import { handleAdminAuthError, txStatusInfo } from './adminShared.jsx'

function shortRupiah(amount) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1).replace('.0', '')}jt`
  if (amount >= 1000) return `${Math.round(amount / 1000)}rb`

  return String(amount)
}

export default function DashboardPage({ navigate }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiFetch('/api/admin/stats')

      setStats(result.data)
    } catch (err) {
      if (!handleAdminAuthError(err)) setError(err.message || 'Gagal memuat statistik')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const maxMonthly = stats ? Math.max(...stats.revenue.monthly.map((item) => item.amount), 1) : 1

  const cards = stats && [
    { tone: 'teal', icon: '↗', label: 'PENDAPATAN', title: formatRupiah(stats.revenue.total),
      note: `Premium ${formatRupiah(stats.revenue.premium)} · Event ${formatRupiah(stats.revenue.event)}`,
      link: ['Lihat transaksi', 'transactions'] },
    { tone: 'coral', icon: '▥', label: 'BULAN INI', title: formatRupiah(stats.revenue.thisMonth),
      note: `${stats.revenue.settledCount} transaksi berhasil sepanjang waktu`,
      link: ['Lihat transaksi', 'transactions'] },
    { tone: 'navy', icon: '◉', label: 'PELANGGAN', title: `${stats.customers.total} akun`,
      note: `${stats.customers.premiumActive} Premium aktif`,
      link: ['Lihat pelanggan', 'customers'] },
    { tone: 'teal', icon: '▧', label: 'TEMPLATE', title: `${stats.templates.active} aktif`,
      note: `${stats.templates.total} total · ${stats.templates.premium} Premium`,
      link: ['Kelola template', 'templates'] },
    { tone: 'coral', icon: '▤', label: 'PERMINTAAN EVENT', title: `${stats.events.pending} menunggu`,
      note: `${stats.events.approved} disetujui · ${stats.events.paid} dibayar · ${stats.events.rejected} ditolak`,
      link: ['Lihat permintaan', 'events'] },
    { tone: 'navy', icon: '⌛', label: 'TRANSAKSI', title: `${stats.transactions.pending} pending`,
      note: `${stats.transactions.settlement} transaksi berhasil`,
      link: ['Lihat transaksi', 'transactions'] },
  ]

  return (
    <>
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">QUICK OVERVIEW</span>
          <h2>Ringkasan platform</h2>
        </div>
        <button type="button" className="admin-tpl-refresh" onClick={loadStats} disabled={loading}>
          {loading ? 'Memuat...' : '↻ Segarkan'}
        </button>
      </div>

      {error && <div className="admin-template-form-note" role="alert">{error}</div>}

      {!stats && !error && <p className="admin-muted-note">Memuat statistik...</p>}

      {stats && (
        <>
          <section className="admin-stat-grid">
            {cards.map((card) => (
              <article key={card.label} className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className={`admin-stat-icon ${card.tone}`} aria-hidden="true">{card.icon}</span>
                  <span className="admin-stat-label">{card.label}</span>
                </div>
                <h3 className="admin-stat-value">{card.title}</h3>
                <p>{card.note}</p>
                <button type="button" className="admin-text-link" onClick={() => navigate(card.link[1])}>
                  {card.link[0]} <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </section>

          <section className="admin-lower-grid">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="admin-eyebrow">PENDAPATAN</span>
                  <h2>6 bulan terakhir</h2>
                </div>
              </div>
              <div className="admin-bars" role="img" aria-label="Grafik pendapatan 6 bulan terakhir">
                {stats.revenue.monthly.map((item) => (
                  <div key={item.label} className="admin-bar" title={formatRupiah(item.amount)}>
                    <em>{item.amount > 0 ? shortRupiah(item.amount) : '-'}</em>
                    <span style={{ height: `${Math.max((item.amount / maxMonthly) * 100, item.amount > 0 ? 4 : 0)}%` }} />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="admin-eyebrow">AKTIVITAS</span>
                  <h2>Transaksi terbaru</h2>
                </div>
              </div>
              {stats.recentTransactions.length === 0 ? (
                <p className="admin-muted-note">Belum ada transaksi.</p>
              ) : (
                <ul className="admin-recent">
                  {stats.recentTransactions.map((item) => {
                    const info = txStatusInfo[item.status] ?? txStatusInfo.pending

                    return (
                      <li key={item.orderId}>
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.customerName} · {formatRupiah(item.amount)}</small>
                        </div>
                        <span className={`admin-tpl-badge ${info.className}`}>{info.label}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
              <button type="button" className="admin-text-link" onClick={() => navigate('transactions')}>
                Lihat semua transaksi <span aria-hidden="true">→</span>
              </button>
            </article>
          </section>
        </>
      )}
    </>
  )
}
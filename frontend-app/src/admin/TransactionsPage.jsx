import { useState } from 'react'
import { formatDateTime, formatRupiah } from '../utils/eventPricing.js'
import { Pager, paymentLabel, txStatusInfo, useAdminList } from './adminShared.jsx'

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const list = useAdminList('/api/admin/transactions', { q: search.trim(), status })

  return (
    <section className="admin-template-page">
      <div className="admin-template-toolbar">
        <label className="admin-template-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Cari nama, email, atau nomor pesanan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="admin-template-filter">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>
            {Object.entries(txStatusInfo).map(([value, info]) => (
              <option key={value} value={value}>{info.label}</option>
            ))}
          </select>
        </label>
      </div>

      {list.error && <div className="admin-template-form-note" role="alert">{list.error}</div>}

      <div className="admin-template-table-wrap">
        <table className="admin-template-table">
          <thead>
            <tr>
              <th>PESANAN</th>
              <th>PELANGGAN</th>
              <th>TOTAL</th>
              <th>METODE</th>
              <th>STATUS</th>
              <th>TANGGAL</th>
            </tr>
          </thead>
          <tbody>
            {list.loading && list.data.length === 0 ? (
              <tr><td colSpan={6} className="admin-template-empty-cell"><div className="admin-template-empty-content"><p>Memuat transaksi...</p></div></td></tr>
            ) : list.data.length === 0 ? (
              <tr><td colSpan={6} className="admin-template-empty-cell"><div className="admin-template-empty-content"><h3>Belum ada transaksi</h3><p>Transaksi yang cocok dengan filter akan tampil di sini.</p></div></td></tr>
            ) : (
              list.data.map((item) => {
                const info = txStatusInfo[item.status] ?? txStatusInfo.pending

                return (
                  <tr key={item.orderId}>
                    <td>
                      <div className="admin-tpl-cell"><div>
                        <strong>{item.title}</strong>
                        <small className="admin-break">{item.orderId}</small>
                      </div></div>
                    </td>
                    <td>
                      <div className="admin-tpl-cell"><div>
                        <strong>{item.customerName}</strong>
                        <small>{item.customerEmail}</small>
                      </div></div>
                    </td>
                    <td><strong>{formatRupiah(item.amount)}</strong></td>
                    <td>{paymentLabel(item.paymentType)}</td>
                    <td><span className={`admin-tpl-badge ${info.className}`}>{info.label}</span></td>
                    <td>
                      {formatDateTime(new Date(item.paidAt ?? item.createdAt))}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pager page={list.page} pageCount={list.pageCount} total={list.total} onChange={list.setPage} />
    </section>
  )
}
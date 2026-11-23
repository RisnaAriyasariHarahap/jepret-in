import { useState } from 'react'
import { formatDateTime } from '../utils/eventPricing.js'
import { Pager, useAdminList } from './adminShared.jsx'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const list = useAdminList('/api/admin/customers', { q: search.trim(), plan })

  return (
    <section className="admin-template-page">
      <div className="admin-template-toolbar">
        <label className="admin-template-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Cari nama atau email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="admin-template-filter">
          <span>Paket</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="">Semua</option>
            <option value="premium">Premium aktif</option>
            <option value="free">Free</option>
          </select>
        </label>
      </div>

      {list.error && <div className="admin-template-form-note" role="alert">{list.error}</div>}

      <div className="admin-template-table-wrap">
        <table className="admin-template-table">
          <thead>
            <tr>
              <th>PELANGGAN</th>
              <th>PAKET</th>
              <th>PREMIUM SAMPAI</th>
              <th>BERGABUNG</th>
            </tr>
          </thead>
          <tbody>
            {list.loading && list.data.length === 0 ? (
              <tr><td colSpan={4} className="admin-template-empty-cell"><div className="admin-template-empty-content"><p>Memuat pelanggan...</p></div></td></tr>
            ) : list.data.length === 0 ? (
              <tr><td colSpan={4} className="admin-template-empty-cell"><div className="admin-template-empty-content"><h3>Belum ada pelanggan</h3><p>Pelanggan yang cocok dengan filter akan tampil di sini.</p></div></td></tr>
            ) : (
              list.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="admin-tpl-cell"><div>
                      <strong>{item.fullName || '-'}</strong>
                      <small>{item.email}</small>
                    </div></div>
                  </td>
                  <td>
                    <span className={`admin-tpl-badge ${item.isPremium ? 'is-premium' : ''}`}>
                      {item.isPremium ? 'Premium' : 'Free'}
                    </span>
                  </td>
                  <td>{item.isPremium && item.premiumUntil ? formatDateTime(new Date(item.premiumUntil)) : '-'}</td>
                  <td>{item.createdAt ? formatDateTime(new Date(item.createdAt)) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pager page={list.page} pageCount={list.pageCount} total={list.total} onChange={list.setPage} />
    </section>
  )
}
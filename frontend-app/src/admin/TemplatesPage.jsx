import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, clearSession } from '../api.js'
import TemplatePreview from '../components/landing/TemplatePreview.jsx'
import EventTemplateEditor, { TEMPLATE_CATEGORIES } from './EventTemplateEditor.jsx'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [editor, setEditor] = useState(null) // null = tertutup, { template } = terbuka
  const [busyId, setBusyId] = useState('')

  const handleUnauthorized = useCallback((err) => {
    if (err.status === 401 || err.status === 403) {
      clearSession()
      window.location.replace('/admin/login')
      return true
    }

    return false
  }, [])

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiFetch('/api/admin/templates')

      setTemplates(result.data || [])
    } catch (err) {
      if (!handleUnauthorized(err)) {
        setError(err.message || 'Gagal memuat template')
      }
    } finally {
      setLoading(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return templates.filter(
      (item) =>
        (category === 'Semua' || item.category === category) &&
        (!keyword || item.name.toLowerCase().includes(keyword))
    )
  }, [templates, search, category])

  const categories = useMemo(
    () => ['Semua', ...new Set([...TEMPLATE_CATEGORIES, ...templates.map((item) => item.category)])],
    [templates]
  )

  async function patchTemplate(item, changes, message) {
    setBusyId(item.id)
    setNotice('')
    setError('')

    try {
      const result = await apiFetch(`/api/admin/templates/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      })

      setTemplates((current) => current.map((row) => (row.id === item.id ? result.data : row)))
      setNotice(message)
    } catch (err) {
      if (!handleUnauthorized(err)) setError(err.message || 'Gagal memperbarui template')
    } finally {
      setBusyId('')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Hapus template "${item.name}" secara permanen? Untuk menyembunyikan saja, gunakan tombol Nonaktifkan.`)) {
      return
    }

    setBusyId(item.id)
    setNotice('')
    setError('')

    try {
      await apiFetch(`/api/admin/templates/${item.id}`, { method: 'DELETE' })

      setTemplates((current) => current.filter((row) => row.id !== item.id))
      setNotice(`Template "${item.name}" dihapus.`)
    } catch (err) {
      if (!handleUnauthorized(err)) setError(err.message || 'Gagal menghapus template')
    } finally {
      setBusyId('')
    }
  }

  function handleSaved(saved, message) {
    setTemplates((current) => {
      const exists = current.some((row) => row.id === saved.id)

      return exists ? current.map((row) => (row.id === saved.id ? saved : row)) : [...current, saved]
    })
    setNotice(message)
    setEditor(null)
  }

  return (
    <section className="admin-template-page">
      <div className="admin-template-header">
        <div>
          <span className="admin-eyebrow">KELOLA TEMPLATE</span>
          <h1 className="admin-template-title">Template photostrip</h1>
          <p className="admin-template-description">
            Atur template yang tampil di website: buat desain baru, ubah, atur Premium, atau sembunyikan.
          </p>
        </div>
        <button type="button" className="admin-template-add" onClick={() => setEditor({ template: null })}>
          <span>+</span> Template baru
        </button>
      </div>

      <div className="admin-template-toolbar">
        <label className="admin-template-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Cari nama template"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="admin-template-filter">
          <span>Kategori</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="admin-template-summary">
        <div>
          <strong>{visible.length} template</strong>
          <span>
            {templates.filter((item) => item.isActive).length} aktif ·{' '}
            {templates.filter((item) => item.isPremium).length} Premium
          </span>
        </div>
      </div>

      {notice && (
        <div className="admin-template-notice" role="status">
          <span>✓</span>
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice('')} aria-label="Tutup">×</button>
        </div>
      )}

      {error && <div className="admin-template-form-note" role="alert">{error}</div>}

      <div className="admin-template-table-wrap">
        <table className="admin-template-table">
          <thead>
            <tr>
              <th>TEMPLATE</th>
              <th>KATEGORI</th>
              <th>AKSES</th>
              <th>STATUS</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="admin-template-empty-cell"><div className="admin-template-empty-content"><p>Memuat template...</p></div></td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={5} className="admin-template-empty-cell"><div className="admin-template-empty-content"><h3>Tidak ada template</h3><p>Coba ubah pencarian atau buat template baru.</p></div></td></tr>
            ) : (
              visible.map((item) => {
                const isConfig = Boolean(item.config)
                const busy = busyId === item.id

                return (
                  <tr key={item.id} className="admin-tpl-row-item">
                    <td>
                      <div className="admin-tpl-cell">
                        <div className="admin-tpl-thumb">
                          {isConfig ? (
                            <TemplatePreview template={item} />
                          ) : (
                            <span style={{ background: `linear-gradient(135deg, ${item.background}, ${item.accent})` }} />
                          )}
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{isConfig ? 'Buatan admin' : 'Template bawaan'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <span className={`admin-tpl-badge ${item.isPremium ? 'is-premium' : ''}`}>
                        {item.isPremium ? 'Premium' : 'Free'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-tpl-badge ${item.isActive ? 'is-active' : 'is-off'}`}>
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-tpl-actions">
                        {isConfig && (
                          <button type="button" disabled={busy} onClick={() => setEditor({ template: item })}>Ubah</button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            patchTemplate(
                              item,
                              { isActive: !item.isActive },
                              item.isActive ? `"${item.name}" disembunyikan dari website.` : `"${item.name}" kini tampil di website.`
                            )
                          }
                        >
                          {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            patchTemplate(
                              item,
                              { isPremium: !item.isPremium },
                              item.isPremium ? `"${item.name}" kini gratis.` : `"${item.name}" kini khusus Premium.`
                            )
                          }
                        >
                          {item.isPremium ? 'Jadikan Free' : 'Jadikan Premium'}
                        </button>
                        <button type="button" className="is-danger" disabled={busy} onClick={() => handleDelete(item)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editor && (
        <EventTemplateEditor
          template={editor.template}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
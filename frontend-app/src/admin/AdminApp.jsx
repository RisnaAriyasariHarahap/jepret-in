import { useEffect, useState } from 'react'
import './AdminApp.css'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'templates', label: 'Kelola Template', icon: '▧' },
  { id: 'events', label: 'Permintaan Event', icon: '▤' },
]

const pageInfo = {
  dashboard: {
    eyebrow: 'OVERVIEW',
    title: 'Dashboard',
    description: 'Pantau dan kelola aktivitas Jepret.in dari satu tempat.',
  },
  templates: {
    eyebrow: 'CONTENT MANAGEMENT',
    title: 'Kelola Template',
    description: 'Kelola koleksi desain photobooth untuk berbagai momen.',
  },
  events: {
    eyebrow: 'EVENT MANAGEMENT',
    title: 'Permintaan Event',
    description: 'Tinjau permintaan layanan photobooth untuk acara.',
  },
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function DashboardPage({ navigate }) {
  return (
    <>
      <section className="admin-welcome">
        <div className="admin-welcome-copy">
          <span className="admin-eyebrow">YOUR CREATIVE SPACE</span>
          <h2>Setiap jepretan punya cerita.</h2>
          <p>
            Selamat datang di ruang pengelolaan Jepret.in.
            Siapkan pengalaman photobooth yang berkesan untuk setiap momen.
          </p>
          <button
            type="button"
            className="admin-button admin-button-light"
            onClick={() => navigate('templates')}
          >
            Jelajahi template <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="admin-welcome-art" aria-hidden="true">
          <div className="admin-art-sun" />
          <div className="admin-art-card admin-art-card-one">
            <span>J</span>
            <small>YOUR MOMENT</small>
          </div>
          <div className="admin-art-card admin-art-card-two"><span>+</span></div>
          <div className="admin-art-caption">MAKE IT MEMORABLE</div>
        </div>
      </section>

      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">QUICK OVERVIEW</span>
          <h2>Ringkasan platform</h2>
        </div>
        <span className="admin-status">
          <span className="admin-status-dot" />
          Menunggu koneksi backend
        </span>
      </div>

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-icon teal" aria-hidden="true">▧</span>
            <span className="admin-stat-label">KONTEN</span>
          </div>
          <h3>Template</h3>
          <p>Jumlah template akan tampil setelah data tersedia.</p>
          <button type="button" className="admin-text-link" onClick={() => navigate('templates')}>
            Kelola template <span aria-hidden="true">→</span>
          </button>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-icon coral" aria-hidden="true">▤</span>
            <span className="admin-stat-label">LAYANAN</span>
          </div>
          <h3>Permintaan event</h3>
          <p>Data permintaan akan tampil setelah backend terhubung.</p>
          <button type="button" className="admin-text-link" onClick={() => navigate('events')}>
            Lihat permintaan <span aria-hidden="true">→</span>
          </button>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-icon navy" aria-hidden="true">↗</span>
            <span className="admin-stat-label">AKTIVITAS</span>
          </div>
          <h3>Sesi photobooth</h3>
          <p>Ringkasan sesi foto belum tersedia.</p>
          <span className="admin-muted-note">Menunggu integrasi data</span>
        </article>
      </section>

      <section className="admin-lower-grid">
        <article className="admin-panel admin-getting-started">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">GET STARTED</span>
              <h2>Siapkan ruang kreatifmu</h2>
            </div>
            <span className="admin-heading-icon" aria-hidden="true">✳</span>
          </div>

          <div className="admin-task-list">
            <button type="button" className="admin-task" onClick={() => navigate('templates')}>
              <span className="admin-task-number">01</span>
              <span className="admin-task-copy">
                <strong>Periksa koleksi template</strong>
                <small>Siapkan pengelolaan desain photobooth.</small>
              </span>
              <span className="admin-task-arrow" aria-hidden="true">↗</span>
            </button>

            <button type="button" className="admin-task" onClick={() => navigate('events')}>
              <span className="admin-task-number">02</span>
              <span className="admin-task-copy">
                <strong>Tinjau permintaan event</strong>
                <small>Siapkan alur pengelolaan acara.</small>
              </span>
              <span className="admin-task-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
        </article>

        <article className="admin-panel admin-connection-panel">
          <span className="admin-eyebrow">SYSTEM STATUS</span>
          <div className="admin-connection-symbol" aria-hidden="true">⌁</div>
          <h2>Admin sedang disiapkan</h2>
          <p>
            Tampilan admin sudah bisa dikembangkan. Data nyata akan tersedia
            setelah layanan backend dihubungkan.
          </p>
          <div className="admin-connection-footer">
            <span className="admin-status-dot" />
            <span>Frontend siap dikembangkan</span>
          </div>
        </article>
      </section>
    </>
  )
}

function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')

  function closeForm() {
    setShowForm(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setNotice(
      'Formulir sudah diperiksa di sisi frontend, tetapi template belum disimpan. Integrasi backend diperlukan agar data dapat tersimpan.'
    )
    setShowForm(false)
  }

  const hasFilter = search.trim() !== '' || category !== 'all'

  return (
    <section className="admin-panel admin-content-panel">
      <div className="admin-template-header">
        <div>
          <span className="admin-eyebrow">TEMPLATE LIBRARY</span>
          <h2 className="admin-template-title">Koleksi template</h2>
          <p className="admin-template-description">
            Kelola desain photobooth untuk berbagai momen dan acara.
          </p>
        </div>

        <button
          type="button"
          className="admin-template-add"
          onClick={() => {
            setNotice('')
            setShowForm(true)
          }}
        >
          <span aria-hidden="true">+</span>
          Tambah template
        </button>
      </div>

      <div className="admin-template-toolbar">
        <label className="admin-template-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama template..."
            aria-label="Cari nama template"
          />
        </label>

        <label className="admin-template-filter">
          <span>Kategori</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter kategori template"
          >
            <option value="all">Semua kategori</option>
            <option value="birthday">Birthday</option>
            <option value="graduation">Graduation</option>
            <option value="wedding">Wedding</option>
            <option value="friendship">Friendship</option>
            <option value="couple">Couple</option>
            <option value="other">Lainnya</option>
          </select>
        </label>
      </div>

      {notice && (
        <div className="admin-template-notice" role="status">
          <span aria-hidden="true">i</span>
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice('')} aria-label="Tutup pemberitahuan">×</button>
        </div>
      )}

      <div className="admin-template-summary">
        <div>
          <strong>Daftar template</strong>
          <span>Data akan ditampilkan setelah sumber data terhubung.</span>
        </div>
        <span className="admin-coming-soon">API belum tersedia</span>
      </div>

      <div className="admin-template-table-wrap">
        <table className="admin-template-table">
          <thead>
            <tr>
              <th scope="col">TEMPLATE</th>
              <th scope="col">KATEGORI</th>
              <th scope="col">STATUS</th>
              <th scope="col">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="admin-template-empty-cell">
                <div className="admin-template-empty-content">
                  <div className="admin-template-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                  <h3>{hasFilter ? 'Belum ada data untuk difilter' : 'Belum ada template'}</h3>
                  <p>
                    {hasFilter
                      ? 'Pencarian dan filter belum bisa mencocokkan template karena sumber data belum terhubung.'
                      : 'Koleksi template akan muncul di sini setelah sumber data tersedia.'}
                  </p>
                  {hasFilter && (
                    <button
                      type="button"
                      className="admin-template-empty-action"
                      onClick={() => {
                        setSearch('')
                        setCategory('all')
                      }}
                    >
                      Reset pencarian dan filter
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showForm && (
        <div
          className="admin-template-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <section className="admin-template-modal" role="dialog" aria-modal="true" aria-labelledby="admin-template-form-title">
            <div className="admin-template-modal-header">
              <div>
                <span className="admin-eyebrow">CONTENT MANAGEMENT</span>
                <h2 id="admin-template-form-title">Tambah template</h2>
                <p>Rancangan formulir untuk menyiapkan template baru.</p>
              </div>
              <button type="button" className="admin-template-close" onClick={closeForm} aria-label="Tutup formulir">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="admin-template-field">
                <span>Nama template</span>
                <input name="name" type="text" placeholder="Masukkan nama template" required />
              </label>

              <label className="admin-template-field">
                <span>Kategori</span>
                <select name="category" defaultValue="" required>
                  <option value="" disabled>Pilih kategori</option>
                  <option value="birthday">Birthday</option>
                  <option value="graduation">Graduation</option>
                  <option value="wedding">Wedding</option>
                  <option value="friendship">Friendship</option>
                  <option value="couple">Couple</option>
                  <option value="other">Lainnya</option>
                </select>
              </label>

              <label className="admin-template-field">
                <span>Deskripsi</span>
                <textarea name="description" rows="3" placeholder="Jelaskan konsep desain template" required />
              </label>

              <label className="admin-template-field">
                <span>Gambar atau desain template</span>
                <input name="design" type="file" accept="image/*" disabled aria-describedby="admin-template-upload-note" />
                <small id="admin-template-upload-note">
                  Unggah gambar akan diaktifkan setelah alur penyimpanan file disepakati dengan backend.
                </small>
              </label>

              <div className="admin-template-form-note">
                Formulir ini masih berupa prototipe UI. Pengiriman tidak menyimpan data.
              </div>

              <div className="admin-template-form-actions">
                <button type="button" className="admin-template-cancel" onClick={closeForm}>Batal</button>
                <button type="submit" className="admin-template-add">Periksa formulir</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

function EventsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const hasFilter = search.trim() !== '' || statusFilter !== 'all'

  function resetFilters() {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <section className="admin-panel admin-content-panel">
      <div className="admin-content-toolbar">
        <div>
          <span className="admin-eyebrow">EVENT REQUESTS</span>
          <h2>Permintaan layanan</h2>
          <p>Tinjau pengajuan photobooth untuk berbagai acara.</p>
        </div>
        <span className="admin-coming-soon">API belum tersedia</span>
      </div>

      <div className="admin-events-overview">
        <article className="admin-events-summary">
          <span className="admin-events-summary-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
          </span>
          <div>
            <p>Total permintaan</p>
            <strong>—</strong>
            <small>Menunggu data backend</small>
          </div>
        </article>

        <article className="admin-events-summary">
          <span className="admin-events-summary-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <div>
            <p>Perlu ditinjau</p>
            <strong>—</strong>
            <small>Menunggu data backend</small>
          </div>
        </article>
      </div>

      <div className="admin-events-filters">
        <label className="admin-events-search">
          <span className="admin-events-field-label">Cari permintaan</span>
          <span className="admin-events-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              placeholder="Cari nama pelanggan atau acara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </span>
        </label>

        <label className="admin-events-status-filter">
          <span className="admin-events-field-label">Filter status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Semua status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </label>

        {hasFilter && (
          <button type="button" className="admin-events-reset" onClick={resetFilters}>Reset filter</button>
        )}
      </div>

      <div className="admin-events-list-heading">
        <div>
          <h3>Daftar permintaan</h3>
          <p>Tinjau informasi pengajuan layanan photobooth.</p>
        </div>
      </div>

      <div className="admin-events-table-wrapper">
        <table className="admin-events-table">
          <thead>
            <tr>
              <th>INFORMASI ACARA</th>
              <th>TANGGAL ACARA</th>
              <th>STATUS</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4}>
                <div className="admin-events-table-empty">
                  <EmptyState
                    icon="▤"
                    title={hasFilter ? 'Data permintaan belum tersedia' : 'Belum ada data permintaan'}
                    description={
                      hasFilter
                        ? 'Data belum dapat dicari atau difilter karena backend belum terhubung.'
                        : 'Pengajuan pelanggan akan muncul di sini setelah formulir pengguna terhubung dengan backend.'
                    }
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}


export default function AdminApp() {
  const getPageFromUrl = () => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/'

    if (path === '/admin/templates') return 'templates'
    if (path === '/admin/events') return 'events'

    return 'dashboard'
  }

  const [activePage, setActivePage] = useState(getPageFromUrl)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const currentPage = pageInfo[activePage]

  useEffect(() => {
    function handlePopState() {
      setActivePage(getPageFromUrl())
      setSidebarOpen(false)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  function navigate(page) {
    const paths = {
      dashboard: '/admin',
      templates: '/admin/templates',
      events: '/admin/events',
    }

    if (!paths[page]) return

    window.history.pushState({}, '', paths[page])
    setActivePage(page)
    setSidebarOpen(false)
  }


  return (
    <div className="jepret-admin">
      {sidebarOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Tutup menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <a className="admin-brand" href="/admin" aria-label="Jepret.in Admin">
          <span className="admin-brand-mark" aria-hidden="true">
            <svg className="admin-brand-symbol" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37 18H77V56C77 78 65 89 46 88C31 87 21 78 21 64C21 53 28 46 38 46C48 46 55 54 55 64C55 72 50 77 43 78C55 84 68 73 68 56V28H37V18Z" fill="currentColor" />
              <circle cx="20" cy="34" r="8" fill="currentColor" />
              <circle cx="17" cy="31" r="2.2" fill="#FFF2F6" />
            </svg>
          </span>
          <span className="admin-brand-copy">
            <strong>jepret.in</strong>
            <small>ADMIN STUDIO</small>
          </span>
        </a>

        <div className="admin-sidebar-label">WORKSPACE</div>

        <nav className="admin-navigation" aria-label="Navigasi admin">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`admin-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {activePage === item.id && <span className="admin-nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">
            <span className="admin-sidebar-note-icon" aria-hidden="true">✳</span>
            <strong>Make every moment count.</strong>
            <p>Ruang untuk mengelola cerita dan kenangan.</p>
          </div>

          <div className="admin-profile">
            <div className="admin-profile-avatar">A</div>
            <div className="admin-profile-copy">
              <strong>Administrator</strong>
              <small>Admin workspace</small>
            </div>
            <span className="admin-profile-menu" aria-hidden="true">···</span>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-toggle"
              aria-label="Buka menu navigasi"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="admin-breadcrumb">
              <span>Jepret.in</span>
              <span className="admin-breadcrumb-separator">/</span>
              <strong>{currentPage.title}</strong>
            </div>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-environment">
              <span className="admin-status-dot" />
              Development
            </span>
            <div className="admin-topbar-avatar">A</div>
          </div>
        </header>

        <main className="admin-page-content">
          <section className="admin-page-heading">
            <div>
              <span className="admin-eyebrow">{currentPage.eyebrow}</span>
              <h1>{currentPage.title}</h1>
              <p>{currentPage.description}</p>
            </div>
            <span className="admin-date-label">JEPRET.IN WORKSPACE</span>
          </section>

          {activePage === 'dashboard' && <DashboardPage navigate={navigate} />}
          {activePage === 'templates' && <TemplatesPage />}
          {activePage === 'events' && <EventsPage />}
        </main>
      </div>
    </div>
  )
}

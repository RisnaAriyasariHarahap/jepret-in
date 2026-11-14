import { useEffect, useMemo, useState } from 'react'
import { apiFetch, clearSession } from '../api.js'
import { renderStrip } from '../utils/stripRenderer.js'
import { stickerTypes } from '../utils/stickers.js'
import { formatDateTime } from '../utils/eventPricing.js'

const stickerLabels = {
  heart: 'Hati', star: 'Bintang', sparkle: 'Kilau', bow: 'Pita', flower: 'Bunga',
  daisy: 'Daisy', cloud: 'Awan', moon: 'Bulan', butterfly: 'Kupu-kupu',
  cherry: 'Ceri', smiley: 'Smiley', lightning: 'Petir', sun: 'Matahari', leaf: 'Daun',
}

const patternOptions = [
  ['none', 'Tanpa pola'], ['dots', 'Titik'], ['stripes', 'Garis miring'], ['checker', 'Kotak-kotak'],
  ['gingham', 'Gingham'], ['grid', 'Grid'], ['stars', 'Bintang kecil'],
]

const borderOptions = [
  ['none', 'Tanpa bingkai'], ['scallop', 'Bergelombang'], ['dashed', 'Garis putus'],
  ['double', 'Garis ganda'], ['solid', 'Garis tebal'], ['film', 'Roll film'],
]

const DEFAULT_STATE = {
  name: '', tag: 'CUSTOM EVENT', decoration: '♡ ✦ ♡', tagline: 'our little moments',
  background: '#fff1f5', accent: '#ed829d', textColor: '#49353d',
  patternType: 'dots', patternColor: '#ffffff', patternOpacity: 0.5, patternSize: 30,
  borderStyle: 'scallop', borderColor: '#ed829d',
  frameColor: '#ffffff', frameRadius: 14, frameMatting: 10,
  stickerTypes: ['heart', 'sparkle'], stickerColors: ['#ed829d', '#f6c453', '#ffffff'],
  stickerCount: 20, stickerSeed: 3,
  cornerTl: 'bow', cornerBr: 'heart', cornerColor: '#ed829d',
}

const PRESETS = [
  {
    label: 'Wedding',
    values: {
      tag: 'THE WEDDING', decoration: '♡ ✦ ♡', tagline: 'happily ever after',
      background: '#fbf3e4', accent: '#b8892b', textColor: '#4a3b2a',
      patternType: 'dots', patternColor: '#ffffff', patternOpacity: 0.6, patternSize: 30,
      borderStyle: 'double', borderColor: '#b8892b', frameColor: '#ffffff', frameRadius: 6, frameMatting: 10,
      stickerTypes: ['sparkle', 'heart', 'flower'], stickerColors: ['#b8892b', '#e8c872', '#ffffff'],
      stickerCount: 18, stickerSeed: 5, cornerTl: 'flower', cornerBr: 'sparkle', cornerColor: '#b8892b',
    },
  },
  {
    label: 'Wisuda',
    values: {
      tag: 'GRADUATION DAY', decoration: '★ ✦ ★', tagline: 'we did it!',
      background: '#1f2f54', accent: '#e8c872', textColor: '#ffffff',
      patternType: 'stars', patternColor: '#e8c872', patternOpacity: 0.35, patternSize: 34,
      borderStyle: 'solid', borderColor: '#e8c872', frameColor: '#ffffff', frameRadius: 8, frameMatting: 10,
      stickerTypes: ['star', 'sparkle'], stickerColors: ['#e8c872', '#ffffff'],
      stickerCount: 22, stickerSeed: 9, cornerTl: 'star', cornerBr: 'sparkle', cornerColor: '#e8c872',
    },
  },
  {
    label: 'Ulang tahun',
    values: {
      tag: 'BIRTHDAY PARTY', decoration: '✿ ♡ ✿', tagline: 'make a wish!',
      background: '#fff0f6', accent: '#ff6fa3', textColor: '#49353d',
      patternType: 'dots', patternColor: '#ffd1e3', patternOpacity: 0.8, patternSize: 32,
      borderStyle: 'scallop', borderColor: '#ff9ec4', frameColor: '#ffffff', frameRadius: 20, frameMatting: 10,
      stickerTypes: ['star', 'heart', 'smiley', 'sparkle', 'cloud'],
      stickerColors: ['#ff6fa3', '#f6c453', '#8ed1fc', '#c8a2ff'],
      stickerCount: 30, stickerSeed: 3, cornerTl: 'bow', cornerBr: 'heart', cornerColor: '#ff6fa3',
    },
  },
  {
    label: 'Kampus',
    values: {
      tag: 'CAMPUS EVENT', decoration: '✦ ⚡ ✦', tagline: 'good times together',
      background: '#eaf6ff', accent: '#3b82c4', textColor: '#223a52',
      patternType: 'grid', patternColor: '#ffffff', patternOpacity: 0.7, patternSize: 32,
      borderStyle: 'dashed', borderColor: '#3b82c4', frameColor: '#ffffff', frameRadius: 10, frameMatting: 10,
      stickerTypes: ['lightning', 'star', 'smiley'], stickerColors: ['#3b82c4', '#f6c453', '#ffffff'],
      stickerCount: 18, stickerSeed: 4, cornerTl: 'star', cornerBr: 'smiley', cornerColor: '#3b82c4',
    },
  },
]

function toPayload(state) {
  const photoCorners = []

  if (state.cornerTl) {
    photoCorners.push({ corner: 'tl', type: state.cornerTl, size: 70, color: state.cornerColor, rotate: -15 })
  }

  if (state.cornerBr) {
    photoCorners.push({ corner: 'br', type: state.cornerBr, size: 62, color: state.cornerColor, rotate: 12 })
  }

  return {
    name: state.name,
    tag: state.tag,
    decoration: state.decoration,
    background: state.background,
    accent: state.accent,
    config: {
      textColor: state.textColor,
      tagline: state.tagline,
      pattern: {
        type: state.patternType,
        color: state.patternColor,
        opacity: Number(state.patternOpacity),
        size: Number(state.patternSize),
      },
      border: { style: state.borderStyle, color: state.borderColor },
      photoFrame: {
        color: state.frameColor,
        radius: Number(state.frameRadius),
        matting: Number(state.frameMatting),
      },
      scatter: {
        types: state.stickerTypes,
        colors: state.stickerColors,
        count: Number(state.stickerCount),
        seed: Number(state.stickerSeed),
      },
      photoCorners,
    },
  }
}

function fromTemplate(template) {
  const config = template.config || {}
  const corner = (position) => config.photoCorners?.find((item) => item.corner === position)

  return {
    ...DEFAULT_STATE,
    name: template.name,
    tag: template.tag ?? DEFAULT_STATE.tag,
    decoration: template.decoration ?? '',
    background: template.background,
    accent: template.accent,
    textColor: config.textColor ?? DEFAULT_STATE.textColor,
    tagline: config.tagline ?? '',
    patternType: config.pattern?.type ?? 'none',
    patternColor: config.pattern?.color ?? '#ffffff',
    patternOpacity: config.pattern?.opacity ?? 0.5,
    patternSize: config.pattern?.size ?? 30,
    borderStyle: config.border?.style ?? 'none',
    borderColor: config.border?.color ?? '#ffffff',
    frameColor: config.photoFrame?.color ?? '#ffffff',
    frameRadius: config.photoFrame?.radius ?? 14,
    frameMatting: config.photoFrame?.matting ?? 10,
    stickerTypes: config.scatter?.types ?? [],
    stickerColors: config.scatter?.colors?.length ? config.scatter.colors : DEFAULT_STATE.stickerColors,
    stickerCount: config.scatter?.count ?? 0,
    stickerSeed: config.scatter?.seed ?? 1,
    cornerTl: corner('tl')?.type ?? '',
    cornerBr: corner('br')?.type ?? '',
    cornerColor: corner('tl')?.color ?? corner('br')?.color ?? DEFAULT_STATE.cornerColor,
  }
}

export default function EventTemplateEditor({ event, onClose }) {
  const [state, setState] = useState({ ...DEFAULT_STATE, name: event.eventName })
  const [loading, setLoading] = useState(true)
  const [hasTemplate, setHasTemplate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function set(key, value) {
    setState((current) => ({ ...current, [key]: value }))
    setNotice('')
  }

  function handleUnauthorized(err) {
    if (err.status === 401 || err.status === 403) {
      clearSession()
      window.location.replace('/admin/login')
      return true
    }

    return false
  }

  useEffect(() => {
    let cancelled = false

    async function loadTemplate() {
      try {
        const result = await apiFetch(`/api/admin/custom-events/${event.id}/template`)

        if (cancelled) return

        if (result.data) {
          setState(fromTemplate(result.data))
          setHasTemplate(true)
        }
      } catch (err) {
        if (!cancelled && !handleUnauthorized(err)) {
          setError(err.message || 'Gagal memuat template event')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTemplate()

    return () => {
      cancelled = true
    }
  }, [event.id])

  const payload = useMemo(() => toPayload(state), [state])

  const previewSrc = useMemo(() => {
    try {
      const config = {
        ...payload.config,
        scatter: { ...payload.config.scatter, size: [26, 46], sides: true },
        border: {
          ...payload.config.border,
          holeColor: payload.background,
        },
      }

      return renderStrip({ template: { ...payload, config }, scale: 0.5 }).toDataURL('image/png')
    } catch {
      return ''
    }
  }, [payload])

  function toggleSticker(type) {
    const current = state.stickerTypes

    if (current.includes(type)) {
      set('stickerTypes', current.filter((item) => item !== type))
    } else if (current.length < 8) {
      set('stickerTypes', [...current, type])
    }
  }

  function setStickerColor(index, value) {
    set('stickerColors', state.stickerColors.map((color, position) => (position === index ? value : color)))
  }

  function applyPreset(preset) {
    setState((current) => ({ ...current, ...preset.values }))
    setNotice('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const result = await apiFetch(`/api/admin/custom-events/${event.id}/template`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      setHasTemplate(true)
      setNotice(
        `Template disimpan. Pelanggan melihatnya di halaman Templates sampai ${formatDateTime(new Date(result.data.activeUntil))}.`
      )
    } catch (err) {
      if (handleUnauthorized(err)) return

      setError(err.message || 'Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="admin-template-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <section className="admin-template-modal admin-tpl-editor" role="dialog" aria-modal="true" aria-labelledby="admin-tpl-editor-title">
        <div className="admin-template-modal-header">
          <div>
            <span className="admin-eyebrow">TEMPLATE EVENT</span>
            <h2 id="admin-tpl-editor-title">{hasTemplate ? 'Ubah template' : 'Buat template'}: {event.eventName}</h2>
            <p>
              Pemilik: {event.name} ({event.email}). Aktif {formatDateTime(new Date(event.startsAt))} sampai{' '}
              {formatDateTime(new Date(event.endsAt))}.
            </p>
          </div>
          <button type="button" className="admin-template-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        {loading ? (
          <p>Memuat...</p>
        ) : (
          <div className="admin-tpl-editor-body">
            <div className="admin-tpl-editor-form">
              <div className="admin-tpl-presets">
                <span>Mulai dari:</span>
                {PRESETS.map((preset) => (
                  <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>{preset.label}</button>
                ))}
              </div>

              <fieldset>
                <legend>Teks</legend>
                <label>Nama template<input type="text" maxLength={60} value={state.name} onChange={(e) => set('name', e.target.value)} /></label>
                <label>Label kecil<input type="text" maxLength={30} value={state.tag} onChange={(e) => set('tag', e.target.value)} /></label>
                <label>Dekorasi<input type="text" maxLength={20} value={state.decoration} onChange={(e) => set('decoration', e.target.value)} /></label>
                <label>Tagline bawah<input type="text" maxLength={40} value={state.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
              </fieldset>

              <fieldset>
                <legend>Warna</legend>
                <div className="admin-tpl-row">
                  <label>Latar<input type="color" value={state.background} onChange={(e) => set('background', e.target.value)} /></label>
                  <label>Aksen<input type="color" value={state.accent} onChange={(e) => set('accent', e.target.value)} /></label>
                  <label>Teks<input type="color" value={state.textColor} onChange={(e) => set('textColor', e.target.value)} /></label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Pola latar</legend>
                <label>Jenis
                  <select value={state.patternType} onChange={(e) => set('patternType', e.target.value)}>
                    {patternOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="admin-tpl-row">
                  <label>Warna<input type="color" value={state.patternColor} onChange={(e) => set('patternColor', e.target.value)} /></label>
                  <label>Transparansi<input type="range" min="0.1" max="1" step="0.05" value={state.patternOpacity} onChange={(e) => set('patternOpacity', e.target.value)} /></label>
                  <label>Ukuran<input type="range" min="16" max="70" value={state.patternSize} onChange={(e) => set('patternSize', e.target.value)} /></label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Bingkai</legend>
                <label>Tepi strip
                  <select value={state.borderStyle} onChange={(e) => set('borderStyle', e.target.value)}>
                    {borderOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="admin-tpl-row">
                  <label>Warna tepi<input type="color" value={state.borderColor} onChange={(e) => set('borderColor', e.target.value)} /></label>
                  <label>Warna bingkai foto<input type="color" value={state.frameColor} onChange={(e) => set('frameColor', e.target.value)} /></label>
                  <label>Sudut foto<input type="range" min="0" max="40" value={state.frameRadius} onChange={(e) => set('frameRadius', e.target.value)} /></label>
                </div>
              </fieldset>

              <fieldset>
                <legend>Stiker (maksimal 8 jenis)</legend>
                <div className="admin-tpl-chips">
                  {stickerTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={state.stickerTypes.includes(type) ? 'is-on' : ''}
                      onClick={() => toggleSticker(type)}
                    >
                      {stickerLabels[type] ?? type}
                    </button>
                  ))}
                </div>
                <div className="admin-tpl-row">
                  {state.stickerColors.map((color, index) => (
                    <label key={index}>Warna {index + 1}<input type="color" value={color} onChange={(e) => setStickerColor(index, e.target.value)} /></label>
                  ))}
                </div>
                <div className="admin-tpl-row">
                  <label>Jumlah<input type="range" min="0" max="50" value={state.stickerCount} onChange={(e) => set('stickerCount', e.target.value)} /></label>
                  <button type="button" className="admin-template-cancel" onClick={() => set('stickerSeed', Math.floor(Math.random() * 9999) + 1)}>Acak posisi</button>
                </div>
              </fieldset>

              <fieldset>
                <legend>Stiker sudut foto</legend>
                <div className="admin-tpl-row">
                  <label>Kiri atas
                    <select value={state.cornerTl} onChange={(e) => set('cornerTl', e.target.value)}>
                      <option value="">Tidak ada</option>
                      {stickerTypes.map((type) => <option key={type} value={type}>{stickerLabels[type] ?? type}</option>)}
                    </select>
                  </label>
                  <label>Kanan bawah
                    <select value={state.cornerBr} onChange={(e) => set('cornerBr', e.target.value)}>
                      <option value="">Tidak ada</option>
                      {stickerTypes.map((type) => <option key={type} value={type}>{stickerLabels[type] ?? type}</option>)}
                    </select>
                  </label>
                  <label>Warna<input type="color" value={state.cornerColor} onChange={(e) => set('cornerColor', e.target.value)} /></label>
                </div>
              </fieldset>
            </div>

            <div className="admin-tpl-editor-preview">
              <strong>Pratinjau</strong>
              {previewSrc && <img src={previewSrc} alt="Pratinjau photostrip" />}
            </div>
          </div>
        )}

        {error && <div className="admin-template-form-note" role="alert">{error}</div>}
        {notice && <div className="admin-template-form-note" role="status">{notice}</div>}

        <div className="admin-template-form-actions">
          <button type="button" className="admin-template-cancel" onClick={onClose} disabled={saving}>Tutup</button>
          <button type="button" className="admin-template-add" onClick={handleSave} disabled={saving || loading || state.name.trim().length < 2}>
            {saving ? 'Menyimpan...' : hasTemplate ? 'Simpan perubahan' : 'Simpan template'}
          </button>
        </div>
      </section>
    </div>
  )
}
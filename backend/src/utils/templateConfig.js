export const STICKER_TYPES = [
  'heart', 'star', 'sparkle', 'bow', 'flower', 'daisy', 'cloud',
  'moon', 'butterfly', 'cherry', 'smiley', 'lightning', 'sun', 'leaf',
]

const PATTERN_TYPES = ['none', 'dots', 'stripes', 'checker', 'gingham', 'grid', 'stars']
const BORDER_STYLES = ['none', 'scallop', 'dashed', 'double', 'solid', 'film']
const CORNERS = ['tl', 'tr', 'bl', 'br']
const HEX_PATTERN = /^#[0-9a-f]{6}$/i

const fail = (message) => ({ error: message })

function readText(value, min, max, label) {
  const text = String(value ?? '').trim()

  if (text.length < min || text.length > max) {
    return fail(`${label} harus ${min} sampai ${max} karakter`)
  }

  return { value: text }
}

function readHex(value, label) {
  const text = String(value ?? '').trim()

  if (!HEX_PATTERN.test(text)) return fail(`${label} harus berupa warna hex, contoh #ff6fa3`)

  return { value: text.toLowerCase() }
}

function readNumber(value, min, max, label, { integer = false } = {}) {
  const number = Number(value)

  if (value === '' || value === null || !Number.isFinite(number) || number < min || number > max) {
    return fail(`${label} harus berupa angka ${min} sampai ${max}`)
  }

  if (integer && !Number.isInteger(number)) return fail(`${label} harus bilangan bulat`)

  return { value: number }
}

// Hanya field yang dikenal yang disalin, jadi admin tidak bisa menyimpan JSON sembarang.
export function sanitizeTemplateInput(body) {
  const input = body || {}
  const config = input.config || {}
  const out = {}
  const cfg = {}

  const checks = [
    ['name', readText(input.name, 2, 60, 'Nama template')],
    ['tag', readText(input.tag ?? 'CUSTOM EVENT', 0, 30, 'Label kecil')],
    ['decoration', readText(input.decoration ?? '', 0, 20, 'Dekorasi')],
    ['background', readHex(input.background, 'Warna latar')],
    ['accent', readHex(input.accent, 'Warna aksen')],
  ]

  for (const [key, result] of checks) {
    if (result.error) return result
    out[key] = result.value
  }

  const textColor = readHex(config.textColor ?? '#49353d', 'Warna teks')
  if (textColor.error) return textColor
  cfg.textColor = textColor.value

  const tagline = readText(config.tagline ?? '', 0, 40, 'Tagline')
  if (tagline.error) return tagline
  cfg.tagline = tagline.value || 'our little moments'

  // Pola latar
  const pattern = config.pattern || {}
  if (!PATTERN_TYPES.includes(pattern.type ?? 'none')) return fail('Jenis pola tidak valid')

  const patternColor = readHex(pattern.color ?? '#ffffff', 'Warna pola')
  const patternOpacity = readNumber(pattern.opacity ?? 0.5, 0, 1, 'Transparansi pola')
  const patternSize = readNumber(pattern.size ?? 30, 14, 80, 'Ukuran pola')

  for (const result of [patternColor, patternOpacity, patternSize]) {
    if (result.error) return result
  }

  cfg.pattern = {
    type: pattern.type ?? 'none',
    color: patternColor.value,
    opacity: patternOpacity.value,
    size: patternSize.value,
  }

  // Bingkai tepi strip
  const border = config.border || {}
  if (!BORDER_STYLES.includes(border.style ?? 'none')) return fail('Jenis bingkai tidak valid')

  const borderColor = readHex(border.color ?? '#ffffff', 'Warna bingkai')
  if (borderColor.error) return borderColor

  cfg.border = { style: border.style ?? 'none', color: borderColor.value }
  if (cfg.border.style === 'film') cfg.border.holeColor = out.background

  // Bingkai foto
  const frame = config.photoFrame || {}
  const frameColor = readHex(frame.color ?? '#ffffff', 'Warna bingkai foto')
  const frameRadius = readNumber(frame.radius ?? 14, 0, 40, 'Sudut foto', { integer: true })
  const frameMatting = readNumber(frame.matting ?? 10, 0, 24, 'Tebal bingkai foto', { integer: true })

  for (const result of [frameColor, frameRadius, frameMatting]) {
    if (result.error) return result
  }

  cfg.photoFrame = { color: frameColor.value, radius: frameRadius.value, matting: frameMatting.value }

  if (frame.stroke) {
    const stroke = readHex(frame.stroke, 'Garis foto')
    if (stroke.error) return stroke
    cfg.photoFrame.stroke = stroke.value
  }

  // Stiker acak
  const scatter = config.scatter || {}
  const types = Array.isArray(scatter.types) ? scatter.types : []

  if (types.length > 8 || types.some((type) => !STICKER_TYPES.includes(type))) {
    return fail('Jenis stiker tidak valid (maksimal 8)')
  }

  const colors = Array.isArray(scatter.colors) ? scatter.colors : []

  if (colors.length > 6) return fail('Warna stiker maksimal 6')

  const colorList = []

  for (const color of colors) {
    const parsed = readHex(color, 'Warna stiker')
    if (parsed.error) return parsed
    colorList.push(parsed.value)
  }

  const count = readNumber(scatter.count ?? 0, 0, 60, 'Jumlah stiker', { integer: true })
  const seed = readNumber(scatter.seed ?? 1, 1, 9999, 'Seed stiker', { integer: true })

  for (const result of [count, seed]) {
    if (result.error) return result
  }

  cfg.scatter = {
    types,
    colors: colorList,
    count: types.length === 0 ? 0 : count.value,
    size: [26, 46],
    seed: seed.value,
    sides: true,
  }

  // Stiker di sudut foto
  const corners = Array.isArray(config.photoCorners) ? config.photoCorners : []

  if (corners.length > 4) return fail('Stiker sudut maksimal 4')

  cfg.photoCorners = []

  for (const corner of corners) {
    if (!CORNERS.includes(corner?.corner)) return fail('Posisi stiker sudut tidak valid')
    if (!STICKER_TYPES.includes(corner?.type)) return fail('Jenis stiker sudut tidak valid')

    const color = readHex(corner.color ?? '#ff6fa3', 'Warna stiker sudut')
    const size = readNumber(corner.size ?? 64, 20, 120, 'Ukuran stiker sudut')
    const rotate = readNumber(corner.rotate ?? 0, -45, 45, 'Rotasi stiker sudut')

    for (const result of [color, size, rotate]) {
      if (result.error) return result
    }

    cfg.photoCorners.push({
      corner: corner.corner,
      type: corner.type,
      size: size.value,
      color: color.value,
      rotate: rotate.value,
    })
  }

  out.config = cfg

  return { value: out }
}
import { drawSticker, shade } from './stickers.js'

// Ukuran photostrip untuk template berbasis config (satuan: piksel)
export const STRIP = {
  width: 720,
  padding: 56,
  headerHeight: 160,
  photoHeight: 400,
  gap: 40,
  footerHeight: 130,
  count: 4,
}

STRIP.photoWidth = STRIP.width - STRIP.padding * 2
STRIP.height =
  STRIP.padding * 2 +
  STRIP.headerHeight +
  STRIP.count * STRIP.photoHeight +
  (STRIP.count - 1) * STRIP.gap +
  STRIP.footerHeight

function photoY(index) {
  return STRIP.padding + STRIP.headerHeight + index * (STRIP.photoHeight + STRIP.gap)
}

function mulberry32(seed) {
  let a = seed >>> 0

  return function random() {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function roundedRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2)

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawPattern(ctx, pattern, width, height) {
  if (!pattern || pattern.type === 'none') return

  const color = pattern.color || '#ffffff'
  const size = pattern.size || 30

  ctx.save()
  ctx.globalAlpha = pattern.opacity ?? 0.5
  ctx.fillStyle = color
  ctx.strokeStyle = color

  if (pattern.type === 'dots') {
    for (let y = size / 2, row = 0; y < height + size; y += size, row += 1) {
      for (let x = (row % 2) * (size / 2); x < width + size; x += size) {
        ctx.beginPath()
        ctx.arc(x, y, size * 0.16, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (pattern.type === 'stripes') {
    ctx.lineWidth = size * 0.45
    for (let offset = -height; offset < width + height; offset += size * 1.2) {
      ctx.beginPath()
      ctx.moveTo(offset, 0)
      ctx.lineTo(offset + height, height)
      ctx.stroke()
    }
  } else if (pattern.type === 'checker') {
    for (let y = 0, row = 0; y < height; y += size, row += 1) {
      for (let x = 0, col = 0; x < width; x += size, col += 1) {
        if ((row + col) % 2 === 0) ctx.fillRect(x, y, size, size)
      }
    }
  } else if (pattern.type === 'gingham') {
    ctx.globalAlpha = (pattern.opacity ?? 0.5) * 0.5
    for (let x = 0; x < width; x += size * 2) ctx.fillRect(x, 0, size, height)
    for (let y = 0; y < height; y += size * 2) ctx.fillRect(0, y, width, size)
  } else if (pattern.type === 'grid') {
    ctx.lineWidth = 1.5
    for (let x = 0; x <= width; x += size) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += size) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  } else if (pattern.type === 'stars') {
    ctx.globalAlpha = 1
    for (let y = size / 2, row = 0; y < height; y += size * 1.4, row += 1) {
      for (let x = (row % 2) * size * 0.7; x < width; x += size * 1.4) {
        ctx.save()
        ctx.globalAlpha = pattern.opacity ?? 0.5
        ctx.translate(x, y)
        ctx.beginPath()
        ctx.moveTo(0, -size * 0.18)
        ctx.quadraticCurveTo(size * 0.03, -size * 0.03, size * 0.18, 0)
        ctx.quadraticCurveTo(size * 0.03, size * 0.03, 0, size * 0.18)
        ctx.quadraticCurveTo(-size * 0.03, size * 0.03, -size * 0.18, 0)
        ctx.quadraticCurveTo(-size * 0.03, -size * 0.03, 0, -size * 0.18)
        ctx.fill()
        ctx.restore()
      }
    }
  }

  ctx.restore()
}

function drawBorder(ctx, border, width, height) {
  if (!border || border.style === 'none') return

  const color = border.color || '#ffffff'

  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color

  if (border.style === 'scallop') {
    const radius = 15

    for (let x = 0; x <= width + radius; x += radius * 2) {
      ctx.beginPath()
      ctx.arc(x, 0, radius, 0, Math.PI * 2)
      ctx.arc(x, height, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    for (let y = 0; y <= height + radius; y += radius * 2) {
      ctx.beginPath()
      ctx.arc(0, y, radius, 0, Math.PI * 2)
      ctx.arc(width, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (border.style === 'dashed') {
    ctx.lineWidth = 5
    ctx.setLineDash([16, 11])
    ctx.lineCap = 'round'
    ctx.strokeRect(20, 20, width - 40, height - 40)
  } else if (border.style === 'double') {
    ctx.lineWidth = 6
    ctx.strokeRect(16, 16, width - 32, height - 32)
    ctx.lineWidth = 2.5
    ctx.strokeRect(30, 30, width - 60, height - 60)
  } else if (border.style === 'solid') {
    ctx.lineWidth = 12
    ctx.strokeRect(10, 10, width - 20, height - 20)
  } else if (border.style === 'film') {
    const band = 40

    ctx.fillRect(0, 0, band, height)
    ctx.fillRect(width - band, 0, band, height)

    ctx.fillStyle = border.holeColor || '#f4ead2'

    for (let y = 18; y < height - 10; y += 38) {
      roundedRect(ctx, 11, y, 18, 22, 5)
      ctx.fill()
      roundedRect(ctx, width - 29, y, 18, 22, 5)
      ctx.fill()
    }
  }

  ctx.restore()
}

function scatterStickers(ctx, scatter, width, height) {
  if (!scatter || !scatter.types?.length) return

  const random = mulberry32(scatter.seed ?? 1)
  const colors = scatter.colors?.length ? scatter.colors : ['#ff7aa8']
  const count = scatter.count ?? 24
  const [minSize, maxSize] = scatter.size ?? [26, 46]

  // Area kosong di sekitar foto: sisi kiri/kanan, header, footer, dan sela antar foto
  const sideWeight = scatter.sides === false ? 0 : 4

  const zones = [
    { x: [10, STRIP.padding - 8], y: [30, height - 30], weight: sideWeight },
    { x: [width - STRIP.padding + 8, width - 10], y: [30, height - 30], weight: sideWeight },
    { x: [70, 160], y: [24, STRIP.padding + 130], weight: 1 },
    { x: [width - 160, width - 70], y: [24, STRIP.padding + 130], weight: 1 },
    { x: [70, 170], y: [height - STRIP.padding - 110, height - 24], weight: 1.5 },
    { x: [width - 170, width - 70], y: [height - STRIP.padding - 110, height - 24], weight: 1.5 },
  ]

  for (let i = 0; i < STRIP.count - 1; i += 1) {
    const y = photoY(i) + STRIP.photoHeight

    zones.push({ x: [90, width - 90], y: [y + 6, y + STRIP.gap - 6], weight: 1 })
  }

  const totalWeight = zones.reduce((sum, zone) => sum + zone.weight, 0)

  for (let i = 0; i < count; i += 1) {
    let pick = random() * totalWeight
    let zone = zones[0]

    for (const candidate of zones) {
      pick -= candidate.weight
      if (pick <= 0) {
        zone = candidate
        break
      }
    }

    const inGap = zone.y[1] - zone.y[0] < STRIP.gap
    const size = (minSize + random() * (maxSize - minSize)) * (inGap ? 0.55 : 1)
    const x = zone.x[0] + random() * (zone.x[1] - zone.x[0])
    const y = zone.y[0] + random() * (zone.y[1] - zone.y[0])
    const type = scatter.types[Math.floor(random() * scatter.types.length)]
    const color = colors[Math.floor(random() * colors.length)]

    drawSticker(ctx, type, x, y, size, color, (random() - 0.5) * 50)
  }
}

function photoCornerStickers(ctx, corners, index) {
  if (!corners) return

  const x = STRIP.padding
  const y = photoY(index)
  const right = x + STRIP.photoWidth
  const bottom = y + STRIP.photoHeight

  const anchors = {
    tl: [x + 6, y + 6],
    tr: [right - 6, y + 6],
    bl: [x + 6, bottom - 6],
    br: [right - 6, bottom - 6],
  }

  corners.forEach((corner) => {
    const anchor = anchors[corner.corner]

    if (!anchor) return

    drawSticker(
      ctx,
      corner.type,
      anchor[0],
      anchor[1],
      corner.size ?? 64,
      corner.color,
      corner.rotate ?? 0
    )
  })
}

function drawPlaceholder(ctx, x, y, w, h, template) {
  const gradient = ctx.createLinearGradient(x, y, x, y + h)

  gradient.addColorStop(0, shade(template.accent, 55))
  gradient.addColorStop(1, shade(template.accent, 20))
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.beginPath()
  ctx.arc(x + w / 2, y + h * 0.42, h * 0.17, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h * 1.0, h * 0.34, h * 0.4, 0, Math.PI, 0)
  ctx.fill()
}

// images: array Image (foto asli) atau null (untuk thumbnail contoh)
export function renderStrip({ images = null, template, scale = 1 }) {
  const config = template.config || {}
  const { width, height, padding, photoWidth, photoHeight } = STRIP

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)

  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Tidak dapat membuat photostrip.')

  ctx.scale(scale, scale)

  const textColor = config.textColor || '#49353d'
  const frame = config.photoFrame || {}

  // Latar dan pola
  ctx.fillStyle = template.background
  ctx.fillRect(0, 0, width, height)
  drawPattern(ctx, config.pattern, width, height)
  drawBorder(ctx, config.border, width, height)

  // Header
  ctx.textAlign = 'center'
  ctx.fillStyle = template.accent
  ctx.font = 'bold 23px Arial'
  ctx.fillText('J E P R E T . I N', width / 2, padding + 24)

  ctx.fillStyle = textColor
  ctx.font = 'bold 36px Georgia'
  ctx.fillText(template.name, width / 2, padding + 72)

  ctx.fillStyle = template.accent
  ctx.font = 'bold 13px Arial'
  ctx.fillText(template.tag || '', width / 2, padding + 104)

  ctx.font = '22px Georgia'
  ctx.fillText(template.decoration || '', width / 2, padding + 138)

  // Foto
  for (let index = 0; index < STRIP.count; index += 1) {
    const x = padding
    const y = photoY(index)
    const radius = frame.radius ?? 14
    const matting = frame.matting ?? 10

    ctx.save()
    ctx.shadowColor = 'rgba(40, 20, 30, 0.25)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 5
    ctx.fillStyle = frame.color || '#ffffff'
    roundedRect(
      ctx,
      x - matting,
      y - matting,
      photoWidth + matting * 2,
      photoHeight + matting * 2,
      radius + matting / 2
    )
    ctx.fill()
    ctx.restore()

    ctx.save()
    roundedRect(ctx, x, y, photoWidth, photoHeight, radius)
    ctx.clip()

    if (images && images[index]) {
      const image = images[index]
      const fit = Math.max(photoWidth / image.width, photoHeight / image.height)
      const drawWidth = image.width * fit
      const drawHeight = image.height * fit

      ctx.drawImage(
        image,
        x + (photoWidth - drawWidth) / 2,
        y + (photoHeight - drawHeight) / 2,
        drawWidth,
        drawHeight
      )
    } else {
      drawPlaceholder(ctx, x, y, photoWidth, photoHeight, template)
    }

    ctx.restore()

    if (frame.stroke) {
      ctx.strokeStyle = frame.stroke
      ctx.lineWidth = 4
      roundedRect(ctx, x, y, photoWidth, photoHeight, radius)
      ctx.stroke()
    }
  }

  // Stiker acak di area kosong, lalu stiker di sudut foto (paling atas)
  scatterStickers(ctx, config.scatter, width, height)

  for (let index = 0; index < STRIP.count; index += 1) {
    photoCornerStickers(ctx, config.photoCorners, index)
  }

  // Footer
  ctx.textAlign = 'center'
  ctx.fillStyle = textColor
  ctx.font = 'italic 26px Georgia'
  ctx.fillText(config.tagline || 'our little moments', width / 2, height - padding - 58)

  ctx.fillStyle = template.accent
  ctx.font = '17px Arial'
  ctx.fillText(
    images
      ? new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'jepret.in',
    width / 2,
    height - padding - 24
  )

  return canvas
}

export async function buildConfiguredPhotostrip(photos, template) {
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = src
    })
  }

  let images

  try {
    images = await Promise.all(photos.map(loadImage))
  } catch {
    throw new Error('Photostrip gagal dibuat. Silakan ulangi sesi foto.')
  }

  return renderStrip({ images, template }).toDataURL('image/png')
}
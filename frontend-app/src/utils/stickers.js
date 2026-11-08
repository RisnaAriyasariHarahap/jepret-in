// Stiker vektor yang digambar langsung di canvas (tanpa file gambar).
// size = diameter kasar stiker dalam piksel.

function circle(ctx, x, y, radius) {
  ctx.moveTo(x + radius, y)
  ctx.arc(x, y, radius, 0, Math.PI * 2)
}

function ellipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.moveTo(x + Math.cos(rotation) * rx, y + Math.sin(rotation) * rx)
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2)
}

export function shade(hex, amount) {
  const value = String(hex || '#888888').replace('#', '')
  const full =
    value.length === 3
      ? value.split('').map((char) => char + char).join('')
      : value.padEnd(6, '8').slice(0, 6)

  const channels = [0, 2, 4].map((start) => {
    const channel = parseInt(full.slice(start, start + 2), 16)
    const next = amount >= 0
      ? channel + (255 - channel) * (amount / 100)
      : channel * (1 + amount / 100)

    return Math.max(0, Math.min(255, Math.round(next)))
  })

  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
}

const STICKERS = {
  heart: {
    path(ctx, r) {
      ctx.moveTo(0, r * 0.9)
      ctx.bezierCurveTo(-r * 1.3, r * 0.1, -r * 0.9, -r * 0.9, 0, -r * 0.4)
      ctx.bezierCurveTo(r * 0.9, -r * 0.9, r * 1.3, r * 0.1, 0, r * 0.9)
    },
    details(ctx, r) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.beginPath()
      ellipse(ctx, -r * 0.45, -r * 0.3, r * 0.18, r * 0.1, -0.6)
      ctx.fill()
    },
  },

  star: {
    path(ctx, r) {
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5
        const radius = i % 2 === 0 ? r : r * 0.45
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
    },
    details(ctx, r) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.beginPath()
      circle(ctx, -r * 0.1, -r * 0.2, r * 0.12)
      ctx.fill()
    },
  },

  sparkle: {
    path(ctx, r) {
      ctx.moveTo(0, -r)
      ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0)
      ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r)
      ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0)
      ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r)
    },
  },

  bow: {
    path(ctx, r) {
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(-r * 0.4, -r * 0.9, -r * 1.1, -r * 0.8, -r * 1.1, 0)
      ctx.bezierCurveTo(-r * 1.1, r * 0.8, -r * 0.4, r * 0.9, 0, 0)
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(r * 0.4, -r * 0.9, r * 1.1, -r * 0.8, r * 1.1, 0)
      ctx.bezierCurveTo(r * 1.1, r * 0.8, r * 0.4, r * 0.9, 0, 0)
      ctx.moveTo(-r * 0.1, r * 0.15)
      ctx.lineTo(-r * 0.6, r * 0.98)
      ctx.lineTo(-r * 0.15, r * 0.82)
      ctx.lineTo(0, r * 0.3)
      ctx.moveTo(r * 0.1, r * 0.15)
      ctx.lineTo(r * 0.6, r * 0.98)
      ctx.lineTo(r * 0.15, r * 0.82)
      ctx.lineTo(0, r * 0.3)
    },
    details(ctx, r, color, dark) {
      ctx.fillStyle = dark
      ctx.beginPath()
      ellipse(ctx, 0, 0, r * 0.24, r * 0.28)
      ctx.fill()
      ctx.strokeStyle = dark
      ctx.lineWidth = Math.max(1, r * 0.06)
      ctx.beginPath()
      ctx.moveTo(-r * 0.75, -r * 0.35)
      ctx.quadraticCurveTo(-r * 0.55, 0, -r * 0.75, r * 0.35)
      ctx.moveTo(r * 0.75, -r * 0.35)
      ctx.quadraticCurveTo(r * 0.55, 0, r * 0.75, r * 0.35)
      ctx.stroke()
    },
  },

  flower: {
    path(ctx, r) {
      for (let i = 0; i < 5; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI * 2) / 5
        circle(ctx, Math.cos(angle) * r * 0.55, Math.sin(angle) * r * 0.55, r * 0.45)
      }
    },
    details(ctx, r) {
      ctx.fillStyle = '#ffd95a'
      ctx.beginPath()
      circle(ctx, 0, 0, r * 0.28)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      circle(ctx, -r * 0.08, -r * 0.08, r * 0.09)
      ctx.fill()
    },
  },

  daisy: {
    path(ctx, r) {
      for (let i = 0; i < 8; i += 1) {
        const angle = (i * Math.PI * 2) / 8
        ellipse(ctx, Math.cos(angle) * r * 0.62, Math.sin(angle) * r * 0.62, r * 0.38, r * 0.2, angle)
      }
    },
    details(ctx, r) {
      ctx.fillStyle = '#f7b500'
      ctx.beginPath()
      circle(ctx, 0, 0, r * 0.3)
      ctx.fill()
    },
  },

  cloud: {
    path(ctx, r) {
      circle(ctx, -r * 0.5, r * 0.15, r * 0.45)
      circle(ctx, -r * 0.05, -r * 0.2, r * 0.6)
      circle(ctx, r * 0.5, r * 0.15, r * 0.45)
      ctx.rect(-r * 0.5, r * 0.1, r, r * 0.5)
    },
    details(ctx, r) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.beginPath()
      ellipse(ctx, -r * 0.1, -r * 0.35, r * 0.25, r * 0.12, -0.4)
      ctx.fill()
    },
  },

  moon: {
    path(ctx, r) {
      ctx.moveTo(r * 0.2, -r)
      ctx.bezierCurveTo(-r * 1.1, -r * 0.7, -r * 1.1, r * 0.7, r * 0.2, r)
      ctx.bezierCurveTo(-r * 0.5, r * 0.6, -r * 0.5, -r * 0.6, r * 0.2, -r)
    },
  },

  butterfly: {
    path(ctx, r) {
      ellipse(ctx, -r * 0.5, -r * 0.3, r * 0.5, r * 0.65, -0.5)
      ellipse(ctx, r * 0.5, -r * 0.3, r * 0.5, r * 0.65, 0.5)
      ellipse(ctx, -r * 0.38, r * 0.5, r * 0.36, r * 0.46, 0.5)
      ellipse(ctx, r * 0.38, r * 0.5, r * 0.36, r * 0.46, -0.5)
    },
    details(ctx, r, color, dark) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.beginPath()
      circle(ctx, -r * 0.55, -r * 0.35, r * 0.17)
      circle(ctx, r * 0.55, -r * 0.35, r * 0.17)
      ctx.fill()
      ctx.fillStyle = dark
      ctx.beginPath()
      ellipse(ctx, 0, 0.05 * r, r * 0.09, r * 0.62)
      ctx.fill()
      ctx.strokeStyle = dark
      ctx.lineWidth = Math.max(1, r * 0.05)
      ctx.beginPath()
      ctx.moveTo(0, -r * 0.55)
      ctx.quadraticCurveTo(-r * 0.15, -r * 0.95, -r * 0.4, -r * 0.95)
      ctx.moveTo(0, -r * 0.55)
      ctx.quadraticCurveTo(r * 0.15, -r * 0.95, r * 0.4, -r * 0.95)
      ctx.stroke()
    },
  },

  cherry: {
    path(ctx, r) {
      circle(ctx, -r * 0.4, r * 0.42, r * 0.42)
      circle(ctx, r * 0.42, r * 0.52, r * 0.42)
    },
    details(ctx, r) {
      ctx.strokeStyle = '#4b8b4b'
      ctx.lineWidth = Math.max(1.5, r * 0.08)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-r * 0.4, r * 0.05)
      ctx.quadraticCurveTo(-r * 0.2, -r * 0.7, r * 0.1, -r * 0.85)
      ctx.moveTo(r * 0.42, r * 0.12)
      ctx.quadraticCurveTo(r * 0.3, -r * 0.6, r * 0.1, -r * 0.85)
      ctx.stroke()
      ctx.fillStyle = '#62ad5c'
      ctx.beginPath()
      ellipse(ctx, r * 0.4, -r * 0.8, r * 0.34, r * 0.15, -0.3)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      circle(ctx, -r * 0.52, r * 0.3, r * 0.1)
      circle(ctx, r * 0.3, r * 0.4, r * 0.1)
      ctx.fill()
    },
  },

  smiley: {
    path(ctx, r) {
      circle(ctx, 0, 0, r)
    },
    details(ctx, r, color, dark) {
      ctx.fillStyle = dark
      ctx.beginPath()
      circle(ctx, -r * 0.33, -r * 0.2, r * 0.11)
      circle(ctx, r * 0.33, -r * 0.2, r * 0.11)
      ctx.fill()
      ctx.strokeStyle = dark
      ctx.lineWidth = Math.max(1.5, r * 0.1)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(0, r * 0.05, r * 0.5, 0.2 * Math.PI, 0.8 * Math.PI)
      ctx.stroke()
    },
  },

  lightning: {
    path(ctx, r) {
      ctx.moveTo(r * 0.1, -r)
      ctx.lineTo(-r * 0.55, r * 0.1)
      ctx.lineTo(-r * 0.05, r * 0.1)
      ctx.lineTo(-r * 0.25, r)
      ctx.lineTo(r * 0.6, -r * 0.2)
      ctx.lineTo(r * 0.05, -r * 0.2)
      ctx.closePath()
    },
  },

  sun: {
    path(ctx, r) {
      circle(ctx, 0, 0, r * 0.55)
      for (let i = 0; i < 8; i += 1) {
        const angle = (i * Math.PI * 2) / 8
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        ctx.moveTo(cos * r * 0.68 - sin * r * 0.14, sin * r * 0.68 + cos * r * 0.14)
        ctx.lineTo(cos * r, sin * r)
        ctx.lineTo(cos * r * 0.68 + sin * r * 0.14, sin * r * 0.68 - cos * r * 0.14)
      }
    },
    details(ctx, r) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      circle(ctx, -r * 0.15, -r * 0.15, r * 0.14)
      ctx.fill()
    },
  },

  leaf: {
    path(ctx, r) {
      ctx.moveTo(0, -r)
      ctx.bezierCurveTo(r * 0.9, -r * 0.4, r * 0.9, r * 0.5, 0, r)
      ctx.bezierCurveTo(-r * 0.9, r * 0.5, -r * 0.9, -r * 0.4, 0, -r)
    },
    details(ctx, r, color, dark) {
      ctx.strokeStyle = dark
      ctx.lineWidth = Math.max(1, r * 0.07)
      ctx.beginPath()
      ctx.moveTo(0, -r * 0.8)
      ctx.lineTo(0, r * 0.85)
      ctx.stroke()
    },
  },
}

export const stickerTypes = Object.keys(STICKERS)

export function drawSticker(ctx, type, x, y, size, color = '#ff7aa8', rotation = 0) {
  const sticker = STICKERS[type]

  if (!sticker) return

  const r = size / 2
  const dark = shade(color, -35)

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  ctx.beginPath()
  sticker.path(ctx, r)

  ctx.shadowColor = 'rgba(60, 30, 40, 0.22)'
  ctx.shadowBlur = Math.max(3, r * 0.2)
  ctx.shadowOffsetY = Math.max(1, r * 0.06)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(3, r * 0.3)
  ctx.stroke()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = color
  ctx.fill()

  if (sticker.details) sticker.details(ctx, r, color, dark)

  ctx.restore()
}
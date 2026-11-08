import { buildConfiguredPhotostrip } from './stripRenderer.js'

export function drawDecoration(context, template, width, height) {
  const accent = template.accent
  const kind = template.className

  context.save()
  context.strokeStyle = accent
  context.fillStyle = accent
  context.globalAlpha = 0.8
  context.lineWidth = 3

  function heart(x, y, size = 24) {
    context.save()
    context.translate(x, y)
    context.scale(size / 30, size / 30)
    context.beginPath()
    context.moveTo(0, 10)
    context.bezierCurveTo(-28, -8, -15, -25, 0, -12)
    context.bezierCurveTo(15, -25, 28, -8, 0, 10)
    context.stroke()
    context.restore()
  }

  function sparkle(x, y, size = 8) {
    context.beginPath()
    context.moveTo(x - size, y)
    context.lineTo(x + size, y)
    context.moveTo(x, y - size)
    context.lineTo(x, y + size)
    context.stroke()
  }

  function star(x, y, radius = 12) {
    context.beginPath()

    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 === 0 ? radius : radius * 0.42
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r

      if (i === 0) context.moveTo(px, py)
      else context.lineTo(px, py)
    }

    context.closePath()
    context.stroke()
  }

  if (kind === 'birthday') {
    heart(65, 80, 28)
    heart(width - 65, 80, 28)
    sparkle(width / 2, 95, 12)
    star(110, 120, 8)
    star(width - 110, 120, 8)
  } else if (kind === 'graduation') {
    context.beginPath()
    context.moveTo(50, 80)
    context.lineTo(90, 60)
    context.lineTo(130, 80)
    context.lineTo(90, 100)
    context.closePath()
    context.stroke()
    star(width - 75, 80, 15)
    sparkle(145, 105, 8)
  } else if (kind === 'friendship') {
    heart(65, 80, 30)
    heart(width - 65, 80, 30)
    sparkle(width / 2, 80, 10)
    sparkle(125, 115, 8)
    sparkle(width - 125, 115, 8)
  } else if (kind === 'couple') {
    heart(70, 80, 32)
    heart(width - 70, 80, 32)
    heart(width / 2, 100, 20)
  } else if (kind === 'wedding') {
    heart(70, 80, 26)
    heart(width - 70, 80, 26)
    sparkle(width / 2, 75, 10)
    context.beginPath()
    context.moveTo(35, 125)
    context.quadraticCurveTo(width / 2, 145, width - 35, 125)
    context.stroke()
  } else if (kind === 'travel') {
    context.save()
    context.translate(80, 80)
    context.rotate(-0.3)
    context.beginPath()
    context.moveTo(-20, 0)
    context.lineTo(22, 0)
    context.lineTo(7, -8)
    context.moveTo(0, 0)
    context.lineTo(-7, -18)
    context.lineTo(8, 0)
    context.lineTo(0, 18)
    context.stroke()
    context.restore()

    context.setLineDash([5, 6])
    context.beginPath()
    context.moveTo(115, 115)
    context.quadraticCurveTo(width / 2, 145, width - 115, 105)
    context.stroke()
    context.setLineDash([])
    sparkle(width - 75, 80, 10)
  } else {
    context.globalAlpha = 0.5
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(55, 80)
    context.lineTo(110, 80)
    context.moveTo(width - 110, 80)
    context.lineTo(width - 55, 80)
    context.stroke()
    sparkle(width / 2, 80, 5)
  }

  if (kind === 'birthday' || kind === 'friendship') {
    sparkle(95, height - 55, 9)
    sparkle(width - 95, height - 55, 9)
  } else if (kind === 'couple' || kind === 'wedding') {
    heart(95, height - 55, 22)
    heart(width - 95, height - 55, 22)
  } else if (kind === 'graduation') {
    star(95, height - 55, 12)
    star(width - 95, height - 55, 12)
  } else if (kind === 'travel') {
    sparkle(95, height - 55, 9)
    sparkle(width - 95, height - 55, 9)
  }

  context.restore()
}

export async function buildPhotostrip(photos, template) {
  if (template.config) {
    return buildConfiguredPhotostrip(photos, template)
  }
  
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Tidak dapat membuat photostrip.')
  }

  const width = 720
  const padding = 32
  const headerHeight = 155
  const photoHeight = 440
  const gap = 18
  const footerHeight = 115
  const photoWidth = width - padding * 2

  canvas.width = width
  canvas.height =
    padding +
    headerHeight +
    photos.length * photoHeight +
    (photos.length - 1) * gap +
    footerHeight +
    padding

  context.fillStyle = template.background
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = template.accent
  context.globalAlpha = 0.35
  context.lineWidth = 2
  context.strokeRect(18, 18, width - 36, canvas.height - 36)
  context.globalAlpha = 1

  drawDecoration(context, template, width, canvas.height)

  context.textAlign = 'center'
  context.fillStyle = template.accent
  context.font = 'bold 23px Arial'
  context.fillText('J E P R E T . I N', width / 2, padding + 31)

  context.fillStyle = '#49353d'
  context.font = 'bold 33px Georgia'
  context.fillText(template.name, width / 2, padding + 76)

  context.fillStyle = template.accent
  context.font = 'bold 13px Arial'
  context.fillText(template.tag, width / 2, padding + 105)

  context.font = '22px Georgia'
  context.fillText(template.decoration, width / 2, padding + 135)

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

  images.forEach((image, index) => {
    const x = padding
    const y = padding + headerHeight + index * (photoHeight + gap)

    context.save()
    context.shadowColor = `${template.accent}55`
    context.shadowBlur = 8
    context.shadowOffsetY = 3
    context.fillStyle = '#ffffff'
    context.fillRect(x - 4, y - 4, photoWidth + 8, photoHeight + 8)
    context.restore()

    const scale = Math.max(
      photoWidth / image.width,
      photoHeight / image.height
    )

    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    const drawX = x + (photoWidth - drawWidth) / 2
    const drawY = y + (photoHeight - drawHeight) / 2

    context.save()
    context.beginPath()
    context.rect(x, y, photoWidth, photoHeight)
    context.clip()
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
    context.restore()

    context.strokeStyle = template.accent
    context.globalAlpha = 0.65
    context.lineWidth = 3
    context.strokeRect(x, y, photoWidth, photoHeight)
    context.globalAlpha = 1

    context.fillStyle = template.background
    context.fillRect(width - padding - 42, y + photoHeight - 31, 34, 22)

    context.fillStyle = template.accent
    context.font = 'bold 14px Arial'
    context.textAlign = 'center'
    context.fillText(
      String(index + 1).padStart(2, '0'),
      width - padding - 25,
      y + photoHeight - 16
    )
  })

  context.textAlign = 'center'
  context.fillStyle = '#49353d'
  context.font = 'italic 25px Georgia'
  context.fillText(
    'our little moments',
    width / 2,
    canvas.height - padding - 48
  )

  context.fillStyle = template.accent
  context.font = '17px Arial'
  context.fillText(
    new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    width / 2,
    canvas.height - padding - 18
  )

  return canvas.toDataURL('image/png')
}
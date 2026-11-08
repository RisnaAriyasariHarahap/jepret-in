import { drawSticker } from './stickers.js'

export const FILTERS = [
  { id: 'none', name: 'Tanpa', icon: '✕' },
  { id: 'glasses-round', name: 'Kacamata', icon: '👓' },
  { id: 'sunglasses', name: 'Sunglasses', icon: '🕶️' },
  { id: 'heart-glasses', name: 'Hati', icon: '💖' },
  { id: 'cat-ears', name: 'Kucing', icon: '🐱' },
  { id: 'bunny-ears', name: 'Kelinci', icon: '🐰' },
  { id: 'flower-crown', name: 'Bunga', icon: '🌸' },
  { id: 'crown', name: 'Mahkota', icon: '👑' },
  { id: 'bow-headband', name: 'Pita', icon: '🎀' },
  { id: 'blush', name: 'Blush', icon: '😊' },
]

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

let detectorPromise = null
let lastTimestamp = 0

// Memuat detektor wajah sekali saja (modul dan model hanya diunduh saat filter dipakai)
export function loadFaceDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_URL)

      const create = (delegate) =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numFaces: 4,
        })

      try {
        return await create('GPU')
      } catch {
        return create('CPU')
      }
    })().catch((error) => {
      detectorPromise = null
      throw error
    })
  }

  return detectorPromise
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function middle(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

// Mengubah landmark (0..1) menjadi ukuran-ukuran wajah dalam piksel video
export function computeFace(landmarks, width, height) {
  const point = (index) => ({
    x: landmarks[index].x * width,
    y: landmarks[index].y * height,
  })

  let eyeA = middle(point(33), point(133))
  let eyeB = middle(point(362), point(263))

  if (eyeA.x > eyeB.x) [eyeA, eyeB] = [eyeB, eyeA]

  const forehead = point(10)
  const chin = point(152)

  return {
    eyeCenter: middle(eyeA, eyeB),
    eyeDistance: distance(eyeA, eyeB),
    angle: Math.atan2(eyeB.y - eyeA.y, eyeB.x - eyeA.x),
    forehead,
    chin,
    faceWidth: distance(point(234), point(454)),
    faceHeight: distance(forehead, chin),
    cheekA: point(205),
    cheekB: point(425),
  }
}

export function detectFaces(detector, video) {
  if (!video || !video.videoWidth) return []

  lastTimestamp = Math.max(performance.now(), lastTimestamp + 1)

  const result = detector.detectForVideo(video, lastTimestamp)

  return (result.faceLandmarks || []).map((landmarks) =>
    computeFace(landmarks, video.videoWidth, video.videoHeight)
  )
}

function heartPath(ctx, x, y, size) {
  const r = size / 2

  ctx.moveTo(x, y + r * 0.9)
  ctx.bezierCurveTo(x - r * 1.3, y + r * 0.1, x - r * 0.9, y - r * 0.9, x, y - r * 0.4)
  ctx.bezierCurveTo(x + r * 0.9, y - r * 0.9, x + r * 1.3, y + r * 0.1, x, y + r * 0.9)
}

function drawBand(ctx, W, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = W * 0.045
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-W * 0.47, W * 0.02)
  ctx.quadraticCurveTo(0, -W * 0.3, W * 0.47, W * 0.02)
  ctx.stroke()
  ctx.restore()
}

function drawGlasses(ctx, face, kind) {
  const d = face.eyeDistance
  const W = face.faceWidth
  const lensR = d * 0.36

  ctx.save()
  ctx.translate(face.eyeCenter.x, face.eyeCenter.y)
  ctx.rotate(face.angle)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // gagang kacamata
  ctx.strokeStyle = kind === 'heart' ? '#ff3d85' : '#2c2226'
  ctx.lineWidth = W * 0.03
  ctx.beginPath()
  ctx.moveTo(-d / 2 - lensR, 0)
  ctx.lineTo(-W * 0.52, W * 0.04)
  ctx.moveTo(d / 2 + lensR, 0)
  ctx.lineTo(W * 0.52, W * 0.04)
  ctx.stroke()

  if (kind === 'round') {
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = W * 0.028

    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(side * d / 2, 0, lensR, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.moveTo(-d / 2 + lensR, 0)
    ctx.quadraticCurveTo(0, -lensR * 0.45, d / 2 - lensR, 0)
    ctx.stroke()
  } else if (kind === 'sun') {
    const lensW = lensR * 2.15
    const lensH = lensR * 1.6

    for (const side of [-1, 1]) {
      const x = side * d / 2 - lensW / 2
      const y = -lensH / 2

      ctx.beginPath()
      ctx.moveTo(x + lensR * 0.3, y)
      ctx.lineTo(x + lensW - lensR * 0.3, y)
      ctx.quadraticCurveTo(x + lensW, y, x + lensW, y + lensR * 0.4)
      ctx.lineTo(x + lensW - lensR * 0.2, y + lensH - lensR * 0.5)
      ctx.quadraticCurveTo(x + lensW - lensR * 0.5, y + lensH, x + lensW * 0.5, y + lensH)
      ctx.quadraticCurveTo(x + lensR * 0.5, y + lensH, x + lensR * 0.2, y + lensH - lensR * 0.5)
      ctx.lineTo(x, y + lensR * 0.4)
      ctx.quadraticCurveTo(x, y, x + lensR * 0.3, y)
      ctx.closePath()
      ctx.fillStyle = 'rgba(18, 18, 28, 0.9)'
      ctx.fill()

      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.beginPath()
      ctx.moveTo(x + lensW * 0.18, y + lensH * 0.2)
      ctx.lineTo(x + lensW * 0.42, y + lensH * 0.2)
      ctx.lineTo(x + lensW * 0.26, y + lensH * 0.65)
      ctx.lineTo(x + lensW * 0.12, y + lensH * 0.65)
      ctx.closePath()
      ctx.fill()
    }

    ctx.lineWidth = W * 0.04
    ctx.beginPath()
    ctx.moveTo(-d / 2 + lensR * 1.0, -lensH * 0.2)
    ctx.quadraticCurveTo(0, -lensR * 0.7, d / 2 - lensR * 1.0, -lensH * 0.2)
    ctx.stroke()
  } else {
    for (const side of [-1, 1]) {
      ctx.beginPath()
      heartPath(ctx, side * d / 2, lensR * 0.05, lensR * 2.5)
      ctx.fillStyle = 'rgba(255, 105, 160, 0.5)'
      ctx.fill()
      ctx.lineWidth = W * 0.028
      ctx.stroke()
    }
  }

  ctx.restore()
}

function drawEars(ctx, face, kind) {
  const W = face.faceWidth

  ctx.save()
  ctx.translate(face.forehead.x, face.forehead.y)
  ctx.rotate(face.angle)
  ctx.lineJoin = 'round'

  if (kind === 'cat') {
    drawBand(ctx, W, '#34343f')

    for (const side of [-1, 1]) {
      ctx.fillStyle = '#34343f'
      ctx.beginPath()
      ctx.moveTo(side * W * 0.1, -W * 0.02)
      ctx.lineTo(side * W * 0.47, -W * 0.03)
      ctx.lineTo(side * W * 0.42, -W * 0.38)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#ff9fbd'
      ctx.beginPath()
      ctx.moveTo(side * W * 0.2, -W * 0.05)
      ctx.lineTo(side * W * 0.4, -W * 0.06)
      ctx.lineTo(side * W * 0.38, -W * 0.26)
      ctx.closePath()
      ctx.fill()
    }
  } else {
    drawBand(ctx, W, '#ffb3c9')

    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * W * 0.2, -W * 0.5)
      ctx.rotate(side * 0.14)

      ctx.fillStyle = '#fdf6f8'
      ctx.strokeStyle = '#ffb3c9'
      ctx.lineWidth = W * 0.02
      ctx.beginPath()
      ctx.ellipse(0, 0, W * 0.11, W * 0.38, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#ffc2d4'
      ctx.beginPath()
      ctx.ellipse(0, W * 0.03, W * 0.06, W * 0.27, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.restore()
}

function drawFlowerCrown(ctx, face) {
  const W = face.faceWidth
  const colors = ['#ff8fb1', '#ffd166', '#ffffff', '#c9a0ff', '#ff8fb1', '#ffd166', '#c9a0ff']
  const count = 7

  ctx.save()
  ctx.translate(face.forehead.x, face.forehead.y)
  ctx.rotate(face.angle)

  const position = (t) => ({
    x: t * W * 0.5,
    y: -W * 0.0 - (1 - t * t) * W * 0.17,
  })

  for (let i = 0; i < count - 1; i += 1) {
    const mid = position(((i + 0.5) / (count - 1)) * 2 - 1)

    drawSticker(ctx, 'leaf', mid.x, mid.y + W * 0.02, W * 0.13, '#6fbf73', (i % 2 ? 70 : -70))
  }

  for (let i = 0; i < count; i += 1) {
    const spot = position((i / (count - 1)) * 2 - 1)

    drawSticker(
      ctx,
      i % 3 === 1 ? 'daisy' : 'flower',
      spot.x,
      spot.y,
      W * (i === 3 ? 0.2 : 0.16),
      colors[i],
      i * 20
    )
  }

  ctx.restore()
}

function drawCrown(ctx, face) {
  const W = face.faceWidth

  ctx.save()
  ctx.translate(face.forehead.x, face.forehead.y)
  ctx.rotate(face.angle)
  ctx.lineJoin = 'round'

  const gradient = ctx.createLinearGradient(0, -W * 0.38, 0, 0)

  gradient.addColorStop(0, '#ffe680')
  gradient.addColorStop(1, '#f0b323')

  ctx.beginPath()
  ctx.moveTo(-W * 0.32, -W * 0.02)
  ctx.lineTo(-W * 0.34, -W * 0.3)
  ctx.lineTo(-W * 0.17, -W * 0.17)
  ctx.lineTo(0, -W * 0.38)
  ctx.lineTo(W * 0.17, -W * 0.17)
  ctx.lineTo(W * 0.34, -W * 0.3)
  ctx.lineTo(W * 0.32, -W * 0.02)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#c4890f'
  ctx.lineWidth = W * 0.02
  ctx.stroke()

  const jewels = [
    [-W * 0.34, -W * 0.3, '#ff5c7c'],
    [0, -W * 0.38, '#5cc8ff'],
    [W * 0.34, -W * 0.3, '#ff5c7c'],
  ]

  jewels.forEach(([x, y, color]) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, W * 0.03, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.fillStyle = '#ff5c7c'
  ctx.beginPath()
  ctx.arc(0, -W * 0.1, W * 0.032, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawBowHeadband(ctx, face) {
  const W = face.faceWidth

  ctx.save()
  ctx.translate(face.forehead.x, face.forehead.y)
  ctx.rotate(face.angle)

  drawBand(ctx, W, '#ff8fb8')
  drawSticker(ctx, 'bow', W * 0.3, -W * 0.14, W * 0.34, '#ff6fa3', 14)
  ctx.restore()
}

function drawBlush(ctx, face) {
  const W = face.faceWidth

  for (const cheek of [face.cheekA, face.cheekB]) {
    ctx.save()
    ctx.translate(cheek.x, cheek.y)
    ctx.rotate(face.angle)

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.13)

    gradient.addColorStop(0, 'rgba(255, 90, 130, 0.5)')
    gradient.addColorStop(1, 'rgba(255, 90, 130, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(0, 0, W * 0.13, W * 0.09, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

export function drawFaceFilter(ctx, filterId, faces) {
  if (!filterId || filterId === 'none') return

  faces.forEach((face) => {
    if (filterId === 'glasses-round') drawGlasses(ctx, face, 'round')
    else if (filterId === 'sunglasses') drawGlasses(ctx, face, 'sun')
    else if (filterId === 'heart-glasses') drawGlasses(ctx, face, 'heart')
    else if (filterId === 'cat-ears') drawEars(ctx, face, 'cat')
    else if (filterId === 'bunny-ears') drawEars(ctx, face, 'bunny')
    else if (filterId === 'flower-crown') drawFlowerCrown(ctx, face)
    else if (filterId === 'crown') drawCrown(ctx, face)
    else if (filterId === 'bow-headband') drawBowHeadband(ctx, face)
    else if (filterId === 'blush') drawBlush(ctx, face)
  })
}
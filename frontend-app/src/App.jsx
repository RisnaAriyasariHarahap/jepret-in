import { useEffect, useRef, useState } from 'react'
import './App.css'

const templates = [
  {
    name: 'Birthday Babe',
    className: 'birthday',
    category: 'Birthday',
    description: 'Sweet birthday party',
    background: '#ffe4ed',
    accent: '#e8759b',
    decoration: '✦ ♡ ✦',
    tag: 'BIRTHDAY PARTY',
  },
  {
    name: 'The Graduate',
    className: 'graduation',
    category: 'Graduation',
    description: 'A golden new chapter',
    background: '#f5ead4',
    accent: '#a78143',
    decoration: '★ ✦ ★',
    tag: 'CLASS OF MEMORIES',
  },
  {
    name: 'Bestie Forever',
    className: 'friendship',
    category: 'Friendship',
    description: 'Our little chaos',
    background: '#e9e5ff',
    accent: '#8c79c6',
    decoration: '♡ ✿ ♡',
    tag: 'BEST FRIENDS',
  },
  {
    name: 'Love Notes',
    className: 'couple',
    category: 'Couple',
    description: 'Just the two of us',
    background: '#ffe5e8',
    accent: '#d85f7d',
    decoration: '♥ ♡ ♥',
    tag: 'MADE WITH LOVE',
  },
  {
    name: 'Forever Starts Here',
    className: 'wedding',
    category: 'Wedding',
    description: 'Elegant forever moments',
    background: '#f8f0df',
    accent: '#ad9360',
    decoration: '❀ ✧ ❀',
    tag: 'OUR SPECIAL DAY',
  },
  {
    name: 'Travel Diary',
    className: 'travel',
    category: 'Travel',
    description: 'Postcards from us',
    background: '#e0f0ed',
    accent: '#568c83',
    decoration: '✈ ✦ ♡',
    tag: 'LITTLE ADVENTURES',
  },
  {
    name: 'Clean Frame',
    className: 'minimalist',
    category: 'Minimalist',
    description: 'Simply your moments',
    background: '#f8f7f4',
    accent: '#77716d',
    decoration: '— ♡ —',
    tag: 'SIMPLE MOMENTS',
  },
]

const categories = [
  'Semua',
  'Birthday',
  'Graduation',
  'Friendship',
  'Couple',
  'Wedding',
  'Travel',
  'Minimalist',
]

export default function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [photos, setPhotos] = useState([])
  const [countdown, setCountdown] = useState(3)
  const [counting, setCounting] = useState(false)
  const [cameraRetry, setCameraRetry] = useState(0)
  const [finalPhoto, setFinalPhoto] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  const activeTemplate = templates[selectedTemplate]

  const visibleTemplates = templates
    .map((template, index) => ({ ...template, index }))
    .filter(
      (template) =>
        selectedCategory === 'Semua' ||
        template.category === selectedCategory
    )

  // Membuka kamera
  useEffect(() => {
    if (!cameraOpen || photos.length >= 4) return

    let cancelled = false
    let currentStream = null

    async function startCamera() {
      setCameraLoading(true)
      setCameraError('')

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Browser tidak mendukung kamera.')
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        currentStream = stream
        streamRef.current = stream

        if (!videoRef.current) {
          throw new Error('Tampilan kamera belum siap.')
        }

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        if (!cancelled) {
          setCameraLoading(false)
          setCameraError('')
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            error?.name === 'NotAllowedError'
              ? 'Akses kamera ditolak. Izinkan kamera di browser.'
              : 'Kamera tidak dapat dibuka. Periksa izin kamera dan coba lagi.'
          )
          setCameraLoading(false)
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true

      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }

      if (streamRef.current === currentStream) {
        streamRef.current = null
      }
    }
  }, [cameraOpen, cameraRetry, photos.length])

  // Hitung mundur dan ambil foto
  useEffect(() => {
    if (!counting) return

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((value) => value - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !video.videoWidth) {
      setCameraError('Kamera belum siap. Silakan coba lagi.')
      setCounting(false)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')

    if (!context) {
      setCameraError('Foto gagal diambil.')
      setCounting(false)
      return
    }

    context.save()
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.restore()

    const imageData = canvas.toDataURL('image/jpeg', 0.92)

    setPhotos((current) => [...current, imageData])
    setCounting(false)
    setCountdown(3)
  }, [counting, countdown])

  // Menghentikan kamera setelah empat foto
  useEffect(() => {
    if (photos.length !== 4 || !streamRef.current) return

    streamRef.current.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [photos])

  // Membuat dekorasi photostrip
  function drawDecoration(context, template, width, height) {
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

  // Menyusun empat foto menjadi photostrip PNG
  useEffect(() => {
    if (photos.length !== 4) {
      setFinalPhoto('')
      return
    }

    let cancelled = false

    async function createPhotostrip() {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        setCameraError('Tidak dapat membuat photostrip.')
        return
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

      context.fillStyle = activeTemplate.background
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.strokeStyle = activeTemplate.accent
      context.globalAlpha = 0.35
      context.lineWidth = 2
      context.strokeRect(18, 18, width - 36, canvas.height - 36)
      context.globalAlpha = 1

      drawDecoration(context, activeTemplate, width, canvas.height)

      context.textAlign = 'center'
      context.fillStyle = activeTemplate.accent
      context.font = 'bold 23px Arial'
      context.fillText('J E P R E T . I N', width / 2, padding + 31)

      context.fillStyle = '#49353d'
      context.font = 'bold 33px Georgia'
      context.fillText(activeTemplate.name, width / 2, padding + 76)

      context.fillStyle = activeTemplate.accent
      context.font = 'bold 13px Arial'
      context.fillText(activeTemplate.tag, width / 2, padding + 105)

      context.font = '22px Georgia'
      context.fillText(activeTemplate.decoration, width / 2, padding + 135)

      function loadImage(src) {
        return new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = reject
          image.src = src
        })
      }

      try {
        const images = await Promise.all(photos.map(loadImage))

        if (cancelled) return

        images.forEach((image, index) => {
          const x = padding
          const y = padding + headerHeight + index * (photoHeight + gap)

          context.save()
          context.shadowColor = `${activeTemplate.accent}55`
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

          context.strokeStyle = activeTemplate.accent
          context.globalAlpha = 0.65
          context.lineWidth = 3
          context.strokeRect(x, y, photoWidth, photoHeight)
          context.globalAlpha = 1

          context.fillStyle = activeTemplate.background
          context.fillRect(width - padding - 42, y + photoHeight - 31, 34, 22)

          context.fillStyle = activeTemplate.accent
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

        context.fillStyle = activeTemplate.accent
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

        if (!cancelled) {
          setFinalPhoto(canvas.toDataURL('image/png'))
          setCameraError('')
        }
      } catch {
        if (!cancelled) {
          setCameraError('Photostrip gagal dibuat. Silakan ulangi sesi foto.')
        }
      }
    }

    createPhotostrip()

    return () => {
      cancelled = true
    }
  }, [photos, activeTemplate])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  function openCamera() {
    setPhotos([])
    setFinalPhoto('')
    setCameraError('')
    setCountdown(3)
    setCounting(false)
    setCameraLoading(false)
    setCameraOpen(true)
  }

  function closeCamera() {
    stopCamera()
    setCameraOpen(false)
    setPhotos([])
    setFinalPhoto('')
    setCounting(false)
    setCameraError('')
    setCountdown(3)
    setCameraLoading(false)
  }

  function takePhoto() {
    if (
      cameraLoading ||
      cameraError ||
      counting ||
      photos.length >= 4
    ) {
      return
    }

    setCountdown(3)
    setCounting(true)
  }

  function retakePhoto() {
    stopCamera()
    setPhotos([])
    setFinalPhoto('')
    setCameraError('')
    setCountdown(3)
    setCounting(false)
    setCameraLoading(false)
    setCameraRetry((value) => value + 1)
  }

  function downloadPhoto() {
    if (!finalPhoto) return

    const link = document.createElement('a')
    link.href = finalPhoto
    link.download = `jepret-in-${activeTemplate.className}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function scrollToTemplates() {
    document.getElementById('templates')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  return (
    <main className="website">
      <nav className="navbar">
      <a className="brand" href="#home">
        <span className="brand-icon">
          <span className="admin-brand-camera">
            <span className="admin-brand-lens"></span>
          </span>
        </span>
        <span>Jepret<span className="pink">.in</span></span>
      </a>



        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#cara-kerja">Cara Kerja</a>
          <a href="#templates">Templates</a>
          <a href="#custom">Custom Event</a>
          <a href="#pricing">Pricing</a>
        </div>

        <button className="nav-button" onClick={openCamera}>
          Mulai Jepret ♡
        </button>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">
            <span className="dot" />
            YOUR LITTLE PHOTO MOMENT
          </p>

          <h1>Jepret<span>.in</span></h1>

          <p className="hero-description">
            Abadikan momen spesialmu dengan berbagai template
            photobooth yang manis. Pilih frame favorit, ambil
            empat foto, dan simpan kenanganmu.
          </p>

          <div className="hero-actions">
            <button className="primary-button" onClick={openCamera}>
              Mulai Jepret →
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={scrollToTemplates}
            >
              Lihat Template ↓
            </button>
          </div>

          <div className="social-proof">
            <div className="emoji-stack">
              <span>♡</span>
              <span>✿</span>
              <span>✨</span>
            </div>

            <div>
              <strong>Little moments, lovely memories</strong>
              <p>Abadikan momenmu dengan Jepret.in</p>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-glow" />

          <div className="hero-photo">
            <div className="hero-photo-top">
              <span>JEPRET.IN</span>
              <span>♡</span>
            </div>

            <div className="hero-photo-images">
              <div className="mock-photo mock-pink">♡</div>
              <div className="mock-photo mock-yellow">✿</div>
              <div className="mock-photo mock-purple">✦</div>
            </div>

            <p>our little moments</p>
          </div>

          <div className="floating-note note-top">
            ✨ Capture your memories
          </div>

          <div className="floating-note note-bottom">
            Made with <span>♡</span> love
          </div>

          <span className="decor decor-one">✿</span>
          <span className="decor decor-two">✧</span>
          <span className="decor decor-three">♡</span>
        </div>
      </section>

      <section className="info-section" id="cara-kerja">
        <div className="section-heading">
          <span className="section-label">SIMPLE & FUN</span>
          <h2>Three steps to <span>memories</span></h2>
          <p>
            Membuat photostrip sendiri itu mudah. Ikuti tiga
            langkah sederhana untuk membawa pulang kenanganmu.
          </p>
        </div>

        <div className="steps">
          <article className="step-card">
            <span className="step-number">STEP 01</span>
            <div className="step-icon">♡</div>
            <h3>Pilih Template</h3>
            <p>Pilih desain photostrip yang kamu suka.</p>
          </article>

          <article className="step-card">
            <span className="step-number">STEP 02</span>
            <div className="step-icon">◎</div>
            <h3>Ambil Empat Foto</h3>
            <p>Setiap foto menggunakan hitung mundur tiga detik.</p>
          </article>

          <article className="step-card">
            <span className="step-number">STEP 03</span>
            <div className="step-icon">↓</div>
            <h3>Unduh Photostrip</h3>
            <p>Simpan hasil foto dalam format PNG.</p>
          </article>
        </div>
      </section>

      <section className="templates-section" id="templates">
        <div className="template-heading">
          <div>
            <span className="section-label">FIND YOUR FAVORITE</span>
            <h2>Jelajahi <span>Template</span></h2>
            <p>Pilih template favoritmu dan mulai abadikan momenmu!</p>
          </div>

          <div className="template-decoration">♡ ✧ ♡</div>
        </div>

        <div className="template-categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-chip ${
                selectedCategory === category ? 'active' : ''
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="template-grid">
          {visibleTemplates.map((template) => (
            <button
              type="button"
              key={template.className}
              className={`template-card ${template.className} ${
                selectedTemplate === template.index ? 'selected' : ''
              }`}
              onClick={() => setSelectedTemplate(template.index)}
            >
              <div className="template-art">
                <span className="template-tag">{template.tag}</span>

                <div className="mini-strip">
                  <div>♡</div>
                  <div>✿</div>
                  <div>✧</div>
                  <div className="mini-strip-label">JEPRET.IN</div>
                </div>

                <span className="art-sparkle">✧</span>
              </div>

              <div className="template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>

                <span className="template-select">
                  {selectedTemplate === template.index
                    ? '✓ Template dipilih'
                    : 'Pilih template ♡'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="template-cta">
          <div className="template-cta-copy">
            <div className="selected-indicator">♡</div>
            <div>
              <strong>{activeTemplate.name}</strong>
              <p>Template pilihanmu siap digunakan.</p>
            </div>
          </div>

          <button className="primary-button" onClick={openCamera}>
            Mulai Foto →
          </button>
        </div>
      </section>

      <section className="custom-section">
        <div className="custom-art">
          <div className="custom-art-circle">
            <span className="custom-heart">♡</span>
            <div className="custom-art-note">
              your memories, your way ✨
            </div>
          </div>
        </div>

        <div className="custom-content">
          <span className="section-label">MADE FOR YOUR MOMENTS</span>
          <h2>Every moment is <span>special</span></h2>
          <p>
            Dari senyum kecil sampai momen bersama teman,
            simpan semuanya dalam photostrip buatanmu sendiri.
          </p>

          <button className="primary-button" onClick={openCamera}>
            Abadikan Momennya ♡
          </button>
        </div>
      </section>

      {/* FORM CUSTOM EVENT */}
      <section id="custom" className="custom-section">
        <div className="custom-content">
          <span className="section-label">CUSTOM PHOTObOOTH</span>
          <h2>Make your event <span>special</span> ♡</h2>
          <p>Buat photobooth khusus untuk acara spesialmu!</p>
          
            <form className="event-request-form" onSubmit={(event) => {
        event.preventDefault()
        setCheckoutMessage(
          'Data checkout berhasil divalidasi. Pembayaran belum dilakukan karena integrasi pembayaran belum tersedia.'
        )
      }}>
        <div className="checkout-field">
          <label htmlFor="checkout-name">Nama lengkap</label>
          <input
            id="checkout-name"
            name="name"
            placeholder="Masukkan nama lengkap"
            autoComplete="name"
            required
          />
        </div>

        <div className="checkout-field">
          <label htmlFor="checkout-email">Email</label>
          <input
            id="checkout-email"
            name="email"
            type="email"
            placeholder="Masukkan email aktif"
            autoComplete="email"
            required
          />
        </div>

        <button type="submit" className="primary-button">
          Lanjut ke Pembayaran
        </button>
      </form>


          {requestSent && (
            <p role="status">
              Request berhasil dicatat di halaman demo! ♡
            </p>
          )}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="pricing-section">
        <div className="section-heading">
          <span className="section-label">SIMPLE PRICING</span>
          <h2>Choose Your <span>Plan</span> ✨</h2>
        </div>

        <div className="pricing-grid">
          <article className="pricing-card">
  <h3>Basic</h3>
  <p className="price">Rp9.900</p>
  <p>✓ Semua fitur Free</p>
  <p>✓ Pilihan frame eksklusif</p>
  <p>✓ Variasi photostrip tambahan</p>

  <button
    type="button"
    className="primary-button"
    onClick={() => {
      setSelectedPlan({ name: 'Basic', price: 9900 })
      setCheckoutMessage('')
      document.getElementById('checkout')?.scrollIntoView({
        behavior: 'smooth',
      })
    }}
  >
        Pilih Basic
      </button>
    </article>

    <article className="pricing-card">
      <h3>Premium</h3>
      <p className="price">Rp19.900</p>
      <p>✓ Semua fitur Basic</p>
      <p>✓ Tema premium</p>
      <p>✓ Kustomisasi photostrip</p>

      <button
        type="button"
        className="primary-button"
        onClick={() => {
          setSelectedPlan({ name: 'Premium', price: 19900 })
          setCheckoutMessage('')
          document.getElementById('checkout')?.scrollIntoView({
            behavior: 'smooth',
          })
        }}
      >
        Pilih Premium
      </button>
    </article>

          <article className="pricing-card">
            <h3>Custom Event</h3>
            <p className="price">Sesuai kebutuhan</p>
            <p>✓ Request tema acara</p>
            <p>✓ Konsep desain personal</p>
            <p>✓ Untuk acara spesial</p>

            <a href="#custom" className="primary-button pricing-link">
              Request Custom
            </a>
          </article>
        </div>

        <p className="pricing-note">
          Harga layanan custom dikonfirmasi sesuai kebutuhan acara.
        </p>


{selectedPlan && (
  <section id="checkout" className="checkout-screen">
    <div className="custom-content checkout-layout">
     <button
      type="button"
      className="checkout-close-button"
      aria-label="Tutup checkout"
      onClick={() => {
        setSelectedPlan(null)
        setCheckoutMessage('')
        setShowPaymentStep(false)
      }}
    >
      ×
    </button>

      <div className="checkout-heading">
        
        <span className="section-label">CHECKOUT</span>
        <h2>Selesaikan <span>Pesananmu</span></h2>
        <p>Periksa detail pesanan sebelum melanjutkan.</p>
      </div>

      <div className="checkout-columns">
        {/* KOLOM KIRI: DATA PEMESAN */}
        <div className="checkout-left">
          <h3 className="checkout-subtitle">Data Pemesan</h3>

          <form
            id="checkout-form"
            className="event-request-form"
            onSubmit={(event) => {
              event.preventDefault()
              setCheckoutMessage('')
              setShowPaymentStep(true)
            }}
          >
            <div className="checkout-field">
              <label htmlFor="checkout-name">Nama lengkap</label>
              <input
                id="checkout-name"
                name="name"
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                required
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="checkout-email">Email</label>
              <input
                id="checkout-email"
                name="email"
                type="email"
                placeholder="Masukkan email aktif"
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" className="primary-button">
              Lanjut ke Pembayaran
            </button>
          </form>

          {checkoutMessage && (
            <p role="status">{checkoutMessage}</p>
          )}
        </div>

        {/* KOLOM KANAN: RINGKASAN DAN PEMBAYARAN */}
        <div className="checkout-right">
          <h3 className="checkout-subtitle">Ringkasan Pesanan</h3>

          <div className="pricing-card">
            <h3>{selectedPlan.name}</h3>
            <p className="price">
              Rp{selectedPlan.price.toLocaleString('id-ID')}
            </p>
            <p>Photobooth digital Jepret.in</p>
            <div className="checkout-total">
              <span>Total pembayaran</span>
              <strong>
                Rp{selectedPlan.price.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          {showPaymentStep && (
            <div className="checkout-payment" aria-live="polite">
              <h3>Pembayaran QRIS</h3>

              <div className="checkout-qr-placeholder">
                <span className="checkout-qr-icon">
                  <icon name="qr-code" size="3xl" />
                </span>
                <p>QRIS akan ditampilkan di sini</p>
                <small>
                  Integrasi pembayaran belum tersedia.
                  Belum ada transaksi yang dilakukan.
                </small>
              </div>
            </div>
          )}

          <button
            type="button"
            className="primary-button checkout-back-button"
            onClick={() => {
              setSelectedPlan(null)
              setCheckoutMessage('')
              setShowPaymentStep(false)

              requestAnimationFrame(() => {
                document.getElementById('pricing')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              })
            }}
          >
            Kembali ke Paket
          </button>
        </div>
      </div>
    </div>
  </section>
)}


      </section>

      {/* FOOTER: tag pembuka dan penutup sudah benar */}
      <footer className="footer">
        <a className="brand" href="#home">
          <span className="brand-icon">♡</span>
          <span>Jepret<span className="pink">.in</span></span>
        </a>

        <p>Made with love ♡ Jepret.in</p>
        <a className="back-top" href="#home">
          Kembali ke atas ↑
        </a>
      </footer>

      {/* MODAL KAMERA */}
      {cameraOpen && (
        <div className="camera-overlay">
          <section className="camera-panel">
            <div className="camera-header">
              <span className="section-label">JEPRET.IN PHOTOBOOTH</span>

              <button
                type="button"
                className="camera-close"
                onClick={closeCamera}
                aria-label="Tutup kamera"
              >
                ×
              </button>
            </div>

            <div className="camera-title">
              <h2>
                {finalPhoto ? (
                  <>Your <span>photostrip</span> ♡</>
                ) : (
                  <>Ready, <span>smile!</span></>
                )}
              </h2>

              <p>
                Frame pilihan: <strong>{activeTemplate.name}</strong>
              </p>
            </div>

            <div className={`camera-view ${activeTemplate.className}`}>
              {finalPhoto ? (
                <img
                  className="captured-image photostrip-preview"
                  src={finalPhoto}
                  alt="Hasil photostrip empat foto"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="live-video"
                    autoPlay
                    muted
                    playsInline
                  />

                  {!cameraLoading && !cameraError && (
                    <div className="camera-live-label">
                      <span />
                      LIVE
                    </div>
                  )}

                  {counting && (
                    <div className="countdown-number">
                      {countdown > 0 ? countdown : '♡'}
                    </div>
                  )}

                  {!cameraLoading && !cameraError && (
                    <div className="photo-progress">
                      Foto {Math.min(photos.length + 1, 4)} dari 4
                    </div>
                  )}
                </>
              )}
            </div>

            <canvas ref={canvasRef} className="camera-canvas" />

            {cameraLoading && (
              <div className="camera-message">
                <span className="camera-loading">♡</span>
                <p>Membuka kamera...</p>
              </div>
            )}

            {cameraError && (
              <div className="camera-error">
                <p>{cameraError}</p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    stopCamera()
                    setCameraError('')
                    setPhotos([])
                    setFinalPhoto('')
                    setCameraLoading(false)
                    setCounting(false)
                    setCountdown(3)
                    setCameraRetry((value) => value + 1)
                  }}
                >
                  Coba lagi
                </button>
              </div>
            )}

            {photos.length === 4 && !finalPhoto && !cameraError && (
              <div className="camera-message">
                <span className="camera-loading">♡</span>
                <p>Menyusun photostrip kamu...</p>
              </div>
            )}

            <div className="camera-controls">
              {finalPhoto ? (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={retakePhoto}
                  >
                    ↺ Ulangi sesi
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={downloadPhoto}
                  >
                    ↓ Unduh photostrip PNG
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="primary-button shutter-button"
                  onClick={takePhoto}
                  disabled={
                    cameraLoading ||
                    counting ||
                    !!cameraError ||
                    photos.length >= 4
                  }
                >
                  {counting
                    ? `Bersiap... ${countdown || ''}`
                    : `◎ Ambil foto ${photos.length + 1}/4`}
                </button>
              )}
            </div>

            <p className="camera-tip">
              {finalPhoto
                ? '✨ Photostrip siap! Unduh PNG atau ulangi sesi.'
                : `${photos.length} dari 4 foto tersimpan. Setiap foto memakai hitung mundur 3 detik.`}
            </p>
          </section>
        </div>
      )}
    </main>
  )
}

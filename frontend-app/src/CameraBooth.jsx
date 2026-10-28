
import { useEffect, useRef, useState } from 'react'

function CameraBooth({ templateName, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Browser tidak mendukung kamera. Coba buka lewat localhost atau HTTPS.',
          )
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          if (!cancelled) setCameraReady(true)
        }
      } catch (err) {
        if (cancelled) return

        if (err.name === 'NotAllowedError') {
          setError(
            'Izin kamera ditolak. Izinkan akses kamera melalui pengaturan browser, lalu coba lagi.',
          )
        } else if (err.name === 'NotFoundError') {
          setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.')
        } else {
          setError(err.message || 'Kamera gagal dibuka. Coba lagi.')
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      clearInterval(timerRef.current)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  function takePhoto() {
    if (!cameraReady || !videoRef.current || countdown !== null) return

    setCapturedPhoto(null)
    setCountdown(3)

    let secondsLeft = 3

    timerRef.current = setInterval(() => {
      secondsLeft -= 1

      if (secondsLeft > 0) {
        setCountdown(secondsLeft)
        return
      }

      clearInterval(timerRef.current)
      timerRef.current = null

      const video = videoRef.current

      if (!video || video.videoWidth === 0) {
        setCountdown(null)
        setError('Video belum siap. Coba ambil foto sekali lagi.')
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext('2d')

      // Balik foto secara horizontal agar hasilnya terasa seperti selfie.
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      setCapturedPhoto(canvas.toDataURL('image/png'))
      setCountdown(null)
    }, 1000)
  }

  function downloadPhoto() {
    if (!capturedPhoto) return

    const link = document.createElement('a')
    link.href = capturedPhoto
    link.download = `jepret-in-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function retryPhoto() {
    setCapturedPhoto(null)
    setError('')
  }

  function closeCamera() {
    clearInterval(timerRef.current)
    onClose()
  }

  return (
    <div className="camera-overlay" role="dialog" aria-modal="true">
      <section className="camera-panel">
        <header className="camera-header">
          <a className="logo" href="#home" onClick={(event) => {
            event.preventDefault()
            closeCamera()
          }}>
            jepret<span>.in</span>
          </a>

          <button
            className="camera-close"
            type="button"
            onClick={closeCamera}
            aria-label="Tutup kamera"
          >
            ✕
          </button>
        </header>

        <div className="camera-title">
          <span className="eyebrow">YOUR MOMENT STARTS HERE</span>
          <h2>Ready, set, <span>jepret!</span></h2>
          <p>Template pilihanmu: {templateName}</p>
        </div>

        <div className="camera-view">
          {capturedPhoto ? (
            <img
              className="captured-image"
              src={capturedPhoto}
              alt="Hasil foto photobooth"
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

              {!cameraReady && !error && (
                <div className="camera-message">
                  <span className="camera-loading">♡</span>
                  <p>Membuka kamera...</p>
                </div>
              )}

              {countdown !== null && (
                <div className="countdown-number" aria-live="assertive">
                  {countdown}
                </div>
              )}

              {cameraReady && (
                <div className="camera-live-label">
                  <span /> LIVE
                </div>
              )}
            </>
          )}
        </div>

        {error && <p className="camera-error">{error}</p>}

        <div className="camera-controls">
          {capturedPhoto ? (
            <>
              <button
                className="button button-secondary"
                type="button"
                onClick={retryPhoto}
              >
                ↻ Ulangi foto
              </button>
              <button
                className="button button-primary"
                type="button"
                onClick={downloadPhoto}
              >
                Unduh foto ↓
              </button>
            </>
          ) : (
            <button
              className="button button-primary shutter-button"
              type="button"
              disabled={!cameraReady || countdown !== null}
              onClick={takePhoto}
            >
              {countdown !== null
                ? 'Siap-siap berpose...'
                : '◎ Ambil Foto'}
            </button>
          )}
        </div>

        <p className="camera-tip">
          {capturedPhoto
            ? 'Yeay! Foto kamu sudah siap. Simpan atau coba lagi ♡'
            : 'Pose terbaikmu, senyum terbaikmu. Foto diambil 3 detik setelah tombol ditekan.'}
        </p>
      </section>
    </div>
  )
}

export default CameraBooth

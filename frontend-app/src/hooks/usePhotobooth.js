import { useEffect, useRef, useState } from 'react'
import { buildPhotostrip } from '../utils/photostrip.js'
import { detectFaces, drawFaceFilter, loadFaceDetector } from '../utils/faceFilters.js'

export function usePhotobooth(activeTemplate, canUseFilters) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [photos, setPhotos] = useState([])
  const [countdown, setCountdown] = useState(3)
  const [counting, setCounting] = useState(false)
  const [cameraRetry, setCameraRetry] = useState(0)
  const [finalPhoto, setFinalPhoto] = useState('')

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const detectorRef = useRef(null)
  const facesRef = useRef([])

  const [filterId, setFilterId] = useState('none')
  const [filterStatus, setFilterStatus] = useState('idle')
  const [faceFound, setFaceFound] = useState(true)

  const activeFilter = canUseFilters ? filterId : 'none'

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

    // Memuat detektor wajah saat sebuah filter dipilih
  useEffect(() => {
    if (!cameraOpen || activeFilter === 'none' || detectorRef.current) return

    let cancelled = false

    setFilterStatus('loading')

    loadFaceDetector()
      .then((detector) => {
        if (cancelled) return

        detectorRef.current = detector
        setFilterStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setFilterStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [cameraOpen, activeFilter])

  // Menampilkan filter wajah secara langsung di atas video
  useEffect(() => {
    const clearOverlay = () => {
      const overlay = overlayRef.current

      overlay?.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height)
    }

    if (
      !cameraOpen ||
      photos.length >= 4 ||
      cameraLoading ||
      activeFilter === 'none' ||
      filterStatus !== 'ready'
    ) {
      clearOverlay()
      facesRef.current = []
      return
    }

    let frame = 0
    let lastRun = 0
    let stopped = false

    function loop(time) {
      if (stopped) return

      frame = requestAnimationFrame(loop)

      if (time - lastRun < 45) return
      lastRun = time

      const video = videoRef.current
      const overlay = overlayRef.current

      if (!video || !overlay || !video.videoWidth) return

      let faces

      try {
        faces = detectFaces(detectorRef.current, video)
      } catch {
        return
      }

      facesRef.current = faces
      setFaceFound((previous) => (previous === faces.length > 0 ? previous : faces.length > 0))

      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const cssWidth = video.clientWidth
      const cssHeight = video.clientHeight
      const pixelWidth = Math.round(cssWidth * ratio)
      const pixelHeight = Math.round(cssHeight * ratio)

      overlay.style.left = `${video.offsetLeft}px`
      overlay.style.top = `${video.offsetTop}px`
      overlay.style.width = `${cssWidth}px`
      overlay.style.height = `${cssHeight}px`

      if (overlay.width !== pixelWidth || overlay.height !== pixelHeight) {
        overlay.width = pixelWidth
        overlay.height = pixelHeight
      }

      const scale = Math.max(cssWidth / video.videoWidth, cssHeight / video.videoHeight) * ratio
      const offsetX = (pixelWidth - video.videoWidth * scale) / 2
      const offsetY = (pixelHeight - video.videoHeight * scale) / 2
      const context = overlay.getContext('2d')

      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, pixelWidth, pixelHeight)
      context.setTransform(scale, 0, 0, scale, offsetX, offsetY)
      drawFaceFilter(context, activeFilter, faces)
    }

    frame = requestAnimationFrame(loop)

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
    }
  }, [cameraOpen, photos.length, cameraLoading, activeFilter, filterStatus])


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

    if (activeFilter !== 'none' && detectorRef.current) {
      let faces = facesRef.current

      try {
        faces = detectFaces(detectorRef.current, video)
      } catch {
        // memakai hasil deteksi terakhir
      }

      context.save()
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
      drawFaceFilter(context, activeFilter, faces)
      context.restore()
    }

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

  // Menyusun empat foto menjadi photostrip PNG
  useEffect(() => {
    if (photos.length !== 4) {
      setFinalPhoto('')
      return
    }

    let cancelled = false

    buildPhotostrip(photos, activeTemplate)
      .then((dataUrl) => {
        if (!cancelled) {
          setFinalPhoto(dataUrl)
          setCameraError('')
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setCameraError(error.message || 'Photostrip gagal dibuat. Silakan ulangi sesi foto.')
        }
      })

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

  return {
    videoRef,
    canvasRef,
    overlayRef,
    filterId,
    setFilterId,
    filterStatus,
    faceFound,
    cameraOpen,
    cameraLoading,
    cameraError,
    photos,
    countdown,
    counting,
    finalPhoto,
    openCamera,
    closeCamera,
    takePhoto,
    retakePhoto,
    downloadPhoto,
  }
}
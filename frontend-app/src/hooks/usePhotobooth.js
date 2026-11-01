import { useEffect, useRef, useState } from 'react'
import { buildPhotostrip } from '../utils/photostrip.js'

export function usePhotobooth(activeTemplate) {
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
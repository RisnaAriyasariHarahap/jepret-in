// Memuat snap.js milik Midtrans sekali saja, lalu membuka popup pembayaran.
let snapPromise = null

function loadSnap(snapJsUrl, clientKey) {
  if (window.snap) return Promise.resolve(window.snap)

  if (!snapPromise) {
    snapPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = snapJsUrl
      script.setAttribute('data-client-key', clientKey)
      script.onload = () => resolve(window.snap)
      script.onerror = () => {
        snapPromise = null
        reject(new Error('Gagal memuat halaman pembayaran. Periksa koneksi internet.'))
      }
      document.body.appendChild(script)
    })
  }

  return snapPromise
}

// Mengembalikan hasil akhir popup: 'success' | 'pending' | 'error' | 'closed'
export async function payWithSnap({ token, snapJsUrl, clientKey }) {
  const snap = await loadSnap(snapJsUrl, clientKey)

  return new Promise((resolve) => {
    snap.pay(token, {
      onSuccess: () => resolve('success'),
      onPending: () => resolve('pending'),
      onError: () => resolve('error'),
      onClose: () => resolve('closed'),
    })
  })
}
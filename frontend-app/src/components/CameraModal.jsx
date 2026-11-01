export default function CameraModal({ camera, activeTemplate }) {
  const {
    videoRef,
    canvasRef,
    cameraLoading,
    cameraError,
    photos,
    countdown,
    counting,
    finalPhoto,
    closeCamera,
    takePhoto,
    retakePhoto,
    downloadPhoto,
  } = camera

  return (
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
              onClick={retakePhoto}
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
  )
}
import { FILTERS } from '../utils/faceFilters.js'

export default function CameraModal({ camera, activeTemplate, canUseFilters, onNeedPremium }) {
  const {
    videoRef,
    canvasRef,
    overlayRef,
    filterId,
    setFilterId,  
    filterStatus,
    faceFound,
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

              <canvas ref={overlayRef} className="filter-overlay" />

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

        {!finalPhoto && (
          <div className="filter-picker">
            <div className="filter-row">
              {FILTERS.map((filter) => {
                const locked = !canUseFilters && filter.id !== 'none'

                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`filter-chip ${
                      filterId === filter.id && !locked ? 'active' : ''
                    } ${locked ? 'locked' : ''}`}
                    onClick={() => (locked ? onNeedPremium() : setFilterId(filter.id))}
                    disabled={counting}
                    title={locked ? 'Khusus Premium' : filter.name}
                  >
                    <span className="filter-icon">{filter.icon}</span>
                    <span>{filter.name}</span>
                    {locked && <span className="filter-lock">🔒</span>}
                  </button>
                )
              })}
            </div>

            {!canUseFilters && (
              <p className="filter-hint">Filter wajah khusus Premium 🔒</p>
            )}

            {canUseFilters && filterId !== 'none' && filterStatus === 'loading' && (
              <p className="filter-hint">Memuat filter wajah...</p>
            )}

            {canUseFilters && filterId !== 'none' && filterStatus === 'error' && (
              <p className="filter-hint">
                Filter wajah tidak dapat dimuat (periksa koneksi). Foto tetap bisa diambil tanpa filter.
              </p>
            )}

            {canUseFilters && filterId !== 'none' && filterStatus === 'ready' && !faceFound && (
              <p className="filter-hint">Wajah belum terdeteksi. Hadapkan wajah ke kamera.</p>
            )}
          </div>
        )}

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
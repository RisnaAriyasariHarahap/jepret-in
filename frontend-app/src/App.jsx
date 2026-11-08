import { useEffect, useState } from 'react'
import './App.css'
import { apiFetch } from './api.js'
import { useAuth } from './context/AuthContext.jsx'
import { defaultTemplates } from './data/templates.js'
import { usePhotobooth } from './hooks/usePhotobooth.js'
import Navbar from './components/landing/Navbar.jsx'
import Hero from './components/landing/Hero.jsx'
import HowItWorks from './components/landing/HowItWorks.jsx'
import TemplatesSection from './components/landing/TemplatesSection.jsx'
import Showcase from './components/landing/Showcase.jsx'
import CustomEventCta from './components/landing/CustomEventCta.jsx'
import Pricing from './components/landing/Pricing.jsx'
import Footer from './components/landing/Footer.jsx'
import CameraModal from './components/CameraModal.jsx'

export default function App() {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState(defaultTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState(0)

  const canUseFilters = Boolean(profile?.isPremium || profile?.role === 'admin')

  const activeTemplate = templates[selectedTemplate] || templates[0]
  const camera = usePhotobooth(activeTemplate, canUseFilters)

  // Mengambil template dari backend (diambil ulang saat status login/Premium berubah)
  useEffect(() => {
    let cancelled = false

    async function loadTemplates() {
      try {
        const result = await apiFetch('/api/templates')

        if (!cancelled && Array.isArray(result.data) && result.data.length > 0) {
          setTemplates(result.data)
        }
      } catch {
        // Jika backend belum aktif, tetap memakai template bawaan
      }
    }

    loadTemplates()

    return () => {
      cancelled = true
    }
  }, [profile?.id, profile?.isPremium])

  function scrollToTemplates() {
    document.getElementById('templates')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  function scrollToPricing() {
    document.getElementById('pricing')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  function startBooth() {
    if (activeTemplate.locked) {
      scrollToPricing()
      return
    }

    camera.openCamera()
  }

  function needPremium() {
    camera.closeCamera()

    requestAnimationFrame(scrollToPricing)
  }

  return (
    <main className="website">
      <Navbar onStart={startBooth} />

      <Hero onStart={startBooth} onScrollToTemplates={scrollToTemplates} />

      <HowItWorks />

      <TemplatesSection
        templates={templates}
        selectedIndex={selectedTemplate}
        onSelect={setSelectedTemplate}
        activeTemplate={activeTemplate}
        onStart={startBooth}
      />

      <Showcase onStart={startBooth} />

      <CustomEventCta />

      <Pricing />

      <Footer />

      {camera.cameraOpen && (
        <CameraModal
          camera={camera}
          activeTemplate={activeTemplate}
          canUseFilters={canUseFilters}
          onNeedPremium={needPremium}
        />
      )}
    </main>
  )
}
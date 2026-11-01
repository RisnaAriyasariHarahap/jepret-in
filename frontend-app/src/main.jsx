import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './App.css'
import AdminApp from './admin/AdminApp.jsx'
import CustomEventPage from './pages/CustomEventPage.jsx'

const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'

const isAdminRoute =
  currentPath === '/admin' || currentPath.startsWith('/admin/')

const isCustomEventRoute = currentPath === '/form-custom-event'

function renderPage() {
  if (isAdminRoute) return <AdminApp />
  if (isCustomEventRoute) return <CustomEventPage />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>{renderPage()}</StrictMode>,
)
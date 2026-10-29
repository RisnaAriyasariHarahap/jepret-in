
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './App.css'
import AdminApp from './admin/AdminApp.jsx'

const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'

const isAdminRoute =
  currentPath === '/admin' || currentPath.startsWith('/admin/')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdminRoute ? <AdminApp /> : <App />}
  </StrictMode>,
)

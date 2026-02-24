import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/buttons.css'
import './styles/layout.css'
import './styles/improvements.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { initAnalytics } from './utils/analytics.js'

initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </StrictMode>,
)

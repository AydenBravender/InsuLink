import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HealthProvider } from './context/HealthContext'   // ✅ ADD THIS

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HealthProvider>    {/* ✅ Wrap App here */}
      <App />
    </HealthProvider>
  </StrictMode>
)

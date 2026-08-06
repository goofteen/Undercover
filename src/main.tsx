import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const Spinner = () => (
  <div className="min-h-screen bg-uc-bg flex items-center justify-center">
    <div className="text-center">
      <div className="text-5xl mb-4 animate-pulse-glow">🕵️</div>
      <p className="font-heading text-uc-gold tracking-wider animate-pulse">กำลังโหลด...</p>
    </div>
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<Spinner />}>
      <App />
    </Suspense>
  </StrictMode>,
)

import React, { useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import TreehouseEntry from './pages/TreehouseEntry'
import TreehousePetSelection from './pages/TreehousePetSelection'
import PetOverlay from './pages/PetOverlay'
import TreehouseReport from './pages/TreehouseReport'
import { usePetStore } from './store/petStore'

// Detect window mode from query params (set by main process)
const searchParams = new URLSearchParams(window.location.search)
const isPetOverlayWindow = searchParams.get('mode') === 'overlay'
const isReportWindow = searchParams.get('route') === 'report'
const isChangePetWindow = searchParams.get('route') === 'change-pet'

const AppRoutes: React.FC = () => {
  const { initFromFile } = usePetStore()

  useEffect(() => {
    initFromFile()
  }, [initFromFile])

  // If this window is the pet overlay, skip routing and render directly
  if (isPetOverlayWindow) {
    return <PetOverlay />
  }

  if (isReportWindow) {
    return (
      <Routes>
        <Route path="*" element={<TreehouseReport />} />
      </Routes>
    )
  }

  if (isChangePetWindow) {
    return (
      <Routes>
        <Route path="/select-pet" element={<TreehousePetSelection mode="change" />} />
        <Route path="*" element={<Navigate to="/select-pet" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<TreehouseEntry />} />
      <Route path="/select-pet" element={<TreehousePetSelection mode="onboard" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App: React.FC = () => {
  const initialEntry = isChangePetWindow ? '/select-pet' : '/'

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRoutes />
    </MemoryRouter>
  )
}

export default App

import React, { useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import TreehouseEntry from './pages/TreehouseEntry'
import PetSelection from './pages/PetSelection'
import PetOverlay from './pages/PetOverlay'
import TreehouseReport from './pages/TreehouseReport'
import { usePetStore } from './store/petStore'

// Detect window mode from query params (set by main process)
const searchParams = new URLSearchParams(window.location.search)
const isPetOverlayWindow = searchParams.get('mode') === 'overlay'
const isReportWindow = searchParams.get('route') === 'report'

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

  return (
    <Routes>
      <Route path="/" element={<TreehouseEntry />} />
      <Route path="/select-pet" element={<PetSelection />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>
  )
}

export default App

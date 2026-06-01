import React, { useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import TreehouseEntry from './pages/TreehouseEntry'
import PetSelection from './pages/PetSelection'
import PetOverlay from './pages/PetOverlay'
import { usePetStore } from './store/petStore'

// Detect if this window was opened as the pet overlay
// The main process passes ?mode=overlay when creating PetWindow
const isPetOverlayWindow = new URLSearchParams(window.location.search).get('mode') === 'overlay'

const AppRoutes: React.FC = () => {
  const { initFromFile } = usePetStore()

  useEffect(() => {
    initFromFile()
  }, [initFromFile])

  // If this window is the pet overlay, skip routing and render directly
  if (isPetOverlayWindow) {
    return <PetOverlay />
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

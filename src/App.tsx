import React, { useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import TreehouseEntry from './pages/TreehouseEntry'
import TreehousePetSelection from './pages/TreehousePetSelection'
import PetOverlay from './pages/PetOverlay'
import PetChat from './pages/PetChat'
import TreehouseReport from './pages/TreehouseReport'
import { usePetStore } from './store/petStore'

const searchParams = new URLSearchParams(window.location.search)
const isPetOverlayWindow = searchParams.get('mode') === 'overlay'
const isChatWindow = searchParams.get('mode') === 'chat'
const isTreehouseWindow = searchParams.get('mode') === 'treehouse'
const treehouseRoute = searchParams.get('route') ?? 'entry'

function treehouseInitialPath(): string {
  if (treehouseRoute === 'report') return '/report'
  if (treehouseRoute === 'change-pet') return '/change-pet'
  return '/'
}

const AppRoutes: React.FC = () => {
  const { initFromFile } = usePetStore()

  useEffect(() => {
    initFromFile()
  }, [initFromFile])

  if (isPetOverlayWindow) {
    return <PetOverlay />
  }

  if (isChatWindow) {
    return <PetChat />
  }

  if (isTreehouseWindow) {
    return (
      <Routes>
        <Route path="/" element={<TreehouseEntry />} />
        <Route path="/select-pet" element={<TreehousePetSelection mode="onboard" />} />
        <Route path="/report" element={<TreehouseReport />} />
        <Route path="/change-pet" element={<TreehousePetSelection mode="change" />} />
        <Route path="*" element={<Navigate to={treehouseInitialPath()} replace />} />
      </Routes>
    )
  }

  return <Navigate to="/" replace />
}

const App: React.FC = () => {
  const initialEntry = isPetOverlayWindow
    ? '/'
    : isTreehouseWindow
      ? treehouseInitialPath()
      : '/'

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRoutes />
    </MemoryRouter>
  )
}

export default App

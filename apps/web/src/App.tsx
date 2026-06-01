import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const TreeHouseEntry = lazy(() => import('./pages/TreeHouseEntry'));
const PetSelection = lazy(() => import('./pages/PetSelection'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const Spinner: React.FC = () => (
  <div className="w-screen h-screen flex items-center justify-center bg-[#0d0d1a]">
    <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
  </div>
);

const App: React.FC = () => (
  <Suspense fallback={<Spinner />}>
    <Routes>
      <Route path="/" element={<TreeHouseEntry />} />
      <Route path="/select-pet" element={<PetSelection />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;

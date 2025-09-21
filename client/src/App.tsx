import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import Login from './pages/Login.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  )
}

export default App

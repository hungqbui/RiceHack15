import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';

function App() {
  return (
    <AuthProvider>
      <QuizContextProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizExam /></ProtectedRoute>} />

        </Routes>
      </QuizContextProvider>
    </AuthProvider>
  )
}

export default App

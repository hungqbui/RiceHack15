import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import Login from './pages/Login.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import QuizExam from './pages/QuizExam.tsx';
import { QuizContextProvider } from './contexts/QuizContext.tsx';
import Convo from './pages/convo.tsx';

function App() {
  return (
    <AuthProvider>
      <QuizContextProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizExam /></ProtectedRoute>} />
          <Route path="/convo" element={<ProtectedRoute><Convo /></ProtectedRoute>} />

        </Routes>
      </QuizContextProvider>
    </AuthProvider>
  )
}

export default App

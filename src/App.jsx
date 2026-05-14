import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import QuizMaker from './components/QuizMaker'
import Dashboard from './components/Dashboard'
import SavedQuizzes from './components/SavedQuizzes'
import History from './components/History'
import Settings from './components/Settings'
import Placement from './components/Placement'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('quiz')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retakeAttempt, setRetakeAttempt] = useState(null)
  // null = not checked yet, true = must take placement, false = already placed
  const [needsPlacement, setNeedsPlacement] = useState(null)

  // Check whether the user has done their placement quiz yet.
  const checkPlacement = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ranks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        // If the ranks endpoint isn't reachable, don't trap the user — let them in.
        setNeedsPlacement(false)
        return
      }
      const data = await res.json()
      setNeedsPlacement(!data.has_placement)
    } catch (err) {
      console.error('Placement check failed:', err)
      setNeedsPlacement(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')

    const path = window.location.pathname
    if (path.includes('/signup')) {
      setIsSignup(true)
    }

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setIsAuthenticated(true)
        setUser(userData)
        setCurrentPage('quiz')
        checkPlacement(token)
      } catch (err) {
        console.error('Error parsing saved user:', err)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    }

    setLoading(false)
  }, [])

  const handleLoginSuccess = (token, userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('quiz')
    setIsSignup(false)
    checkPlacement(token)
  }

  const handleSignupSuccess = (token, userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('quiz')
    setIsSignup(false)
    // New signups always go through placement.
    setNeedsPlacement(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
    setCurrentPage('login')
    setNeedsPlacement(null)
  }

  const handleRetakeQuiz = (attempt) => {
    setRetakeAttempt(attempt)
    setCurrentPage('quiz')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <h2>⏳ Loading...</h2>
        </div>
      </div>
    )
  }

  // Render the appropriate page based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'quiz':
        return <QuizMaker authToken={localStorage.getItem('auth_token')} retakeAttempt={retakeAttempt} onRetakeClear={() => setRetakeAttempt(null)} />
      case 'dashboard':
        return <Dashboard authToken={localStorage.getItem('auth_token')} />
      case 'saved':
        return <SavedQuizzes authToken={localStorage.getItem('auth_token')} onRetake={handleRetakeQuiz} />
      case 'history':
        return <History authToken={localStorage.getItem('auth_token')} />
      case 'settings':
        return <Settings onLogout={handleLogout} user={user} onUserUpdate={setUser} />
      default:
        return <QuizMaker authToken={localStorage.getItem('auth_token')} retakeAttempt={retakeAttempt} onRetakeClear={() => setRetakeAttempt(null)} />
    }
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        needsPlacement === true ? (
          <Placement
            authToken={localStorage.getItem('auth_token')}
            subject="Physics"
            onComplete={() => setNeedsPlacement(false)}
          />
        ) : (
          <Layout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            userName={user?.name || 'Student'}
            userAvatar={user?.avatar_url || ''}
            onLogout={handleLogout}
          >
            {renderPage()}
          </Layout>
        )
      ) : isSignup ? (
        <SignupPage onSignupSuccess={handleSignupSuccess} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}

export default App

import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import QuizMaker from './components/QuizMaker'
import SavedQuizzes from './components/SavedQuizzes'
import History from './components/History'
import Settings from './components/Settings'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('quiz')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retakeAttempt, setRetakeAttempt] = useState(null)

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
  }

  const handleSignupSuccess = (token, userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('quiz')
    setIsSignup(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
    setCurrentPage('login')
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
      case 'saved':
        return <SavedQuizzes authToken={localStorage.getItem('auth_token')} onRetake={handleRetakeQuiz} />
      case 'history':
        return <History authToken={localStorage.getItem('auth_token')} />
      case 'settings':
        return <Settings onLogout={handleLogout} user={user} />
      default:
        return <QuizMaker authToken={localStorage.getItem('auth_token')} retakeAttempt={retakeAttempt} onRetakeClear={() => setRetakeAttempt(null)} />
    }
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <Layout
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          userName={user?.name || 'Student'}
          onLogout={handleLogout}
        >
          {renderPage()}
        </Layout>
      ) : isSignup ? (
        <SignupPage onSignupSuccess={handleSignupSuccess} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  )
}

export default App

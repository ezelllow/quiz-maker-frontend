import React, { useState, useEffect } from 'react'
import QuizMaker from './components/QuizMaker'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('login') // 'login', 'signup', 'quiz'
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in and determine current page from URL on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')

    // Check URL path to determine which auth page to show
    const path = window.location.pathname
    if (path.includes('/signup')) {
      setCurrentPage('signup')
    } else {
      setCurrentPage('login')
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
  }

  const handleSignupSuccess = (token, userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('quiz')
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
    setCurrentPage('login')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <>
          <header className="app-header">
            <div className="header-content">
              <h1>📚 Quiz Maker</h1>
              <p>Create personalized quizzes based on difficulty and topic</p>
            </div>
            <div className="header-actions">
              <span className="user-greeting">Welcome, {user?.name || 'User'}!</span>
              <button onClick={handleLogout} className="logout-button">
                🚪 Logout
              </button>
            </div>
          </header>

          <main className="app-main">
            <QuizMaker authToken={localStorage.getItem('auth_token')} />
          </main>

          <footer className="app-footer">
            <p>Backend API: <code>http://localhost:8000</code></p>
          </footer>
        </>
      ) : currentPage === 'login' ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <SignupPage onSignupSuccess={handleSignupSuccess} />
      )}
    </div>
  )
}

export default App

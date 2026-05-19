import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import QuizMaker from './components/QuizMaker'
import Dashboard from './components/Dashboard'
import SavedQuizzes from './components/SavedQuizzes'
import History from './components/History'
import Settings from './components/Settings'
import Placement from './components/Placement'
import DailyChallenge from './components/DailyChallenge'
import HomePage from './components/HomePage'
import LeaderboardPage from './components/LeaderboardPage'
import PracticePage from './components/PracticePage'
import StreakCelebration from './components/StreakCelebration'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('home')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retakeAttempt, setRetakeAttempt] = useState(null)
  // null = not checked yet, true = must take placement, false = already placed
  const [needsPlacement, setNeedsPlacement] = useState(null)
  const [ranks, setRanks] = useState([])
  const [freezeReminder, setFreezeReminder] = useState(null)  // {streak, longest, usedDate}

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
      setRanks(data.ranks || [])
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
        setCurrentPage('home')
        checkPlacement(token)
      } catch (err) {
        console.error('Error parsing saved user:', err)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    }

    setLoading(false)
  }, [])

  // Freeze-reminder check: when the user lands in the app and a freeze was used
  // this calendar week (and we haven't already shown the reminder for that event),
  // mount the freeze-variant celebration so they know the streak survived.
  useEffect(() => {
    if (!isAuthenticated || needsPlacement !== false) return
    const token = localStorage.getItem('auth_token')
    if (!token) return
    let cancelled = false
    fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d || !d.freeze_used_date) return
        // Same ISO-week check (Monday → Sunday): compute Monday of both dates and compare.
        const mondayOf = (iso) => {
          const x = new Date(iso + 'T00:00:00')
          const day = x.getDay()           // 0=Sun, 1=Mon, ... 6=Sat
          const diff = day === 0 ? -6 : 1 - day
          x.setDate(x.getDate() + diff)
          return x.toISOString().slice(0, 10)
        }
        const todayIso = new Date().toISOString().slice(0, 10)
        if (mondayOf(d.freeze_used_date) !== mondayOf(todayIso)) return
        const key = `freeze_reminder_${d.freeze_used_date}`
        if (localStorage.getItem(key)) return
        setFreezeReminder({
          streak:   d.current_streak ?? 0,
          longest:  d.longest_streak ?? 0,
          usedDate: d.freeze_used_date,
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isAuthenticated, needsPlacement])

  const handleLoginSuccess = (token, userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('home')
    setIsSignup(false)
    checkPlacement(token)
  }

  const handleSignupSuccess = (token, userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('home')
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

  // The rank shown app-wide. Physics is the only subject today; fall back gracefully.
  const primaryRank =
    ranks.find((r) => r.subject === 'Physics') || ranks[0] || null

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
      case 'home':
        return <HomePage authToken={localStorage.getItem('auth_token')} user={user} rank={primaryRank} onNavigate={setCurrentPage} />
      case 'quiz':
        return <QuizMaker authToken={localStorage.getItem('auth_token')} retakeAttempt={retakeAttempt} onRetakeClear={() => setRetakeAttempt(null)} mode="daily" />
      case 'practice':
        return <PracticePage authToken={localStorage.getItem('auth_token')} />
      case 'leaderboard':
        return <LeaderboardPage authToken={localStorage.getItem('auth_token')} user={user} />
      case 'daily':
        return <DailyChallenge authToken={localStorage.getItem('auth_token')} subject="Physics" onExit={() => setCurrentPage('home')} />
      case 'dashboard':
        return <Dashboard authToken={localStorage.getItem('auth_token')} />
      case 'saved':
        return <SavedQuizzes authToken={localStorage.getItem('auth_token')} onRetake={handleRetakeQuiz} />
      case 'history':
        return <History authToken={localStorage.getItem('auth_token')} />
      case 'settings':
        return <Settings onLogout={handleLogout} user={user} onUserUpdate={setUser} rank={primaryRank} />
      default:
        return <HomePage authToken={localStorage.getItem('auth_token')} user={user} rank={primaryRank} onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="app">
      {freezeReminder && (
        <StreakCelebration
          streak={freezeReminder.streak}
          longest={freezeReminder.longest}
          freezeUsed={true}
          onDismiss={() => {
            localStorage.setItem(`freeze_reminder_${freezeReminder.usedDate}`, '1')
            setFreezeReminder(null)
          }}
        />
      )}
      {isAuthenticated ? (
        needsPlacement === true ? (
          <Placement
            authToken={localStorage.getItem('auth_token')}
            subject="Physics"
            onComplete={() => checkPlacement(localStorage.getItem('auth_token'))}
          />
        ) : (
          <Layout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            userName={user?.name || 'Student'}
            userAvatar={user?.avatar_url || ''}
            rank={primaryRank}
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

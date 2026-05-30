import React, { useState, useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import StreakCelebration from './components/StreakCelebration'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import Modal from './components/ui/Modal'
import { page as pageVariant } from './motion'
import './App.css'

// Route components are code-split: each one downloads as its own small chunk
// only the first time the user navigates to it. This keeps the initial bundle
// small — in particular recharts (only used by Dashboard) no longer ships on
// first paint, and the large QuizMaker screen loads on demand.
const QuizMaker       = lazy(() => import('./components/QuizMaker'))
const Dashboard       = lazy(() => import('./components/Dashboard'))
const SavedQuizzes    = lazy(() => import('./components/SavedQuizzes'))
const History         = lazy(() => import('./components/History'))
const Settings        = lazy(() => import('./components/Settings'))
const Placement       = lazy(() => import('./components/Placement'))
const DailyChallenge  = lazy(() => import('./components/DailyChallenge'))
const HomePage        = lazy(() => import('./components/HomePage'))
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'))
const ShopPage        = lazy(() => import('./components/ShopPage'))
const PracticePage    = lazy(() => import('./components/PracticePage'))
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'))

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Lightweight fallback shown while a route chunk is being fetched.
function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-quiz-muted font-bold">
      ⏳ Loading…
    </div>
  )
}

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
  const [progression, setProgression] = useState(null)  // {xp, level, rank} — StarQuest
  const [gems, setGems] = useState(0)                   // Crystals balance
  const [dailyGoal, setDailyGoal] = useState(10)        // 10 / 15 / 20
  const [freezes, setFreezes] = useState(0)             // streak freezes held
  const [freezeCap, setFreezeCap] = useState(2)
  const [freezeReminder, setFreezeReminder] = useState(null)  // {streak, longest, usedDate}
  const [quizInProgress, setQuizInProgress] = useState(false)  // true while a quiz attempt is live
  // When the user tries to navigate away mid-quiz we stash the target page
  // here and show a styled Modal (replaces the old window.confirm prompt).
  // Same trigger, same wording, same outcome — just animated.
  const [pendingNav, setPendingNav] = useState(null)

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
      setProgression(data.progression || null)
      setGems(typeof data.gems === 'number' ? data.gems : 0)
      setDailyGoal(data.daily_goal || 10)
      setFreezes(typeof data.freezes_available === 'number' ? data.freezes_available : 0)
      setFreezeCap(typeof data.freeze_cap === 'number' ? data.freeze_cap : 2)
      // Placement quiz removed (2026-05-19) — everyone starts as Cadet, Lv 1, 0 XP.
      setNeedsPlacement(false)
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
        // Honour the dev-tools simulated clock when present (production: real today).
        const todayIso = d.effective_today || new Date().toISOString().slice(0, 10)
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
    // Placement removed — new signups land directly on Home as Cadet.
    // checkPlacement also hydrates freezes / gems / progression so the navbar
    // pills are correct immediately after signup, not just after a reload.
    checkPlacement(token)
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

  // Navigation guard: if a quiz attempt is live, open a Modal before leaving
  // so an accidental tap on the logo / Profile / a nav tab doesn't wipe the
  // attempt. The Modal is rendered at the bottom of the App and reads from
  // pendingNav state.
  const guardedNavigate = (page) => {
    if (quizInProgress && page !== currentPage) {
      setPendingNav(page)
      return
    }
    setCurrentPage(page)
  }
  // Modal Confirm handler — commit the deferred navigation and clear the
  // live-quiz flag. Cancel just closes the modal via setPendingNav(null).
  const confirmLeaveQuiz = () => {
    setQuizInProgress(false)
    if (pendingNav) setCurrentPage(pendingNav)
    setPendingNav(null)
  }

  // App-wide rank now comes from StarQuest progression (XP-derived: Cadet → Star Admiral).
  // The per-subject placement bands (F9..A1) still live in `ranks` for the placement
  // flow + Dashboard's per-subject section, but they're no longer the "headline" rank.
  const primaryRank = progression?.rank || null
  const primaryLevel = progression?.level ?? null

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
        return <HomePage authToken={localStorage.getItem('auth_token')} user={user} rank={primaryRank} progression={progression} onNavigate={setCurrentPage} onFreezesChange={setFreezes} />
      case 'quiz':
        return <QuizMaker authToken={localStorage.getItem('auth_token')} retakeAttempt={retakeAttempt} onRetakeClear={() => setRetakeAttempt(null)} mode="daily" onProgressionChange={setProgression} onGemsChange={setGems} onFreezesChange={setFreezes} onQuizActiveChange={setQuizInProgress} />
      case 'practice':
        return <PracticePage authToken={localStorage.getItem('auth_token')} onProgressionChange={setProgression} onGemsChange={setGems} onFreezesChange={setFreezes} onQuizActiveChange={setQuizInProgress} />
      case 'leaderboard':
        return <LeaderboardPage authToken={localStorage.getItem('auth_token')} user={user} progression={progression} />
      case 'shop':
        return <ShopPage authToken={localStorage.getItem('auth_token')} gems={gems} onGemsChange={setGems} user={user} onUserUpdate={setUser} />
      case 'daily':
        return <DailyChallenge authToken={localStorage.getItem('auth_token')} subject="Physics" onExit={() => setCurrentPage('home')} />
      case 'dashboard':
        return <Dashboard authToken={localStorage.getItem('auth_token')} />
      case 'saved':
        return <SavedQuizzes authToken={localStorage.getItem('auth_token')} onRetake={handleRetakeQuiz} />
      case 'history':
        return <History authToken={localStorage.getItem('auth_token')} />
      case 'settings':
        return <Settings onLogout={handleLogout} user={user} onUserUpdate={setUser} rank={primaryRank}
                         level={primaryLevel} gems={gems} dailyGoal={dailyGoal}
                         freezes={freezes} freezeCap={freezeCap} onFreezesChange={setFreezes}
                         onGemsChange={setGems} onDailyGoalChange={setDailyGoal}
                         onProgressionChange={setProgression} />
      default:
        return <HomePage authToken={localStorage.getItem('auth_token')} user={user} rank={primaryRank} progression={progression} onNavigate={setCurrentPage} onFreezesChange={setFreezes} />
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
      {/* Styled replacement for window.confirm when the user navigates away
          mid-quiz. Same wording, same options — just animated and on-brand. */}
      <Modal
        open={pendingNav !== null}
        onClose={() => setPendingNav(null)}
        onConfirm={confirmLeaveQuiz}
        title="Leave this quiz?"
        body="Your progress on this attempt will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        tone="red"
      />
      {isAuthenticated ? (
        user?.is_teacher ? (
          // Teachers skip Placement and the student bottom-nav shell — they
          // get the dashboard directly. Read-only; no student-app routes.
          <Suspense fallback={<PageFallback />}>
            <TeacherDashboard
              authToken={localStorage.getItem('auth_token')}
              user={user}
              onLogout={handleLogout}
            />
          </Suspense>
        ) : needsPlacement === true ? (
          <Suspense fallback={<PageFallback />}>
            <Placement
              authToken={localStorage.getItem('auth_token')}
              subject="Physics"
              onComplete={() => checkPlacement(localStorage.getItem('auth_token'))}
            />
          </Suspense>
        ) : (
          <Layout
            currentPage={currentPage}
            onNavigate={guardedNavigate}
            userName={user?.name || 'Student'}
            userAvatar={user?.avatar_url || ''}
            rank={primaryRank}
            level={primaryLevel}
            gems={gems}
            freezes={freezes}
            freezeCap={freezeCap}
            onLogout={handleLogout}
            user={user}
            onUserUpdate={setUser}
          >
            {/* AnimatePresence drives a fade+slide between pages whenever
                currentPage changes. mode="wait" lets the outgoing page
                finish its exit before the new page enters — keeps the
                screen from briefly stacking two pages. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPage}
                variants={pageVariant}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Suspense fallback={<PageFallback />}>
                  {renderPage()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
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

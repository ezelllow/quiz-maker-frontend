import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
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
const SettingsPage    = lazy(() => import('./components/SettingsPage'))
const Placement       = lazy(() => import('./components/Placement'))
const DailyChallenge  = lazy(() => import('./components/DailyChallenge'))
const HomePage        = lazy(() => import('./components/HomePage'))
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'))
const ShopPage        = lazy(() => import('./components/ShopPage'))
const CustomizePage   = lazy(() => import('./components/CustomizePage'))
const PracticePage    = lazy(() => import('./components/PracticePage'))
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'))
const TeacherAttemptReview = lazy(() => import('./components/TeacherAttemptReview'))

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Auto-logout after this much inactivity so a stale session can't leave the
// app in a broken, half-authenticated state. Any interaction resets the timer.
const INACTIVITY_LIMIT_MS = 4 * 60 * 60 * 1000  // 4 hours
const ACTIVITY_KEY = 'last_activity'

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
  const [sessionNotice, setSessionNotice] = useState(null)  // shown on login screen after an auto-logout
  // null = not checked yet, true = must take placement, false = already placed
  const [needsPlacement, setNeedsPlacement] = useState(null)
  // When a teacher clicks 'View as student' in the teacher dashboard, we
  // render the student tree instead. A small banner inside Layout offers a
  // way back. State is in-memory only — refresh resets to teacher view.
  const [viewAsStudent, setViewAsStudent] = useState(false)
  // When a teacher clicks an attempt in the student drill-in modal, App.jsx
  // routes to a full-page TeacherAttemptReview instead of expanding inline.
  // null = dashboard view; integer = render the review for that attempt id.
  const [reviewingAttemptId, setReviewingAttemptId] = useState(null)
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

  // Single place that tears the session down and routes back to login, with an
  // optional reason (inactivity / expired token). Stable so the listener
  // effects below don't re-subscribe on every render.
  const forceLogout = useCallback((reason) => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem(ACTIVITY_KEY)
    setIsAuthenticated(false)
    setUser(null)
    setCurrentPage('login')
    setNeedsPlacement(null)
    if (reason) setSessionNotice(reason)
  }, [])

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
      // Hydrate the equipped loadout so every avatar (top-nav chip, profile
      // hero, leaderboard) reflects the player's cosmetics on first paint —
      // not just after they open the wardrobe.
      if (data.equipped) setUser((u) => (u ? { ...u, equipped: data.equipped } : u))
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
      const last = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10)
      if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
        // Session went stale while away — require a fresh login.
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        localStorage.removeItem(ACTIVITY_KEY)
        setSessionNotice('You were logged out after 4 hours of inactivity. Please log in again.')
      } else {
        try {
          const userData = JSON.parse(savedUser)
          setIsAuthenticated(true)
          setUser(userData)
          setCurrentPage('home')
          localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
          checkPlacement(token)
        } catch (err) {
          console.error('Error parsing saved user:', err)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
        }
      }
    }

    setLoading(false)
  }, [])

  // ── Inactivity auto-logout (4h) ───────────────────────────────────────
  // Logs the user out after INACTIVITY_LIMIT_MS with no interaction. The last
  // activity time is persisted, so the timer also covers closed tabs / reloads.
  useEffect(() => {
    if (!isAuthenticated) return
    let lastWrite = 0
    const record = () => {
      const now = Date.now()
      if (now - lastWrite > 30000) { lastWrite = now; localStorage.setItem(ACTIVITY_KEY, String(now)) }
    }
    const check = () => {
      const last = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10)
      if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
        forceLogout('You were logged out after 4 hours of inactivity. Please log in again.')
      }
    }
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()))  // fresh start on entry
    const evts = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    evts.forEach((e) => window.addEventListener(e, record, { passive: true }))
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    const timer = setInterval(check, 60000)
    return () => {
      evts.forEach((e) => window.removeEventListener(e, record))
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
      clearInterval(timer)
    }
  }, [isAuthenticated, forceLogout])

  // ── Global 401 handler ────────────────────────────────────────────────
  // If any authenticated API call returns 401 (token expired / invalid), tear
  // the session down cleanly instead of letting the app half-work.
  useEffect(() => {
    const orig = window.fetch
    window.fetch = async (...args) => {
      const res = await orig(...args)
      try {
        if (res && res.status === 401 && localStorage.getItem('auth_token')) {
          const a0 = args[0]
          const url = typeof a0 === 'string' ? a0 : (a0 && a0.url) || ''
          if (url.includes(API_BASE_URL)) {
            forceLogout('Your session expired. Please log in again.')
          }
        }
      } catch (_) { /* never let the interceptor break a request */ }
      return res
    }
    return () => { window.fetch = orig }
  }, [forceLogout])

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

  // Keep the cached user in sync (esp. the equipped loadout) so a reload
  // shows the customised avatar instantly — independent of any network call.
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
  }, [user])

  const handleLoginSuccess = (token, userData) => {
    setSessionNotice(null)
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentPage('home')
    setIsSignup(false)
    checkPlacement(token)
  }

  const handleSignupSuccess = (token, userData) => {
    setSessionNotice(null)
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
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
      case 'customize':
        return <CustomizePage user={user} onUserUpdate={setUser} onBack={() => setCurrentPage('settings')} />
      case 'daily':
        return <DailyChallenge authToken={localStorage.getItem('auth_token')} subject="Physics" onExit={() => setCurrentPage('home')} />
      case 'dashboard':
        return <Dashboard authToken={localStorage.getItem('auth_token')} />
      case 'saved':
        return <SavedQuizzes authToken={localStorage.getItem('auth_token')} onRetake={handleRetakeQuiz} />
      case 'history':
        return <History authToken={localStorage.getItem('auth_token')} />
      case 'preferences':
        return <SettingsPage user={user} onUserUpdate={setUser}
                             onLogout={handleLogout} onNavigate={setCurrentPage}
                             isTeacher={!!user?.is_teacher} viewAsStudent={viewAsStudent}
                             onBackToTeacher={() => { setViewAsStudent(false); setCurrentPage('home') }} />
      case 'settings':
        return <Settings onLogout={handleLogout} user={user} onUserUpdate={setUser} rank={primaryRank}
                         level={primaryLevel} gems={gems} dailyGoal={dailyGoal}
                         freezes={freezes} freezeCap={freezeCap} onFreezesChange={setFreezes}
                         onGemsChange={setGems} onDailyGoalChange={setDailyGoal}
                         onProgressionChange={setProgression} onNavigate={setCurrentPage} />
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
        user?.is_teacher && !viewAsStudent ? (
          // Teachers skip Placement and the student bottom-nav shell — they
          // get the dashboard directly. Read-only; no student-app routes.
          reviewingAttemptId != null ? (
            <Suspense fallback={<PageFallback />}>
              <TeacherAttemptReview
                attemptId={reviewingAttemptId}
                authToken={localStorage.getItem('auth_token')}
                onBack={() => setReviewingAttemptId(null)}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<PageFallback />}>
              <TeacherDashboard
                authToken={localStorage.getItem('auth_token')}
                user={user}
                onLogout={handleLogout}
                onViewAsStudent={() => setViewAsStudent(true)}
                onOpenAttempt={(id) => setReviewingAttemptId(id)}
              />
            </Suspense>
          )
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
            xp={progression?.xp}
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
        <LoginPage onLoginSuccess={handleLoginSuccess} notice={sessionNotice} />
      )}
    </div>
  )
}

export default App

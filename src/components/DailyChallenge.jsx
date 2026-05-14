import React, { useState, useEffect } from 'react'
import './DailyChallenge.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Type-agnostic answer key — "C. lamp X" -> "C", "C" -> "C".
function answerKey(val) {
  if (val === undefined || val === null) return ''
  const s = String(val).trim()
  const m = s.match(/^([A-Da-d])[\.\)\s:\-]?/)
  if (m) return m[1].toUpperCase()
  return s.toUpperCase()
}

export default function DailyChallenge({ authToken, subject = 'Physics', onExit }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [step, setStep] = useState('loading')   // loading | intro | done | quiz | result | error
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [streak, setStreak] = useState(null)
  const [alreadyPassed, setAlreadyPassed] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streakFloor, setStreakFloor] = useState(60)
  const [rank, setRank] = useState(null)

  // Load streak status + today's challenge on mount.
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch(`${API_BASE_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE_URL}/api/daily-challenge?subject=${encodeURIComponent(subject)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.detail || 'Could not load the Daily Challenge')
        return d
      }),
    ])
      .then(([streakData, challenge]) => {
        if (cancelled) return
        setStreak(streakData)
        setQuestions(challenge.questions || [])
        setAlreadyPassed(!!challenge.already_passed_today)
        setStreakFloor(challenge.streak_floor ?? 60)
        setRank(challenge.rank || null)
        setStep(challenge.already_passed_today ? 'done' : 'intro')
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setStep('error')
      })
    return () => { cancelled = true }
  }, [token, subject])

  const refetchChallenge = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/daily-challenge?subject=${encodeURIComponent(subject)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Could not load the Daily Challenge')
      setQuestions(d.questions || [])
      setStreakFloor(d.streak_floor ?? 60)
      setRank(d.rank || null)
      setIdx(0)
      setAnswers({})
      setResult(null)
      setStep('quiz')
    } catch (e) {
      setError(e.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      let correct = 0
      questions.forEach((q, i) => {
        if (answerKey(answers[i]) && answerKey(answers[i]) === answerKey(q.answer)) correct += 1
      })
      const res = await fetch(`${API_BASE_URL}/api/daily-challenge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, score: correct, total: questions.length }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Could not submit the Daily Challenge')
      setResult(d)
      setStreak(d.streak)
      setStep('result')
    } catch (e) {
      setError(e.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  // ---------- LOADING ----------
  if (step === 'loading') {
    return (
      <div className="daily">
        <div className="header-section"><h1>🔥 Daily Challenge</h1></div>
        <div className="daily-loading">Loading today's challenge…</div>
      </div>
    )
  }

  // ---------- ERROR ----------
  if (step === 'error') {
    return (
      <div className="daily">
        <div className="header-section"><h1>🔥 Daily Challenge</h1></div>
        <div className="daily-card">
          <div className="daily-emoji">⚠️</div>
          <h2>Something went wrong</h2>
          <p className="daily-sub">{error}</p>
          <button className="daily-btn-primary" onClick={refetchChallenge} disabled={loading}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const streakNum = (streak && (streak.current ?? streak.current_streak)) || 0

  // ---------- DONE (already passed today) ----------
  if (step === 'done') {
    return (
      <div className="daily">
        <div className="header-section"><h1>🔥 Daily Challenge</h1></div>
        <div className="daily-card daily-center">
          <div className="daily-streak-ring">{streakNum}</div>
          <h2>You're done for today ✓</h2>
          <p className="daily-sub">
            You've already cleared today's Daily Challenge. Your streak is safe —
            come back tomorrow to keep it going.
          </p>
          {onExit && (
            <button className="daily-btn-secondary" onClick={onExit}>Back to app</button>
          )}
        </div>
      </div>
    )
  }

  // ---------- INTRO ----------
  if (step === 'intro') {
    return (
      <div className="daily">
        <div className="header-section"><h1>🔥 Daily Challenge</h1></div>
        <div className="daily-card daily-center">
          <div className="daily-streak-ring">{streakNum}</div>
          <h2>{streakNum > 0 ? `${streakNum}-day streak` : 'Start your streak today'}</h2>
          {rank && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              margin: '2px 0 6px', padding: '4px 12px', borderRadius: 999,
              background: 'rgba(93,169,255,0.12)', border: '1px solid rgba(93,169,255,0.3)',
              fontSize: 13,
            }}>
              <span style={{ fontSize: 15 }}>{rank.tier_icon}</span>
              <strong style={{ color: '#5DA9FF' }}>{rank.tier_name}</strong>
            </div>
          )}
          <p className="daily-sub">
            10 questions picked for you — weighted toward your weaker {subject} topics.
            Score <strong>{streakFloor}% or higher</strong> to earn today's streak. You
            can retry with a fresh set as many times as you need.
          </p>
          <div className="daily-meta-row">
            <span>📚 {subject}</span>
            <span>❓ {questions.length} questions</span>
            <span>🎯 {streakFloor}% to pass</span>
            {streak && <span>🧊 {streak.freezes_available ?? 0} freeze</span>}
          </div>
          <button className="daily-btn-primary" onClick={() => setStep('quiz')}>
            Start today's challenge
          </button>
          <p style={{
            marginTop: 16, fontSize: 13, color: 'var(--text-dim, #93a0c0)',
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(93,169,255,0.08)',
            border: '1px solid rgba(93,169,255,0.2)',
          }}>
            💡 Weak topic tripping you up? Drill it in Practice first — that's how
            you train for this.
          </p>
        </div>
      </div>
    )
  }

  // ---------- RESULT ----------
  if (step === 'result' && result) {
    const passed = result.passed
    const rank = result.rank || {}
    return (
      <div className="daily">
        <div className="header-section"><h1>🔥 Daily Challenge</h1></div>
        <div className="daily-card daily-center">
          {passed ? (
            <>
              <div className="daily-streak-ring daily-streak-win">
                {result.streak.current}
              </div>
              <h2>Streak {result.streak.current} 🔥</h2>
              <p className="daily-sub">
                {result.score}/{result.total} correct · {result.percentage}% — today's
                streak is earned.
                {result.streak.freeze_used && ' A streak freeze covered a missed day.'}
              </p>
              {rank.changed && (
                <div className={`daily-rank-change ${rank.direction}`}>
                  {rank.direction === 'up' ? '▲ Ranked up' : '▼ Rank adjusted'}:{' '}
                  <strong>{rank.old_band} → {rank.new_band}</strong>
                </div>
              )}
              {onExit && (
                <button className="daily-btn-primary" onClick={onExit}>Back to app</button>
              )}
            </>
          ) : (
            <>
              <div className="daily-streak-ring daily-streak-fail">
                {result.percentage}%
              </div>
              <h2>So close — {result.percentage}%</h2>
              <p className="daily-sub">
                You need <strong>{streakFloor}%</strong> to earn today's streak. Your
                streak isn't broken — a fresh set is waiting. Give it another go.
              </p>
              <div className="daily-actions">
                <button className="daily-btn-primary" onClick={refetchChallenge} disabled={loading}>
                  {loading ? 'Loading…' : 'Retry with a fresh set'}
                </button>
                {onExit && (
                  <button className="daily-btn-secondary" onClick={onExit}>Later</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---------- QUIZ ----------
  const q = questions[idx]
  const total = questions.length
  const isLast = idx === total - 1
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]
    return a !== undefined && a !== null && a !== ''
  }).length
  const allAnswered = answeredCount === total
  const setAnswer = (val) => setAnswers({ ...answers, [idx]: val })

  const rawHeaders = q.table_headers || []
  const flatHeaders = Array.isArray(rawHeaders[0]) ? rawHeaders[rawHeaders.length - 1] : rawHeaders

  return (
    <div className="daily">
      <div className="header-section"><h1>🔥 Daily Challenge</h1></div>
      <div className="daily-card daily-quiz">
        <div className="daily-quiz-head">
          <span className="daily-pill">Daily · {subject}</span>
          <span className="daily-progress-text">Question {idx + 1} of {total}</span>
        </div>
        <div className="daily-progress-bar">
          <div className="daily-progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>

        <h2 className="daily-question">{q.question_text}</h2>

        {q.setup_image_url && (
          <div className="daily-image">
            <img src={q.setup_image_url} alt="Question diagram"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}
        {q.option_type === 'IMAGE' && q.image_url && q.image_url !== q.setup_image_url && (
          <div className="daily-image">
            <img src={q.image_url} alt="Answer options"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}

        {q.option_type === 'TABLE' && Array.isArray(q.table_rows) ? (
          <table className="daily-table">
            {flatHeaders.length > 0 && (
              <thead>
                <tr>
                  {flatHeaders.map((h, i) => <th key={i}>{h}</th>)}
                  <th style={{ width: 56 }}>Pick</th>
                </tr>
              </thead>
            )}
            <tbody>
              {q.table_rows.map((row, rIdx) => {
                const letter = (row && typeof row === 'object' ? row._letter : null)
                  || String.fromCharCode(65 + rIdx)
                const selected = answers[idx] === letter
                return (
                  <tr key={rIdx} className={selected ? 'selected' : ''} onClick={() => setAnswer(letter)}>
                    {flatHeaders.map((h, cIdx) => (
                      <td key={cIdx}>{row && typeof row === 'object' ? (row[h] ?? '') : ''}</td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      <input type="radio" checked={selected} onChange={() => setAnswer(letter)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : q.option_type === 'IMAGE' ? (
          <div className="daily-options">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <label key={letter} className={`daily-option ${answers[idx] === letter ? 'selected' : ''}`}>
                <input type="radio" checked={answers[idx] === letter} onChange={() => setAnswer(letter)} />
                <span>{letter}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="daily-options">
            {q.options && String(q.options).split('\n').map((opt, i) => {
              const t = opt.trim()
              if (!t) return null
              const selected = answers[idx] === t
              return (
                <label key={i} className={`daily-option ${selected ? 'selected' : ''}`}>
                  <input type="radio" checked={selected} onChange={() => setAnswer(t)} />
                  <span>{t}</span>
                </label>
              )
            })}
          </div>
        )}

        <div className="daily-nav">
          <button
            className="daily-btn-secondary"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
          >
            ← Previous
          </button>
          <span className="daily-nav-count">{answeredCount}/{total} answered</span>
          {isLast ? (
            <button
              className="daily-btn-primary"
              onClick={submit}
              disabled={loading || !allAnswered}
              title={!allAnswered ? 'Answer all questions to finish' : ''}
            >
              {loading ? 'Scoring…' : allAnswered ? 'Finish challenge' : `${total - answeredCount} left`}
            </button>
          ) : (
            <button className="daily-btn-secondary" onClick={() => setIdx(Math.min(total - 1, idx + 1))}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

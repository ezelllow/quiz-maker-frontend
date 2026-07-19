import React, { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import MathText from './ui/MathText'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function answerKey(val) {
  if (val === undefined || val === null) return ''
  const s = String(val).trim()
  // PSLE Math convention: options "(1) …"–"(4) …", answer "(3)" → key "3"
  const mNum = s.match(/^\((\d+)\)/)
  if (mNum) return mNum[1]
  // Letter options: delimiter (or end-of-string) now REQUIRED after the
  // letter — the old optional delimiter graded "Density increases" as "D"
  // and "Both" as "B", silently mis-scoring sentence-style options.
  const m = s.match(/^([A-Da-d])(?:[\.\)\s:\-]|$)/)
  if (m) return m[1].toUpperCase()
  return s.toUpperCase()
}

// Options-aware grading — keep in sync with QuizMaker.gradeAnswer() and the
// backend's grade_answer(). Resolves full option text ↔ letter mismatches.
function optionLabelAndBody(line, idx) {
  const t = String(line || '').trim()
  let m = t.match(/^\((\d+)\)\s*(.*)$/)
  if (m) return [m[1], m[2]]
  m = t.match(/^([A-Da-d])[\.\)\:\-]?\s+(.*)$/)
  if (m) return [m[1].toUpperCase(), m[2]]
  if (/^[A-Da-d]$/.test(t)) return [t.toUpperCase(), '']
  return [String.fromCharCode(65 + idx), t]
}

function gradeAnswer(userAnswer, correctAnswer, options) {
  const uk = answerKey(userAnswer)
  const ck = answerKey(correctAnswer)
  if (uk && ck && uk === ck) return true
  if (!options || !uk || !ck) return false
  const lines = String(options).split('\n').map((s) => s.trim()).filter(Boolean)
  if (lines.length === 0) return false
  const resolve = (raw, key) => {
    const s = String(raw ?? '').trim().toUpperCase()
    for (let i = 0; i < lines.length; i++) {
      const [label, body] = optionLabelAndBody(lines[i], i)
      if (s && (s === lines[i].toUpperCase() || (body && s === body.trim().toUpperCase()))) return label
      if (key && key === answerKey(lines[i])) return label
    }
    return key
  }
  const ru = resolve(userAnswer, uk)
  return !!ru && ru === resolve(correctAnswer, ck)
}

export default function DailyChallenge({ authToken, subject = 'Physics', onExit }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [step, setStep] = useState('loading')
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [streak, setStreak] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streakFloor, setStreakFloor] = useState(60)
  const [rank, setRank] = useState(null)

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
        setStreakFloor(challenge.streak_floor ?? 60)
        setRank(challenge.rank || null)
        setStep(challenge.already_passed_today ? 'done' : 'intro')
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setStep('error') } })
    return () => { cancelled = true }
  }, [token, subject])

  const refetchChallenge = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/daily-challenge?subject=${encodeURIComponent(subject)}`,
        { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Could not load the Daily Challenge')
      setQuestions(d.questions || [])
      setStreakFloor(d.streak_floor ?? 60)
      setRank(d.rank || null)
      setIdx(0); setAnswers({}); setResult(null); setStep('quiz')
    } catch (e) { setError(e.message); setStep('error') } finally { setLoading(false) }
  }

  const submit = async () => {
    setLoading(true); setError(null)
    try {
      let correct = 0
      questions.forEach((q, i) => {
        if (gradeAnswer(answers[i], q.answer, q.options)) correct += 1
      })
      const res = await fetch(`${API_BASE_URL}/api/daily-challenge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, score: correct, total: questions.length }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Could not submit the Daily Challenge')
      setResult(d); setStreak(d.streak); setStep('result')
    } catch (e) { setError(e.message); setStep('error') } finally { setLoading(false) }
  }

  const streakNum = (streak && (streak.current ?? streak.current_streak)) || 0

  const Wrap = ({ children, narrow = false }) => (
    <Screen width={narrow ? 'narrow' : 'default'} className="py-8">
      <header className="mb-4 text-center">
        <h1 className="!text-2xl !font-black">🔥 Daily Challenge</h1>
      </header>
      {children}
    </Screen>
  )

  // ===== LOADING =====
  if (step === 'loading') {
    return <Wrap narrow><Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading today's challenge…</Card></Wrap>
  }

  // ===== ERROR =====
  if (step === 'error') {
    return (
      <Wrap narrow>
        <Card variant="solid" className="!p-8 text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="!text-xl !font-black mb-2">Something went wrong</h2>
          <p className="text-quiz-muted mb-6">{error}</p>
          <Button3d variant="blue" size="md" full onClick={refetchChallenge} disabled={loading}>Try again</Button3d>
        </Card>
      </Wrap>
    )
  }

  // ===== DONE =====
  if (step === 'done') {
    return (
      <Wrap narrow>
        <Card variant="solid" className="!p-8 text-center">
          <StreakRing value={streakNum} variant="win" />
          <h2 className="!text-2xl !font-black mt-4 mb-2">You're done for today ✓</h2>
          <p className="text-quiz-muted mb-6">
            Today's Daily Challenge is cleared. Your streak is safe — come back tomorrow to keep it going.
          </p>
          {onExit && <Button3d variant="white" size="md" full onClick={onExit}>Back to app</Button3d>}
        </Card>
      </Wrap>
    )
  }

  // ===== INTRO =====
  if (step === 'intro') {
    return (
      <Wrap narrow>
        <Card variant="solid" className="!p-8 text-center">
          <StreakRing value={streakNum} />
          <h2 className="!text-2xl !font-black mt-4 mb-2">
            {streakNum > 0 ? `${streakNum}-day streak` : 'Start your streak today'}
          </h2>
          {rank && (
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full
                            bg-quiz-blue/15 border border-quiz-blue/40 text-sm">
              <span className="text-base">{rank.tier_icon}</span>
              <strong className="text-quiz-blue">{rank.tier_name}</strong>
            </div>
          )}
          <p className="text-quiz-muted leading-relaxed mb-4">
            10 questions, weighted toward your weaker {subject} topics. Score{' '}
            <strong className="text-quiz-text">{streakFloor}% or higher</strong> to earn today's streak.
            Retry with a fresh set as many times as you need.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs font-bold text-quiz-muted">
            <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-quiz-border">📚 {subject}</span>
            <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-quiz-border">❓ {questions.length} questions</span>
            <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-quiz-border">🎯 {streakFloor}% to pass</span>
            {streak && <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-quiz-border">🧊 {streak.freezes_available ?? 0} freeze</span>}
          </div>
          <Button3d variant="green" size="lg" full onClick={() => setStep('quiz')}>
            Start today's challenge
          </Button3d>
          <div className="mt-5 px-3 py-2.5 rounded-2xl bg-quiz-blue/10 border border-quiz-blue/30 text-sm text-left">
            💡 Weak topic tripping you up? Drill it in Practice first — that's how you train for this.
          </div>
        </Card>
      </Wrap>
    )
  }

  // ===== RESULT =====
  if (step === 'result' && result) {
    const passed = result.passed
    const rChange = result.rank || {}
    return (
      <Wrap narrow>
        <Card variant="solid" className="!p-8 text-center">
          {passed ? (
            <>
              <StreakRing value={result.streak.current} variant="win" />
              <h2 className="!text-2xl !font-black mt-4 mb-2">Streak {result.streak.current} 🔥</h2>
              <p className="text-quiz-muted mb-4">
                {result.score}/{result.total} correct · {result.percentage}% — today's streak is earned.
                {result.streak.freeze_used && ' A streak freeze covered a missed day.'}
              </p>
              {rChange.changed && (
                <div className={'rounded-2xl px-4 py-3 mb-4 font-black border-2 ' +
                  (rChange.direction === 'up'
                    ? 'bg-quiz-green/15 border-quiz-green/40 text-quiz-green'
                    : 'bg-quiz-yellow/15 border-quiz-yellow/40 text-quiz-yellow')}>
                  {rChange.direction === 'up' ? '▲ Ranked up' : '▼ Rank adjusted'}:{' '}
                  {rChange.old_band} → {rChange.new_band}
                </div>
              )}
              {onExit && <Button3d variant="green" size="lg" full onClick={onExit}>Back to app</Button3d>}
            </>
          ) : (
            <>
              <StreakRing value={`${result.percentage}%`} variant="fail" />
              <h2 className="!text-2xl !font-black mt-4 mb-2">So close — {result.percentage}%</h2>
              <p className="text-quiz-muted mb-6">
                You need <strong className="text-quiz-text">{streakFloor}%</strong> to earn today's streak.
                Your streak isn't broken — a fresh set is waiting. Give it another go.
              </p>
              <div className="flex flex-col gap-2">
                <Button3d variant="blue" size="lg" full onClick={refetchChallenge} disabled={loading}>
                  {loading ? 'Loading…' : 'Retry with a fresh set'}
                </Button3d>
                {onExit && <Button3d variant="white" size="md" full onClick={onExit}>Later</Button3d>}
              </div>
            </>
          )}
        </Card>
      </Wrap>
    )
  }

  // ===== QUIZ =====
  const q = questions[idx]
  const total = questions.length
  const isLast = idx === total - 1
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]; return a !== undefined && a !== null && a !== ''
  }).length
  const allAnswered = answeredCount === total
  const setAnswer = (val) => setAnswers({ ...answers, [idx]: val })

  const rawHeaders = q.table_headers || []
  const flatHeaders = Array.isArray(rawHeaders[0]) ? rawHeaders[rawHeaders.length - 1] : rawHeaders

  const optionCls = (selected) => [
    'flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all',
    selected
      ? 'bg-quiz-blue/15 border-quiz-blue text-quiz-orange-deep shadow-lg scale-[1.01]'
      : 'bg-white border-quiz-border hover:border-quiz-blue/60 hover:bg-gray-50',
  ].join(' ')

  return (
    <Wrap>
      <Card variant="solid" className="!p-6 sm:!p-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full bg-quiz-orange/20 border border-quiz-orange/40 text-quiz-orange text-xs font-bold">
            Daily · {subject}
          </span>
          <span className="text-sm font-bold text-quiz-muted">Question {idx + 1} of {total}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-quiz-orange via-quiz-yellow to-quiz-green transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>

        <h2 className="!text-xl !font-black leading-snug"><MathText>{q.question_text}</MathText></h2>

        {q.setup_image_url && (
          <div className="rounded-2xl overflow-hidden border border-quiz-border bg-white">
            <img src={q.setup_image_url} alt="Question diagram" className="w-full max-h-80 object-contain"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}
        {q.option_type === 'IMAGE' && q.image_url && q.image_url !== q.setup_image_url && (
          <div className="rounded-2xl overflow-hidden border border-quiz-border bg-white">
            <img src={q.image_url} alt="Answer options" className="w-full max-h-80 object-contain"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}

        {q.option_type === 'TABLE' && Array.isArray(q.table_rows) ? (
          <div className="overflow-x-auto rounded-2xl border border-quiz-border">
            <table className="w-full text-sm">
              {flatHeaders.length > 0 && (
                <thead>
                  <tr className="bg-gray-50">
                    {flatHeaders.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-bold text-quiz-muted">{h}</th>
                    ))}
                    <th className="px-3 py-2 w-16 text-center font-bold text-quiz-muted">Pick</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {q.table_rows.map((row, rIdx) => {
                  const letter = (row && typeof row === 'object' ? row._letter : null)
                    || String.fromCharCode(65 + rIdx)
                  const selected = answers[idx] === letter
                  return (
                    <tr key={rIdx} onClick={() => setAnswer(letter)}
                        className={'cursor-pointer transition-colors ' + (selected ? 'bg-quiz-blue/20' : 'hover:bg-gray-50')}>
                      {flatHeaders.map((h, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 border-t border-quiz-border">
                          <MathText>{row && typeof row === 'object' ? (row[h] ?? '') : ''}</MathText>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center border-t border-quiz-border">
                        <input type="radio" checked={selected} onChange={() => setAnswer(letter)} className="accent-quiz-blue" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : q.option_type === 'IMAGE' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['A', 'B', 'C', 'D'].map((letter) => {
              const selected = answers[idx] === letter
              return (
                <label key={letter} className={optionCls(selected) + ' justify-center'}>
                  <input type="radio" checked={selected} onChange={() => setAnswer(letter)} className="sr-only" />
                  <span className="text-2xl font-black">{letter}</span>
                </label>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {q.options && String(q.options).split('\n').map((opt, i) => {
              const t = opt.trim(); if (!t) return null
              const selected = answers[idx] === t
              return (
                <label key={i} className={optionCls(selected)}>
                  <input type="radio" checked={selected} onChange={() => setAnswer(t)} className="sr-only" />
                  <span className="font-semibold"><MathText>{t}</MathText></span>
                </label>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button3d variant={idx === 0 ? 'disabled' : 'white'} size="md"
            onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
            ← Previous
          </Button3d>
          <span className="text-sm font-bold text-quiz-muted order-3 sm:order-2 w-full sm:w-auto text-center">
            {answeredCount}/{total} answered
          </span>
          {isLast ? (
            <Button3d
              variant={allAnswered ? 'green' : 'disabled'} size="md"
              onClick={submit} disabled={loading || !allAnswered}
              className="order-2 sm:order-3"
            >
              {loading ? 'Scoring…' : allAnswered ? 'Finish challenge' : `${total - answeredCount} left`}
            </Button3d>
          ) : (
            <Button3d variant="orange" size="md" onClick={() => setIdx(Math.min(total - 1, idx + 1))}
                      className="order-2 sm:order-3">
              Next →
            </Button3d>
          )}
        </div>
      </Card>
    </Wrap>
  )
}

function StreakRing({ value, variant }) {
  const baseCls = 'mx-auto w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black border-4 shadow-xl'
  const cls = variant === 'win'
    ? 'bg-gradient-to-br from-quiz-orange to-quiz-red text-white border-quiz-yellow/60'
    : variant === 'fail'
    ? 'bg-gray-50 text-quiz-red border-quiz-red/40'
    : 'bg-gradient-to-br from-quiz-orange/30 to-quiz-red/30 text-white border-quiz-orange/40'
  return <div className={`${baseCls} ${cls}`}>{value}</div>
}

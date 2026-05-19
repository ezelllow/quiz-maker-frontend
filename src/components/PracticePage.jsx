import React, { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import QuizMaker from './QuizMaker'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// PracticePage — 3-step flow modelled on QuizQuest's renderSubjectPicker → setup pattern.
//   picker  → user chooses a subject
//   hub     → that subject's saved quizzes + "Create new" CTA
//   quiz    → QuizMaker (create form → quiz-taking → results)
export default function PracticePage({ authToken, onProgressionChange, onGemsChange, onFreezesChange }) {
  const [step, setStep] = useState('picker')
  const [subject, setSubject] = useState(null)
  const [retakeAttempt, setRetakeAttempt] = useState(null)

  const goPicker = () => { setStep('picker'); setSubject(null); setRetakeAttempt(null) }
  const goHub    = () => { setStep('hub');    setRetakeAttempt(null) }
  const goQuiz   = () => { setStep('quiz') }

  if (step === 'picker') {
    return <SubjectPicker onPick={(s) => { setSubject(s); setStep('hub') }} />
  }

  if (step === 'hub') {
    return (
      <SubjectHub
        authToken={authToken}
        subject={subject}
        onBack={goPicker}
        onCreateNew={goQuiz}
        onRetake={(attempt) => { setRetakeAttempt(attempt); goQuiz() }}
      />
    )
  }

  // step === 'quiz'
  return (
    <QuizMaker
      authToken={authToken}
      retakeAttempt={retakeAttempt}
      onRetakeClear={() => setRetakeAttempt(null)}
      mode="practice"
      initialSubject={subject || 'Physics'}
      onBackToHub={goHub}
      onProgressionChange={onProgressionChange}
      onGemsChange={onGemsChange}
      onFreezesChange={onFreezesChange}
    />
  )
}

// ---------- SubjectPicker ----------
function SubjectPicker({ onPick }) {
  // Static for now — matches what /api/subjects currently returns. Easy swap
  // to a fetched list if subjects becomes data-driven.
  const subjects = [
    {
      id: 'Physics',
      emoji: '⚛️',
      label: 'Physics',
      level: 'O-Level',
      color: '#38bdf8',
      active: true,
      tagline: 'Forces, energy, electricity & more',
    },
    {
      id: 'Math',
      emoji: '➗',
      label: 'Math',
      level: 'O-Level',
      color: '#c084fc',
      active: false,
      tagline: 'Coming soon',
    },
  ]

  return (
    <Screen width="default">
      <header className="mb-6 pt-2">
        <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Practice</div>
        <h1 className="!text-3xl !font-black tracking-tight">Pick a subject</h1>
        <p className="text-quiz-muted font-semibold mt-1 text-sm">What's the vibe today?</p>
      </header>

      <div className="space-y-3">
        {subjects.map((s) => (
          <button
            key={s.id}
            disabled={!s.active}
            onClick={() => s.active && onPick(s.id)}
            className={
              'qq-card-solid !p-4 w-full text-left flex items-center gap-4 transition-transform ' +
              (s.active
                ? 'hover:-translate-y-0.5 cursor-pointer'
                : 'opacity-50 cursor-not-allowed')
            }
            style={{ borderLeft: `6px solid ${s.color}` }}
          >
            <div className="text-5xl shrink-0">{s.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg">{s.label}</div>
              <div className="text-xs font-bold text-quiz-muted">
                {s.level} · {s.tagline}
              </div>
            </div>
            <div className="text-quiz-muted text-2xl shrink-0">
              {s.active ? '›' : '🔒'}
            </div>
          </button>
        ))}
      </div>
    </Screen>
  )
}

// ---------- SubjectHub ----------
function SubjectHub({ authToken, subject, onBack, onCreateNew, onRetake }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API_BASE_URL}/api/history?saved_only=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error('Failed to load saved quizzes'); return r.json() })
      .then((d) => {
        if (cancelled) return
        // Today quiz_attempts has no `subject` column — every attempt is Physics.
        // Filter when multi-subject lands.
        const all = d.attempts || []
        setQuizzes(all)
        setLoading(false)
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [token, subject])

  const subjectMeta = {
    Physics: { emoji: '⚛️', color: '#38bdf8' },
    Math:    { emoji: '➗', color: '#c084fc' },
  }[subject] || { emoji: '📚', color: '#5DA9FF' }

  const formatDate = (s) => {
    const d = new Date(s)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Screen width="default">
      {/* Header */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-bold text-quiz-muted hover:text-quiz-blue mb-2 inline-flex items-center gap-1"
      >
        ← Subjects
      </button>
      <header className="mb-5 flex items-center gap-3">
        <div className="text-4xl shrink-0">{subjectMeta.emoji}</div>
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-widest text-quiz-muted">Practice</div>
          <h1 className="!text-3xl !font-black tracking-tight">{subject}</h1>
        </div>
      </header>

      {/* Big Create-New CTA */}
      <Button3d variant="green" size="lg" full onClick={onCreateNew} className="mb-5">
        🚀 Create new quiz
      </Button3d>

      {/* Saved quizzes */}
      <div className="text-xs font-black uppercase tracking-widest text-quiz-muted mb-2 px-1">
        Your saved quizzes
      </div>

      {loading && (
        <Card variant="solid" className="!p-8 text-center text-quiz-muted">
          Loading saved quizzes…
        </Card>
      )}

      {error && !loading && (
        <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">
          {error}
        </Card>
      )}

      {!loading && !error && quizzes.length === 0 && (
        <Card variant="solid" className="!p-8 text-center">
          <div className="text-5xl mb-2">📝</div>
          <p className="text-quiz-muted font-bold">No saved {subject} quizzes yet. Tap "Create new quiz" to start.</p>
        </Card>
      )}

      {!loading && !error && quizzes.length > 0 && (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <Card key={q.id} variant="solid" className="!p-4 flex items-center gap-3">
              <div className="text-2xl shrink-0">📘</div>
              <div className="flex-1 min-w-0">
                <div className="font-black truncate">{q.name || `Quiz #${q.id}`}</div>
                <div className="flex flex-wrap gap-1.5 mt-1 text-[11px] font-bold text-quiz-muted">
                  {q.subtopic   && <span className="px-2 py-0.5 rounded-full bg-white/5 border border-quiz-border">{q.subtopic}</span>}
                  {q.difficulty && <span className="px-2 py-0.5 rounded-full bg-white/5 border border-quiz-border">{q.difficulty}</span>}
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-quiz-border">{q.total_questions}Q</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-quiz-border">
                    🎯 {q.attempt_count || 1}×
                  </span>
                </div>
                <div className="text-[11px] text-quiz-muted mt-1.5">📅 {formatDate(q.attempted_at)}</div>
              </div>
              <Button3d
                variant="blue"
                size="sm"
                onClick={() => onRetake({
                  id: q.id, subtopic: q.subtopic, difficulty: q.difficulty,
                  count: q.total_questions, isRetake: true,
                })}
              >
                🔄 Retake
              </Button3d>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  )
}

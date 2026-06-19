import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import EmptyState from './ui/EmptyState'
import SectionLabel from './ui/SectionLabel'
import Badge from './ui/Badge'
import Skeleton from './ui/Skeleton'
import { Stagger, StaggerItem } from './ui/Motion'
import TopicCard from './ui/TopicCard'
import { ease, burst, idlePulse } from '../motion'
import QuizMaker from './QuizMaker'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// PracticePage — 3-step flow modelled on QuizQuest's renderSubjectPicker → setup pattern.
//   picker  → user chooses a subject
//   hub     → that subject's saved quizzes + "Create new" CTA
//   quiz    → QuizMaker (create form → quiz-taking → results)
export default function PracticePage({ authToken, onProgressionChange, onGemsChange, onFreezesChange, onQuizActiveChange }) {
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
      onQuizActiveChange={onQuizActiveChange}
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
      tint: 'from-quiz-blue/15 to-quiz-cyan/5',
      tone: 'blue',
      active: true,
      tagline: 'Forces, energy, electricity & more',
    },
    {
      id: 'Math',
      emoji: '➗',
      label: 'Math',
      level: 'O-Level',
      color: '#c084fc',
      tint: 'from-quiz-purple/15 to-quiz-magenta/5',
      tone: 'purple',
      active: false,
      tagline: 'Coming soon',
    },
  ]

  return (
    <Screen width="default">
      <Stagger delay={0.04} step={0.08}>
        {/* Header — same eyebrow + heading + tagline as before */}
        <StaggerItem>
          <header className="mb-6 pt-2">
            <SectionLabel>Practice</SectionLabel>
            <h1 className="!text-3xl !font-black tracking-tight mt-1">Pick a subject</h1>
            <p className="text-quiz-muted font-semibold mt-1 text-sm">What's the vibe today?</p>
          </header>
        </StaggerItem>

        {/* Subject cards — branded TopicCards in a 2-column grid. Locked
            subjects render dimmed and inert via a wrapper div. */}
        <div className="grid grid-cols-2 gap-3">
          {subjects.map((s) => (
            <StaggerItem key={s.id}>
              <div className={s.active ? '' : 'opacity-50 pointer-events-none'}>
                <TopicCard
                  icon={s.emoji}
                  label={s.label}
                  hint={`${s.level} · ${s.tagline}`}
                  tone={s.tone}
                  onClick={s.active ? () => onPick(s.id) : undefined}
                />
                {!s.active && (
                  <div className="text-center text-xs font-bold text-quiz-muted mt-1">🔒 Locked</div>
                )}
              </div>
            </StaggerItem>
          ))}
        </div>
      </Stagger>
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

  // Difficulty → Badge tone for the metadata chips.
  const diffTone = (d) => {
    const k = String(d || '').toLowerCase()
    if (k.startsWith('eas')) return 'ok'
    if (k.startsWith('med')) return 'warn'
    if (k.startsWith('har')) return 'bad'
    return 'muted'
  }

  const formatDate = (s) => {
    const d = new Date(s)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Screen width="default">
      <Stagger delay={0.04} step={0.06}>
        {/* Back link — was a plain text button, now an IconButton for tap feel. */}
        <StaggerItem>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-quiz-muted hover:text-quiz-blue mb-2 inline-flex items-center gap-1 transition-colors"
          >
            ← Subjects
          </button>
        </StaggerItem>

        {/* Header — same content (subject emoji + Practice eyebrow + subject name).
            The emoji bursts in on mount for a satisfying entrance. */}
        <StaggerItem>
          <header className="mb-5 flex items-center gap-3">
            <motion.div
              className="text-4xl shrink-0"
              initial={burst.initial}
              animate={burst.animate}
              style={{ filter: `drop-shadow(0 4px 14px ${subjectMeta.color}66)` }}
            >
              {subjectMeta.emoji}
            </motion.div>
            <div className="min-w-0">
              <SectionLabel>Practice</SectionLabel>
              <h1 className="!text-3xl !font-black tracking-tight">{subject}</h1>
            </div>
          </header>
        </StaggerItem>

        {/* Big Create-New CTA — wrapped in idlePulse so it gently breathes,
            inviting the tap (Duolingo-style hero CTA). */}
        <StaggerItem>
          <motion.div {...idlePulse} className="mb-5">
            <Button3d variant="orange" size="lg" full onClick={onCreateNew}>🚀 Create new quiz
            </Button3d>
          </motion.div>
        </StaggerItem>

        {/* Saved quizzes list */}
        <StaggerItem>
          <SectionLabel className="mb-2 px-1">Your saved quizzes</SectionLabel>
        </StaggerItem>

        {loading && (
          <StaggerItem>
            {/* Skeleton placeholders — 3 card-shaped pulsing blocks instead of
                a flat "Loading…" string. Feels alive while data arrives. */}
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Card key={i} variant="solid" className="!p-4 flex items-center gap-3">
                  <Skeleton shape="circle" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton width="w-2/3" />
                    <Skeleton width="w-1/2" height="h-2" />
                  </div>
                  <Skeleton shape="block" width="w-20" height="h-9" />
                </Card>
              ))}
            </div>
          </StaggerItem>
        )}

        {error && !loading && (
          <StaggerItem>
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={ease.spring}
            >
              <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">
                {error}
              </Card>
            </motion.div>
          </StaggerItem>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <StaggerItem>
            <EmptyState
              icon="📝"
              body={`No saved ${subject} quizzes yet. Tap "Create new quiz" to start.`}
            />
          </StaggerItem>
        )}

        {!loading && !error && quizzes.length > 0 && (
          <div className="space-y-3">
            {quizzes.map((q) => (
              <StaggerItem key={q.id}>
                <Card variant="solid" interactive className="!p-4 flex items-center gap-3">
                  <div className="text-2xl shrink-0">📘</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black truncate">{q.name || `Quiz #${q.id}`}</div>
                    {/* Metadata chips — Badge primitive instead of bespoke pill markup.
                        Difficulty gets a tone matching its rank (easy=ok, medium=warn,
                        hard=bad) so colour communicates the level at a glance. */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {q.subtopic   && <Badge tone="muted">{q.subtopic}</Badge>}
                      {q.difficulty && <Badge tone={diffTone(q.difficulty)}>{q.difficulty}</Badge>}
                      <Badge tone="muted">{q.total_questions}Q</Badge>
                      <Badge tone="accent" icon="🎯">{q.attempt_count || 1}×</Badge>
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
              </StaggerItem>
            ))}
          </div>
        )}
      </Stagger>
    </Screen>
  )
}

import React, { useEffect, useState } from 'react'
import MathText from './ui/MathText'

// TeacherStudentDrillIn — modal that opens when a teacher clicks a student row
// in the dashboard. Shows the student's recent quiz attempts and lets the
// teacher expand any attempt to see exactly which questions they got wrong.
//
// Two round-trips:
//   - /api/teacher/students/{id}        on open  (summary + recent attempts list)
//   - /api/teacher/attempts/{aid}        per row (full per-question review,
//                                                 fetched on first expand)
//
// Esc closes the modal. Backdrop click closes the modal. The body is
// scroll-locked while open so the page below doesn't scroll under us.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function TeacherStudentDrillIn({ studentId, authToken, onClose, onOpenAttempt }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [data, setData]       = useState(null)        // { student, attempts }
  const [err, setErr]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [openAttemptId, setOpenAttemptId] = useState(null)        // currently expanded id
  const [attemptDetail, setAttemptDetail] = useState({})          // { [id]: { loading, err, data } }

  // Initial load — student card + attempts list.
  useEffect(() => {
    if (!studentId || !token) return
    let cancelled = false
    setLoading(true); setErr(null)
    fetch(`${API_BASE_URL}/api/teacher/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.text().catch(() => '')
          throw new Error(`HTTP ${r.status}${body ? ` — ${body.slice(0, 120)}` : ''}`)
        }
        return r.json()
      })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch((e) => { if (!cancelled) { setErr(String(e.message || e)); setLoading(false) } })
    return () => { cancelled = true }
  }, [studentId, token])

  // Esc to close + scroll lock while open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Lazy-fetch full per-question detail for one attempt on first expand.
  const toggleAttempt = (id) => {
    const nextOpen = openAttemptId === id ? null : id
    setOpenAttemptId(nextOpen)
    if (nextOpen && !attemptDetail[id]) {
      setAttemptDetail((m) => ({ ...m, [id]: { loading: true, err: null, data: null } }))
      fetch(`${API_BASE_URL}/api/teacher/attempts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (r) => {
          if (!r.ok) {
            const body = await r.text().catch(() => '')
            throw new Error(`HTTP ${r.status}${body ? ` — ${body.slice(0, 120)}` : ''}`)
          }
          return r.json()
        })
        .then((d) => setAttemptDetail((m) => ({ ...m, [id]: { loading: false, err: null, data: d } })))
        .catch((e) => setAttemptDetail((m) => ({ ...m, [id]: { loading: false, err: String(e.message || e), data: null } })))
    }
  }

  const student = data?.student
  const attempts = data?.attempts || []

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-6"
         onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-quiz-border qq-card-solid !p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-quiz-border bg-black/5">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">Student</div>
            <div className="font-black text-base sm:text-lg truncate">
              {student?.name || (loading ? 'Loading…' : 'Student')}
            </div>
            {student?.email && (
              <div className="text-[11px] text-quiz-muted font-bold truncate">{student.email}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-black border border-quiz-border hover:bg-black/5 transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* ===== Body ===== */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {loading && (
            <div className="text-center py-12 text-quiz-muted font-bold">⏳ Loading student…</div>
          )}

          {err && !loading && (
            <div className="rounded-2xl border-2 border-quiz-red/40 bg-quiz-red/10 px-4 py-3 text-quiz-red font-bold text-sm">
              Couldn't load student: {err}
            </div>
          )}

          {student && !loading && !err && (
            <>
              {/* Summary tiles for this student */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <SummaryTile label="Streak"      value={`🔥 ${student.current_streak}`} hint={`longest ${student.longest_streak}d`} />
                <SummaryTile label="Attempts"    value={student.total_attempts} hint="all-time" />
                <SummaryTile label="Avg score"   value={student.lifetime_avg_pct == null ? '—' : `${Math.round(student.lifetime_avg_pct)}%`} hint="all-time" />
                <SummaryTile label="Joined"      value={student.created_at ? new Date(student.created_at).toLocaleDateString() : '—'} />
              </div>

              {/* Attempts list */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted mb-2">
                  Recent attempts ({student.total_attempts > attempts.length
                    ? `showing ${attempts.length} of ${student.total_attempts}`
                    : attempts.length}) · click any attempt to open the full quiz
                </div>
                {attempts.length === 0 ? (
                  <div className="rounded-xl border border-quiz-border bg-black/5 px-3 py-6 text-center text-quiz-muted font-bold text-sm">
                    No attempts yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {attempts.map((a) => (
                      <AttemptRow
                        key={a.id}
                        attempt={a}
                        onOpen={() => onOpenAttempt && onOpenAttempt(a.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== helpers ===============================================================

function SummaryTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-quiz-border bg-black/5 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">{label}</div>
      <div className="text-base sm:text-lg font-black mt-0.5">{value}</div>
      {hint && <div className="text-[10px] text-quiz-muted mt-0.5 font-bold truncate">{hint}</div>}
    </div>
  )
}

function AttemptRow({ attempt, onOpen }) {
  const pct = Number(attempt.percentage || 0)
  const passing = pct >= 60
  const dateLabel = attempt.attempted_at
    ? new Date(attempt.attempted_at).toLocaleString()
    : '—'
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-xl border border-quiz-border bg-black/5
                 px-3 py-2 flex items-center gap-3 cursor-pointer
                 hover:bg-black/10 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="font-black text-sm truncate">
          {attempt.subtopic || attempt.name || 'Quiz'}
        </div>
        <div className="text-[11px] text-quiz-muted font-bold mt-0.5">
          {attempt.score}/{attempt.total_questions} correct
          {' · '}{attempt.difficulty || '—'}
          {' · '}{attempt.quiz_type}
          {' · '}{dateLabel}
        </div>
      </div>
      <span className={
        'shrink-0 px-2 py-1 rounded-full text-[11px] font-black ' +
        (passing
          ? 'bg-quiz-green/15 border border-quiz-green/40 text-quiz-green'
          : 'bg-quiz-red/15 border border-quiz-red/40 text-quiz-red')
      }>
        {pct}%
      </span>
      <span aria-hidden="true" className="shrink-0 text-quiz-muted text-base leading-none">›</span>
    </button>
  )
}

function QuestionReview({ q, index }) {
  // The saved per-question shape varies — handle both legacy and new fields.
  const userAns    = q.user_answer ?? q.userAnswer ?? '—'
  const correctAns = q.correct_answer ?? q.correctAnswer ?? q.answer ?? '—'
  const isCorrect  = q.is_correct ?? q.isCorrect ?? (String(userAns).trim() === String(correctAns).trim())
  const text       = q.question_text ?? q.text ?? `Question ${index + 1}`
  const subtopic   = q.subtopic
  const explanation = q.explanation
  return (
    <div className={
      'rounded-lg border px-3 py-2 ' +
      (isCorrect
        ? 'border-quiz-green/30 bg-quiz-green/5'
        : 'border-quiz-red/30 bg-quiz-red/5')
    }>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
            Q{index + 1}{subtopic ? ` · ${subtopic}` : ''}
          </div>
          <div className="text-sm font-bold mt-0.5 whitespace-pre-wrap break-words"><MathText>{text}</MathText></div>
        </div>
        <span className={
          'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ' +
          (isCorrect
            ? 'bg-quiz-green/15 border border-quiz-green/40 text-quiz-green'
            : 'bg-quiz-red/15 border border-quiz-red/40 text-quiz-red')
        }>
          {isCorrect ? '✓ correct' : '✗ wrong'}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-bold">
        <div className="rounded-md px-2 py-1 border border-quiz-border bg-black/5">
          <span className="text-quiz-muted">They picked:</span>{' '}
          <span className={isCorrect ? 'text-quiz-green' : 'text-quiz-red'}>
            {String(userAns) || '—'}
          </span>
        </div>
        <div className="rounded-md px-2 py-1 border border-quiz-border bg-black/5">
          <span className="text-quiz-muted">Correct:</span>{' '}
          <span className="text-quiz-green">{String(correctAns) || '—'}</span>
        </div>
      </div>
      {explanation && (
        <div className="mt-2 text-[12px] font-semibold text-quiz-text leading-relaxed whitespace-pre-line">
          <span className="font-black">Why: </span><MathText>{explanation}</MathText>
        </div>
      )}
    </div>
  )
}

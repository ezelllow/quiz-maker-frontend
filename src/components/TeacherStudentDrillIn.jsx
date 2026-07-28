import React, { useEffect, useState } from 'react'
import MathText from './ui/MathText'
import Icon from './ui/Icon'

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

export default function TeacherStudentDrillIn({ studentId, authToken, onClose, onOpenAttempt, onDeleted }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [data, setData]       = useState(null)        // { student, attempts }
  const [err, setErr]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [openAttemptId, setOpenAttemptId] = useState(null)        // currently expanded id
  const [attemptDetail, setAttemptDetail] = useState({})          // { [id]: { loading, err, data } }

  // ── Account management (reset password / delete account) ──────────────────
  const [busy, setBusy]                 = useState(null)   // 'reset' | 'delete' | null
  const [actionErr, setActionErr]       = useState(null)
  const [tempPassword, setTempPassword] = useState(null)  // { value, google } once reset
  const [confirmReset, setConfirmReset]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied]             = useState(false)

  // Initial load — student card + attempts list.
  useEffect(() => {
    if (!studentId || !token) return
    let cancelled = false
    // Clear any account-management state from a previously viewed student.
    setTempPassword(null); setConfirmReset(false); setConfirmDelete(false)
    setActionErr(null); setBusy(null); setCopied(false)
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

  // Reset this student's password → backend returns a one-time temp password.
  const handleResetPassword = () => {
    if (!student || busy) return
    setBusy('reset'); setActionErr(null); setTempPassword(null); setCopied(false)
    setConfirmReset(false)
    fetch(`${API_BASE_URL}/api/teacher/students/${student.id}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const b = await r.text().catch(() => '')
          throw new Error(`HTTP ${r.status}${b ? ` — ${b.slice(0, 140)}` : ''}`)
        }
        return r.json()
      })
      .then((d) => { setTempPassword({ value: d.temp_password, google: !!d.google_account }); setBusy(null) })
      .catch((e) => { setActionErr(String(e.message || e)); setBusy(null) })
  }

  const copyTempPassword = () => {
    if (!tempPassword) return
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500) }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(tempPassword.value).then(done).catch(() => {})
    }
  }

  // Permanently delete this student's account (cascades all their data).
  const handleDeleteAccount = () => {
    if (!student || busy) return
    setBusy('delete'); setActionErr(null)
    fetch(`${API_BASE_URL}/api/teacher/students/${student.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const b = await r.text().catch(() => '')
          throw new Error(`HTTP ${r.status}${b ? ` — ${b.slice(0, 140)}` : ''}`)
        }
        return r.json()
      })
      .then(() => {
        setBusy(null)
        onDeleted && onDeleted(student.id)   // tells the dashboard to refresh
        onClose && onClose()
      })
      .catch((e) => { setActionErr(String(e.message || e)); setBusy(null); setConfirmDelete(false) })
  }

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
            <Icon name="x" className="inline-block w-4 h-4 align-[-0.2em] mr-1" />Close
          </button>
        </div>

        {/* ===== Body ===== */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          {loading && (
            <div className="text-center py-12 text-quiz-muted font-bold"><Icon name="loader" className="inline-block w-5 h-5 align-[-0.25em] animate-spin mr-1" /> Loading student…</div>
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
                <SummaryTile label="Streak"      value={<><Icon name="flame" className="inline-block w-[1em] h-[1em] align-[-0.15em] text-quiz-orange" /> {student.current_streak}</>} hint={`longest ${student.longest_streak}d`} />
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

        {/* ===== Teacher actions — manage this student's account ===== */}
        {student && !loading && !err && (
          <div className="border-t border-quiz-border bg-black/5 px-4 sm:px-5 py-3 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
              Manage account
            </div>

            {actionErr && (
              <div className="rounded-lg border-2 border-quiz-red/40 bg-quiz-red/10 px-3 py-2 text-quiz-red font-bold text-xs">
                {actionErr}
              </div>
            )}

            {/* One-time temp password reveal after a reset */}
            {tempPassword && (
              <div className="rounded-xl border-2 border-quiz-green/40 bg-quiz-green/10 px-3 py-3">
                <div className="text-[11px] font-black text-quiz-green uppercase tracking-widest mb-1.5">
                  Password reset — new password
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono font-black text-base sm:text-lg tracking-wider bg-black/10 rounded-lg px-3 py-2 break-all">
                    {tempPassword.value}
                  </code>
                  <button
                    onClick={copyTempPassword}
                    className="shrink-0 px-3 py-2 rounded-lg text-xs font-black border border-quiz-green/50 text-quiz-green hover:bg-quiz-green/15 transition-colors"
                  >
                    {copied ? <><Icon name="check" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> Copied</> : 'Copy'}
                  </button>
                </div>
                <div className="text-[11px] text-quiz-muted font-bold mt-2 leading-relaxed">
                  {student.name} can now sign in with this password and change it later in Settings.
                  {tempPassword.google && ' This is a Google account, so they can also keep signing in with Google.'}
                </div>
              </div>
            )}

            {/* Reset: warning + confirm so it can't be a stray click */}
            {confirmReset ? (
              <div className="rounded-xl border-2 border-quiz-orange/40 bg-quiz-orange/10 px-3 py-3">
                <div className="text-sm font-black text-quiz-orange">
                  <Icon name="alert" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> Reset {student.name}&apos;s password?
                </div>
                <div className="text-[11px] text-quiz-muted font-bold mt-1 leading-relaxed">
                  Their password will be changed to the default <span className="font-mono font-black">Curious</span>.
                  Their current password will stop working. Tell {student.name} to sign in with
                  <span className="font-mono font-black"> Curious</span> and change it in Settings.
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setConfirmReset(false)}
                    disabled={busy === 'reset'}
                    className="px-3 py-1.5 rounded-full text-xs font-black border border-quiz-border hover:bg-black/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={busy === 'reset'}
                    className="px-3 py-1.5 rounded-full text-xs font-black text-white bg-quiz-orange hover:brightness-110 transition disabled:opacity-50"
                  >
                    {busy === 'reset' ? 'Resetting…' : 'Yes, reset to “Curious”'}
                  </button>
                </div>
              </div>
            ) : confirmDelete ? (
              /* Delete: warning + confirm so it can't be a stray click */
              <div className="rounded-xl border-2 border-quiz-red/40 bg-quiz-red/10 px-3 py-3">
                <div className="text-sm font-black text-quiz-red">
                  <Icon name="alert" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> Delete {student.name}&apos;s account?
                </div>
                <div className="text-[11px] text-quiz-muted font-bold mt-1 leading-relaxed">
                  This permanently removes their login and ALL their data — quiz history,
                  streaks and progress. This cannot be undone.
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy === 'delete'}
                    className="px-3 py-1.5 rounded-full text-xs font-black border border-quiz-border hover:bg-black/5 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={busy === 'delete'}
                    className="px-3 py-1.5 rounded-full text-xs font-black text-white bg-quiz-red hover:brightness-110 transition disabled:opacity-50"
                  >
                    {busy === 'delete' ? 'Deleting…' : 'Yes, delete permanently'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { setConfirmReset(true); setActionErr(null) }}
                  disabled={!!busy}
                  className="px-3 py-2 rounded-full text-xs font-black border border-quiz-blue/50 text-quiz-blue hover:bg-quiz-blue/10 transition-colors disabled:opacity-50"
                >
                  <Icon name="lock" className="inline-block w-4 h-4 align-[-0.2em] mr-1" />Reset password
                </button>
                <button
                  onClick={() => { setConfirmDelete(true); setActionErr(null) }}
                  disabled={!!busy}
                  className="px-3 py-2 rounded-full text-xs font-black border border-quiz-red/50 text-quiz-red hover:bg-quiz-red/10 transition-colors disabled:opacity-50"
                >
                  <Icon name="x-circle" className="inline-block w-4 h-4 align-[-0.2em] mr-1" />Delete account
                </button>
              </div>
            )}
          </div>
        )}
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
          {isCorrect ? <><Icon name="check" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> correct</> : <><Icon name="x" className="inline-block w-[1em] h-[1em] align-[-0.15em]" /> wrong</>}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-bold">
        <div className="rounded-md px-2 py-1 border border-quiz-border bg-black/5">
          <span className="text-quiz-muted">They picked:</span>{' '}
          <span className={isCorrect ? 'text-quiz-green' : 'text-quiz-red'}>
            <MathText>{String(userAns) || '—'}</MathText>
          </span>
        </div>
        <div className="rounded-md px-2 py-1 border border-quiz-border bg-black/5">
          <span className="text-quiz-muted">Correct:</span>{' '}
          <span className="text-quiz-green"><MathText>{String(correctAns) || '—'}</MathText></span>
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

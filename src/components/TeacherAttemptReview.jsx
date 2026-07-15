import React, { useEffect, useState } from 'react'

// TeacherAttemptReview — full-page review of a single student quiz attempt.
//
// One fetch: /api/teacher/attempts/{attemptId}. Renders every question with
// its text, setup diagram (if any), options (TEXT / TABLE / IMAGE), the
// student's answer next to the correct answer, color-coded right/wrong, and
// the answer explanation when present.
//
// Read-only — no quiz interaction. The header has a "Back" button that
// returns the teacher to the dashboard. Esc also goes back.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function TeacherAttemptReview({ attemptId, authToken, onBack }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [data, setData]       = useState(null)
  const [err, setErr]         = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!attemptId || !token) return
    let cancelled = false
    setLoading(true); setErr(null)
    fetch(`${API_BASE_URL}/api/teacher/attempts/${attemptId}`, {
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
  }, [attemptId, token])

  // Esc returns to the dashboard.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onBack && onBack() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onBack])

  const attempt   = data?.attempt
  const questions = attempt?.questions || []
  const pct       = Number(attempt?.percentage || 0)
  const dateLabel = attempt?.attempted_at
    ? new Date(attempt.attempted_at).toLocaleString()
    : ''

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Top bar ===== */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--quiz-bg-2) 85%, transparent)',
          borderBottomColor: 'var(--quiz-border)',
        }}
      >
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3 px-4 py-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-full text-xs font-black border border-quiz-border
                       hover:bg-black/5 transition-colors"
          >
            ← Back
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
              Attempt review
            </div>
            <div className="font-black text-sm truncate">
              {attempt?.student_name || (loading ? 'Loading…' : 'Student')}
              {attempt?.subtopic && (
                <> · <span className="text-quiz-muted">{attempt.subtopic}</span></>
              )}
            </div>
          </div>
          {attempt && (
            <span className={
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-black ' +
              (pct >= 60
                ? 'bg-quiz-green/15 border border-quiz-green/40 text-quiz-green'
                : 'bg-quiz-red/15 border border-quiz-red/40 text-quiz-red')
            }>
              {attempt.score}/{attempt.total_questions} · {pct}%
            </span>
          )}
        </div>
      </header>

      {/* ===== Body ===== */}
      <main className="max-w-3xl mx-auto w-full flex-1 px-4 py-5 sm:py-6 space-y-4">
        {loading && (
          <div className="text-center py-24 text-quiz-muted font-bold">⏳ Loading attempt…</div>
        )}

        {err && !loading && (
          <div className="rounded-2xl border-2 border-quiz-red/40 bg-quiz-red/10 px-4 py-3 text-quiz-red font-bold text-sm">
            Couldn't load attempt: {err}
            <button
              onClick={onBack}
              className="ml-3 underline text-quiz-blue text-xs font-bold"
            >Back</button>
          </div>
        )}

        {attempt && !loading && !err && (
          <>
            {/* Attempt summary card */}
            <div className="rounded-2xl border border-quiz-border qq-card-solid !p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
                {attempt.quiz_type || 'practice'} · {attempt.difficulty || '—'}
              </div>
              <div className="font-black text-base mt-0.5">
                {attempt.subtopic || attempt.name || 'Quiz'}
              </div>
              {(attempt.student_email || dateLabel) && (
                <div className="text-[11px] text-quiz-muted font-bold mt-1 truncate">
                  {attempt.student_email}{attempt.student_email && dateLabel ? ' · ' : ''}{dateLabel}
                </div>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="rounded-2xl border border-quiz-border qq-card-solid !p-6 text-center text-quiz-muted font-bold text-sm">
                No per-question detail stored for this attempt.
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <QuestionReview key={i} q={q} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ===== helpers ===============================================================

function QuestionReview({ q, index }) {
  // Field-name tolerance — saved attempts vary across versions.
  const userAns    = q.user_answer ?? q.userAnswer ?? ''
  const correctAns = q.correct_answer ?? q.correctAnswer ?? q.answer ?? ''
  const isCorrect  = q.is_correct ?? q.isCorrect
    ?? (String(userAns).trim().toUpperCase() === String(correctAns).trim().toUpperCase())
  const text       = q.question_text ?? q.text ?? ''
  const subtopic   = q.subtopic
  const explanation = q.explanation
  const optionType = (q.option_type || 'TEXT').toUpperCase()
  const setupUrl   = q.setup_image_url || null
  // For IMAGE-type options, image_url is the bundle of all option diagrams.
  const optionsImageUrl = optionType === 'IMAGE' ? q.image_url : null

  return (
    <div className={
      'rounded-2xl border-2 qq-card-solid !p-4 ' +
      (isCorrect ? 'border-quiz-green/40' : 'border-quiz-red/40')
    }>
      {/* Header row: Qn + topic eyebrow + right/wrong badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-quiz-muted">
            Question {index + 1}{subtopic ? ` · ${subtopic}` : ''}
          </div>
        </div>
        <span className={
          'shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' +
          (isCorrect
            ? 'bg-quiz-green/15 border border-quiz-green/40 text-quiz-green'
            : 'bg-quiz-red/15 border border-quiz-red/40 text-quiz-red')
        }>
          {isCorrect ? '✓ Correct' : '✗ Wrong'}
        </span>
      </div>

      {/* Question text */}
      {text && (
        <div className="text-sm font-bold mb-3 whitespace-pre-wrap break-words leading-relaxed">
          {text}
        </div>
      )}

      {/* Setup diagram (if any) */}
      {setupUrl && (
        <div className="mb-3 rounded-xl border border-quiz-border bg-white p-2 flex justify-center">
          <img
            src={setupUrl}
            alt="Question diagram"
            className="max-w-full h-auto rounded"
            loading="lazy"
          />
        </div>
      )}

      {/* Options */}
      <Options q={q} optionType={optionType} correctKey={letterOf(correctAns)} userKey={letterOf(userAns)} optionsImageUrl={optionsImageUrl} />

      {/* Student vs correct summary */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-bold">
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

      {/* Explanation */}
      {explanation && (
        <div className="mt-3 rounded-xl border border-quiz-border bg-black/5 px-3 py-2 text-[13px] font-semibold leading-relaxed whitespace-pre-line">
          <span className="font-black">Why: </span>{explanation}
        </div>
      )}
    </div>
  )
}

// Pull the option label out of an answer string ("A) north" -> "A", "C" -> "C",
// "(3) 45 cm²" -> "3"). Delimiter (or end) REQUIRED after a letter so sentence
// answers like "Density increases" don't wrongly highlight option D — same
// normalization rules as the graders in QuizMaker and the backend.
function letterOf(s) {
  const t = String(s ?? '').trim()
  const mNum = t.match(/^\((\d+)\)/)
  if (mNum) return mNum[1]
  const m = t.match(/^([A-Da-d])(?:[\.\)\s:\-]|$)/)
  return m ? m[1].toUpperCase() : ''
}

// Render the option block based on option_type. Highlights the correct option
// in green and the student's wrong pick in red.
function Options({ q, optionType, correctKey, userKey, optionsImageUrl }) {
  if (optionType === 'IMAGE') {
    // All options are baked into a single diagram image.
    return (
      <div className="space-y-2">
        {optionsImageUrl && (
          <div className="rounded-xl border border-quiz-border bg-white p-2 flex justify-center">
            <img src={optionsImageUrl} alt="Options diagram" className="max-w-full h-auto rounded" loading="lazy" />
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {['A', 'B', 'C', 'D'].map((L) => (
            <OptionTile key={L} letter={L} correctKey={correctKey} userKey={userKey} />
          ))}
        </div>
      </div>
    )
  }

  if (optionType === 'TABLE' && Array.isArray(q.table_rows)) {
    const headers = Array.isArray(q.table_headers) ? q.table_headers : []
    const flatHeaders = Array.isArray(headers[0]) ? headers[headers.length - 1] : headers
    return (
      <div className="overflow-x-auto rounded-xl border border-quiz-border">
        <table className="w-full text-sm">
          {flatHeaders.length > 0 && (
            <thead><tr className="bg-black/5">
              <th className="px-3 py-2 w-12 text-center font-bold text-quiz-muted">#</th>
              {flatHeaders.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-bold text-quiz-muted">{h}</th>
              ))}
            </tr></thead>
          )}
          <tbody>
            {q.table_rows.map((row, rIdx) => {
              const letter = (row && row._letter) || String.fromCharCode(65 + rIdx)
              const cells = flatHeaders.length > 0
                ? flatHeaders.map((h) => (row ? (row[h] ?? '') : ''))
                : (Array.isArray(row?._cells) ? row._cells : [])
              const isCorrectRow = letter === correctKey
              const isWrongPick  = letter === userKey && letter !== correctKey
              const rowCls = isCorrectRow
                ? 'bg-quiz-green/15'
                : isWrongPick
                ? 'bg-quiz-red/15'
                : ''
              return (
                <tr key={rIdx} className={rowCls}>
                  <td className="px-3 py-2 border-t border-quiz-border text-center font-black text-quiz-blue">
                    {letter}
                  </td>
                  {cells.map((c, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 border-t border-quiz-border">{c}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // TEXT (default) — options is a newline-separated string starting with A)/B)/C)/D).
  const optionLines = String(q.options || '').split('\n').map((s) => s.trim()).filter(Boolean)
  if (optionLines.length === 0) return null
  return (
    <div className="space-y-1.5">
      {optionLines.map((line, i) => {
        const m = line.match(/^([A-Da-d])[\.\)\:\-]?\s*(.*)$/)
        const letter = m ? m[1].toUpperCase() : ''
        const body   = m ? m[2] : line
        const isCorrectOpt = letter && letter === correctKey
        const isWrongPick  = letter && letter === userKey && letter !== correctKey
        const cls = isCorrectOpt
          ? 'bg-quiz-green/15 border-quiz-green/40 text-quiz-green'
          : isWrongPick
          ? 'bg-quiz-red/15 border-quiz-red/40 text-quiz-red'
          : 'bg-black/5 border-quiz-border'
        return (
          <div key={i} className={'flex items-center gap-2 px-3 py-2 rounded-xl border ' + cls}>
            {letter && (
              <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs bg-white/30 border border-quiz-border">
                {letter}
              </span>
            )}
            <span className="font-semibold text-sm">{body}</span>
            {isCorrectOpt && <span className="ml-auto font-black">✓</span>}
            {isWrongPick && <span className="ml-auto font-black">✗</span>}
          </div>
        )
      })}
    </div>
  )
}

function OptionTile({ letter, correctKey, userKey }) {
  const isCorrect = letter === correctKey
  const isWrong   = letter === userKey && letter !== correctKey
  const cls = isCorrect
    ? 'bg-quiz-green/15 border-quiz-green/40 text-quiz-green'
    : isWrong
    ? 'bg-quiz-red/15 border-quiz-red/40 text-quiz-red'
    : 'bg-black/5 border-quiz-border text-quiz-muted'
  return (
    <div className={'flex items-center justify-center py-2 rounded-xl border font-black ' + cls}>
      {letter}
      {isCorrect && <span className="ml-1">✓</span>}
      {isWrong && <span className="ml-1">✗</span>}
    </div>
  )
}

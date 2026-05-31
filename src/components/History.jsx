import React, { useEffect, useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`
const formatDate = (s) => {
  const d = new Date(s)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function findOptionByLetter(optionsStr, answer) {
  if (!answer) return ''
  if (!optionsStr) return String(answer)
  const target = String(answer).trim().toUpperCase()
  const lines = String(optionsStr).split('\n').map((s) => s.trim()).filter(Boolean)
  for (const line of lines) {
    const m = line.match(/^([A-Da-d])[\.\)\s:\-]/)
    if (m && m[1].toUpperCase() === target) return line
  }
  const direct = lines.find((l) => l.trim() === String(answer).trim())
  return direct || String(answer)
}

export default function History({ authToken }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error('Failed to load history'); return r.json() })
      .then((d) => { setAttempts(d.attempts || []); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [token])

  const loadReview = async (attemptId) => {
    try {
      setReviewLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/history/${attemptId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load review details')
      const data = await res.json()
      const a = data.attempt
      if (a.questions_data) {
        a.questions_data = a.questions_data.map((q) => ({
          ...q,
          correct_answer: q.correct_answer || q.answer || '(No answer provided)',
          user_answer:    q.user_answer !== undefined ? q.user_answer : '(Not answered)',
        }))
      }
      setReviewData(a)
    } catch (e) {
      setError(e.message)
    } finally {
      setReviewLoading(false)
    }
  }

  // ===== REVIEW SCREEN =====
  if (reviewData) {
    return (
      <Screen width="default">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <Button3d variant="white" size="sm" onClick={() => setReviewData(null)}>← Back to History</Button3d>
          <h1 className="!text-2xl !font-black">📋 Review</h1>
        </div>

        {reviewData.wrong_count === 0 ? (
          <Card variant="solid" className="!p-12 text-center">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="!text-2xl !font-black mb-2">Perfect Score!</h2>
            <p className="text-quiz-muted font-bold mb-1">You didn't get any questions wrong. Great job!</p>
            <p className="text-quiz-blue font-black">
              Score: {reviewData.score}/{reviewData.total_questions} ({reviewData.percentage}%)
            </p>
          </Card>
        ) : (
          <>
            <Card variant="solid" className="!p-4 mb-4 flex flex-wrap gap-4 items-center justify-around text-sm">
              <span className="font-bold">Score: <span className="text-quiz-blue">{reviewData.score}/{reviewData.total_questions}</span></span>
              <span className="font-bold">Wrong: <span className="text-quiz-red">{reviewData.wrong_count}</span></span>
              <span className="font-bold">Time: <span className="text-quiz-text">{formatTime(reviewData.time_spent_seconds)}</span></span>
            </Card>

            <div className="space-y-4">
              {reviewData.wrong_answers && reviewData.wrong_answers.map((question, idx) => {
                const userAns = question.user_answer
                const correctAns = question.correct_answer
                const diagramUrl = question.setup_image_url
                const optionsImageUrl = question.option_type === 'IMAGE' ? question.image_url : null
                return (
                  <Card key={idx} variant="solid" className="!p-5">
                    <div className="text-xs font-bold text-quiz-muted uppercase tracking-wider mb-2">
                      Question {(question.index ?? idx) + 1}
                    </div>
                    <h3 className="!text-lg !font-black mb-3 leading-snug">{question.question_text}</h3>

                    {diagramUrl && (
                      <div className="rounded-2xl overflow-hidden border border-quiz-border bg-white mb-3">
                        <img src={diagramUrl} alt="Question diagram" className="w-full max-h-80 object-contain"
                             onError={(e) => { e.target.style.display = 'none' }} />
                      </div>
                    )}

                    {question.option_type === 'TABLE' && Array.isArray(question.table_rows) ? (
                      (() => {
                        const rawH = question.table_headers || []
                        const flatHeaders = Array.isArray(rawH[0]) ? rawH[rawH.length - 1] : rawH
                        const letterOf = (row, i) =>
                          (row && typeof row === 'object' ? row._letter : null) ||
                          String.fromCharCode(65 + i)
                        return (
                          <div className="overflow-x-auto rounded-2xl border border-quiz-border">
                            <table className="w-full text-sm">
                              {flatHeaders.length > 0 && (
                                <thead><tr className="bg-gray-50">
                                  {flatHeaders.map((h, i) => <th key={i} className="px-3 py-2 text-left font-bold text-quiz-muted">{h}</th>)}
                                  <th className="px-3 py-2 w-24 font-bold text-quiz-muted">Result</th>
                                </tr></thead>
                              )}
                              <tbody>
                                {question.table_rows.map((row, rIdx) => {
                                  const letter = letterOf(row, rIdx)
                                  const isUser    = String(userAns || '').trim().toUpperCase() === letter
                                  const isCorrect = String(correctAns || '').trim().toUpperCase() === letter
                                  const rowCls = isCorrect ? 'bg-quiz-green/15'
                                                : isUser   ? 'bg-quiz-red/15' : ''
                                  return (
                                    <tr key={rIdx} className={rowCls}>
                                      {flatHeaders.map((h, cIdx) => (
                                        <td key={cIdx} className="px-3 py-2 border-t border-quiz-border">
                                          {row && typeof row === 'object' ? (row[h] ?? '') : ''}
                                        </td>
                                      ))}
                                      <td className="px-3 py-2 border-t border-quiz-border text-sm font-bold">
                                        {isCorrect && <span className="text-quiz-green">✅ Correct</span>}
                                        {isUser && !isCorrect && <span className="text-quiz-red">❌ Your pick</span>}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      })()
                    ) : optionsImageUrl ? (
                      <>
                        <div className="rounded-2xl overflow-hidden border border-quiz-border bg-white mb-3">
                          <img src={optionsImageUrl} alt="Options" className="w-full max-h-80 object-contain"
                               onError={(e) => { e.target.style.display = 'none' }} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-3 rounded-2xl bg-quiz-red/10 border-2 border-quiz-red/40">
                            <span className="font-bold text-quiz-red">❌ Your Answer:</span>
                            <span>{userAns || '(Not answered)'}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-2xl bg-quiz-green/10 border-2 border-quiz-green/40">
                            <span className="font-bold text-quiz-green">✅ Correct Answer:</span>
                            <span>{correctAns}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        {question.options && String(question.options).split('\n').map((opt, oIdx) => {
                          const t = opt.trim(); if (!t) return null
                          const lm = t.match(/^([A-Da-d])[\.\)\s:\-]/)
                          const letter = lm ? lm[1].toUpperCase() : null
                          const isUser    = letter && letter === String(userAns).trim().toUpperCase()
                          const isCorrect = letter && letter === String(correctAns).trim().toUpperCase()
                          const cls = isCorrect ? 'bg-quiz-green/15 border-quiz-green/40 text-quiz-text'
                                    : isUser    ? 'bg-quiz-red/15 border-quiz-red/40 text-quiz-text'
                                                : 'border-quiz-border text-quiz-muted'
                          return (
                            <div key={oIdx} className={'flex items-center gap-2 px-3 py-2 rounded-2xl border-2 ' + cls}>
                              <span className="flex-1">{t}</span>
                              {isCorrect && <span>✅</span>}
                              {isUser && !isCorrect && <span>❌</span>}
                            </div>
                          )
                        })}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2 p-3 rounded-2xl bg-quiz-red/10 border-2 border-quiz-red/40">
                            <span className="font-bold text-quiz-red shrink-0">❌ Your Answer:</span>
                            <span>{userAns ? findOptionByLetter(question.options, userAns) : '(Not answered)'}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-2xl bg-quiz-green/10 border-2 border-quiz-green/40">
                            <span className="font-bold text-quiz-green shrink-0">✅ Correct Answer:</span>
                            <span>{findOptionByLetter(question.options, correctAns)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3 text-xs font-bold text-quiz-muted">
                      <span className="px-2 py-1 rounded-full bg-gray-50 border border-quiz-border">📌 {question.subtopic}</span>
                      <span className="px-2 py-1 rounded-full bg-gray-50 border border-quiz-border">⭐ {question.difficulty}</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </Screen>
    )
  }

  // ===== LIST =====
  const Header = () => (
    <header className="mb-6">
      <h1 className="!text-3xl !font-black tracking-tight mb-1">📋 History</h1>
      <p className="text-quiz-muted font-semibold">Review your past attempts</p>
    </header>
  )

  if (loading) return (<Screen width="default"><Header />
    <Card variant="solid" className="!p-8 text-center text-quiz-muted">Loading history…</Card></Screen>)
  if (error) return (<Screen width="default"><Header />
    <Card variant="solid" className="!p-6 border-2 border-quiz-red/50 bg-quiz-red/10 text-quiz-red font-bold">{error}</Card></Screen>)
  if (attempts.length === 0) return (<Screen width="default"><Header />
    <Card variant="solid" className="!p-12 text-center">
      <div className="text-6xl mb-3">📝</div>
      <p className="text-quiz-muted font-bold">No quiz attempts yet. Create and take a quiz to see your history!</p>
    </Card></Screen>)

  return (
    <Screen width="default">
      <Header />
      <div className="space-y-3">
        {attempts.map((a) => {
          const pct = a.percentage
          const pctCls = pct >= 80 ? 'text-quiz-green' : pct >= 50 ? 'text-quiz-yellow' : 'text-quiz-red'
          return (
            <Card key={a.id} variant="solid" className="!p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-black text-lg mb-1.5 truncate">
                  {a.name || `Quiz #${a.parent_attempt_id || a.id}`}
                  {a.attempt_number && (
                    <span className="font-bold text-quiz-muted"> — Attempt {a.attempt_number}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-quiz-muted">
                  {a.subtopic   && <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">📚 {a.subtopic}</span>}
                  {a.difficulty && <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">⭐ {a.difficulty}</span>}
                  <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">❓ {a.total_questions}</span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-quiz-border">⏱️ {formatTime(a.time_spent_seconds)}</span>
                </div>
                <div className="text-xs text-quiz-muted mt-2">📅 {formatDate(a.attempted_at)}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <div className={'text-2xl font-black ' + pctCls}>{pct}%</div>
                  <div className="text-xs text-quiz-muted font-bold">{a.score}/{a.total_questions}</div>
                </div>
                <Button3d variant="blue" size="md" onClick={() => loadReview(a.id)} disabled={reviewLoading}>
                  {reviewLoading ? '⏳' : '👁️ Review'}
                </Button3d>
              </div>
            </Card>
          )
        })}
      </div>
    </Screen>
  )
}

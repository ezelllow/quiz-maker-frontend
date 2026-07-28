import React, { useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'
import MathText from './ui/MathText'
import Icon from './ui/Icon'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// "C. lamp X" -> "C", "C" -> "C", table _letter "C" -> "C".
function answerKey(val) {
  if (val === undefined || val === null) return ''
  const s = String(val).trim()
  // PSLE Math convention: options "(1) …"–"(4) …", answer "(3)" → key "3"
  const mNum = s.match(/^\((\d+)\)/)
  if (mNum) return mNum[1]
  // Delimiter (or end-of-string) REQUIRED after the letter — the old optional
  // delimiter graded "Density increases" as "D", silently mis-scoring
  // sentence-style options. Keep in sync with QuizMaker/DailyChallenge/backend.
  const m = s.match(/^([A-Da-d])(?:[\.\)\s:\-]|$)/)
  if (m) return m[1].toUpperCase()
  return s.toUpperCase()
}

const BAND_BLURB = {
  A1: 'Outstanding — top of the class.',
  A2: 'Excellent work.',
  B3: 'Strong — a little polish to reach the A grades.',
  B4: 'Solid foundation, keep building.',
  C5: 'Decent — clear room to grow.',
  C6: 'Passing — focus practice will lift this fast.',
  D7: 'Early days — daily practice will move the needle.',
  E8: 'A starting point. Consistency is everything now.',
  F9: 'A starting point. Consistency is everything now.',
}

export default function Placement({ authToken, subject = 'Physics', onComplete }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [step, setStep] = useState('intro')
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startPlacement = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/placement/questions?subject=${encodeURIComponent(subject)}`,
        { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not load placement quiz')
      if (!data.questions || data.questions.length === 0) throw new Error('No placement questions are available yet.')
      setQuestions(data.questions); setIdx(0); setAnswers({}); setStep('quiz')
    } catch (e) { setError(e.message); setStep('error') } finally { setLoading(false) }
  }

  const submitPlacement = async () => {
    setLoading(true); setError(null)
    try {
      let correct = 0
      questions.forEach((q, i) => {
        if (answerKey(answers[i]) && answerKey(answers[i]) === answerKey(q.answer)) correct += 1
      })
      const res = await fetch(`${API_BASE_URL}/api/placement/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, score: correct, total: questions.length }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not submit placement')
      setResult(data); setStep('result')
    } catch (e) { setError(e.message); setStep('error') } finally { setLoading(false) }
  }

  // ===== INTRO =====
  if (step === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Screen width="narrow">
          <Card variant="solid" className="!p-8 text-center">
            <div className="text-6xl mb-3"><Icon name="target" className="w-14 h-14 mx-auto text-quiz-blue" /></div>
            <h1 className="font-head !text-3xl !font-extrabold mb-2">Let's find your starting rank</h1>
            <p className="text-quiz-muted leading-relaxed mb-5">
              Take a short placement quiz — <strong className="text-quiz-text">15 questions</strong> across
              different {subject} topics and difficulty. Your score sets your starting rank. You can
              climb from there.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs font-bold text-quiz-muted">
              <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-quiz-border inline-flex items-center gap-1.5"><Icon name="book" className="w-4 h-4" /> {subject}</span>
              <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-quiz-border inline-flex items-center gap-1.5"><Icon name="help" className="w-4 h-4" /> 15 questions</span>
              <span className="px-3 py-1.5 rounded-full bg-gray-50 border border-quiz-border inline-flex items-center gap-1.5"><Icon name="chart" className="w-4 h-4" /> Sets your rank</span>
            </div>
            <Button3d variant="green" size="lg" full onClick={startPlacement} disabled={loading}>
              {loading ? 'Loading…' : 'Start placement quiz'}
            </Button3d>
          </Card>
        </Screen>
      </div>
    )
  }

  // ===== ERROR =====
  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Screen width="narrow">
          <Card variant="solid" className="!p-8 text-center">
            <div className="text-6xl mb-3"><Icon name="alert" className="w-14 h-14 mx-auto text-quiz-red" /></div>
            <h1 className="font-head !text-2xl !font-extrabold mb-2">Something went wrong</h1>
            <p className="text-quiz-muted mb-6">{error}</p>
            <div className="flex flex-col gap-2">
              <Button3d variant="blue" size="md" full onClick={startPlacement} disabled={loading}>
                Try again
              </Button3d>
              <Button3d variant="white" size="md" full onClick={() => onComplete && onComplete()}>
                Continue anyway
              </Button3d>
            </div>
          </Card>
        </Screen>
      </div>
    )
  }

  // ===== RESULT =====
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Screen width="narrow">
          <Card variant="solid" className="!p-8 text-center">
            <p className="text-xs font-bold text-quiz-muted uppercase tracking-widest mb-3">Your starting rank</p>
            <div className="mx-auto mb-3 w-32 h-32 rounded-full flex items-center justify-center
                            bg-gradient-to-br from-quiz-blue/25 to-quiz-purple/25
                            border-2 border-quiz-blue/50 shadow-xl text-7xl">
              {result.tier_icon}
            </div>
            <div className="text-3xl font-black text-quiz-blue mb-1">{result.tier_name}</div>
            <p className="text-quiz-muted font-bold mb-2">
              {result.score}/{result.total} correct · {result.percentage}%
            </p>
            <p className="text-quiz-muted leading-relaxed mb-6">{BAND_BLURB[result.rank_band] || ''}</p>
            <Button3d variant="green" size="lg" full onClick={() => onComplete && onComplete()}>
              Continue to Ooka
            </Button3d>
          </Card>
        </Screen>
      </div>
    )
  }

  // ===== QUIZ =====
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

  const optionCls = (selected) => [
    'flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all',
    selected
      ? 'bg-quiz-blue/15 border-quiz-blue text-quiz-orange-deep shadow-lg scale-[1.01]'
      : 'bg-white border-quiz-border hover:border-quiz-blue/60 hover:bg-gray-50',
  ].join(' ')

  return (
    <Screen width="default" className="py-8">
      <Card variant="solid" className="!p-6 sm:!p-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full bg-quiz-purple/20 border border-quiz-purple/40 text-quiz-purple text-xs font-bold">
            Placement · {subject}
          </span>
          <span className="text-sm font-bold text-quiz-muted">Question {idx + 1} of {total}</span>
        </div>

        <div className="h-2 rounded-full bg-gray-50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-quiz-blue via-quiz-cyan to-quiz-purple transition-all duration-300"
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

        {/* Options */}
        {q.option_type === 'TABLE' && Array.isArray(q.table_rows) ? (
          <div className="overflow-x-auto rounded-2xl border border-quiz-border">
            <table className="w-full text-sm">
              {flatHeaders.length > 0 && (
                <thead>
                  <tr className="bg-gray-50">
                    {flatHeaders.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-bold text-quiz-muted"><MathText>{h}</MathText></th>
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
                    <tr
                      key={rIdx}
                      onClick={() => setAnswer(letter)}
                      className={'cursor-pointer transition-colors ' + (selected ? 'bg-quiz-blue/20' : 'hover:bg-gray-50')}
                    >
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
              const t = opt.trim()
              if (!t) return null
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

        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button3d
            variant={idx === 0 ? 'disabled' : 'white'}
            size="md"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
          >
            ← Previous
          </Button3d>
          <span className="text-sm font-bold text-quiz-muted order-3 sm:order-2 w-full sm:w-auto text-center">
            {answeredCount}/{total} answered
          </span>
          {isLast ? (
            <Button3d
              variant={allAnswered ? 'green' : 'disabled'}
              size="md"
              onClick={submitPlacement}
              disabled={loading || !allAnswered}
              title={!allAnswered ? 'Answer all questions to finish' : ''}
              className="order-2 sm:order-3"
            >
              {loading ? 'Scoring…' : allAnswered ? 'Finish & get my rank' : `${total - answeredCount} left`}
            </Button3d>
          ) : (
            <Button3d
              variant="blue"
              size="md"
              onClick={() => setIdx(Math.min(total - 1, idx + 1))}
              className="order-2 sm:order-3"
            >
              Next →
            </Button3d>
          )}
        </div>
      </Card>
    </Screen>
  )
}

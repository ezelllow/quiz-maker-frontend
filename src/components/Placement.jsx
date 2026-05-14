import React, { useState, useEffect } from 'react'
import './Placement.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Extract a comparable answer key from a user answer / correct answer.
// Handles "C. lamp X" -> "C", "C" -> "C", table _letter "C" -> "C".
function answerKey(val) {
  if (val === undefined || val === null) return ''
  const s = String(val).trim()
  const m = s.match(/^([A-Da-d])[\.\)\s:\-]?/)
  if (m) return m[1].toUpperCase()
  return s.toUpperCase()
}

// Short description for each band so the result feels meaningful.
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
  const [step, setStep] = useState('intro')          // intro | quiz | result | error
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startPlacement = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/placement/questions?subject=${encodeURIComponent(subject)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not load placement quiz')
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No placement questions are available yet.')
      }
      setQuestions(data.questions)
      setIdx(0)
      setAnswers({})
      setStep('quiz')
    } catch (e) {
      setError(e.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const submitPlacement = async () => {
    setLoading(true)
    setError(null)
    try {
      // Score client-side using a type-agnostic letter comparison.
      let correct = 0
      questions.forEach((q, i) => {
        if (answerKey(answers[i]) && answerKey(answers[i]) === answerKey(q.answer)) {
          correct += 1
        }
      })
      const res = await fetch(`${API_BASE_URL}/api/placement/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, score: correct, total: questions.length }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not submit placement')
      setResult(data)
      setStep('result')
    } catch (e) {
      setError(e.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  // ---------- INTRO ----------
  if (step === 'intro') {
    return (
      <div className="placement-screen">
        <div className="placement-card placement-intro">
          <div className="placement-badge-icon">🎯</div>
          <h1>Let's find your starting rank</h1>
          <p className="placement-sub">
            Before you dive in, take a short placement quiz. It's <strong>15 questions</strong> across
            different {subject} topics and difficulty levels — about 15 minutes. Your score sets your
            starting rank (A1 is the best, F9 the lowest). You can climb from there.
          </p>
          <div className="placement-meta-row">
            <span>📚 {subject}</span>
            <span>❓ 15 questions</span>
            <span>📊 Sets your rank</span>
          </div>
          <button className="placement-btn-primary" onClick={startPlacement} disabled={loading}>
            {loading ? 'Loading…' : 'Start placement quiz'}
          </button>
        </div>
      </div>
    )
  }

  // ---------- ERROR ----------
  if (step === 'error') {
    return (
      <div className="placement-screen">
        <div className="placement-card">
          <div className="placement-badge-icon">⚠️</div>
          <h1>Something went wrong</h1>
          <p className="placement-sub">{error}</p>
          <div className="placement-actions">
            <button className="placement-btn-secondary" onClick={startPlacement} disabled={loading}>
              Try again
            </button>
            <button className="placement-btn-primary" onClick={() => onComplete && onComplete()}>
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- RESULT ----------
  if (step === 'result' && result) {
    return (
      <div className="placement-screen">
        <div className="placement-card placement-result">
          <p className="placement-result-label">Your starting rank</p>
          <div className="placement-rank-badge">{result.tier_icon}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#5DA9FF', margin: '8px 0 0' }}>
            {result.tier_name}
          </div>
          <p className="placement-result-score">
            {result.score}/{result.total} correct · {result.percentage}%
          </p>
          <p className="placement-sub">{BAND_BLURB[result.rank_band] || ''}</p>
          <button className="placement-btn-primary" onClick={() => onComplete && onComplete()}>
            Continue to QuizMaker
          </button>
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

  // Derive flat headers for TABLE questions (single- or multi-level)
  const rawHeaders = q.table_headers || []
  const flatHeaders = Array.isArray(rawHeaders[0]) ? rawHeaders[rawHeaders.length - 1] : rawHeaders

  return (
    <div className="placement-screen">
      <div className="placement-card placement-quiz">
        <div className="placement-quiz-head">
          <span className="placement-pill">Placement · {subject}</span>
          <span className="placement-progress-text">Question {idx + 1} of {total}</span>
        </div>
        <div className="placement-progress-bar">
          <div
            className="placement-progress-fill"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>

        <h2 className="placement-question">{q.question_text}</h2>

        {q.setup_image_url && (
          <div className="placement-image">
            <img src={q.setup_image_url} alt="Question diagram"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}
        {q.option_type === 'IMAGE' && q.image_url && q.image_url !== q.setup_image_url && (
          <div className="placement-image">
            <img src={q.image_url} alt="Answer options"
                 onError={(e) => { e.target.style.display = 'none' }} />
          </div>
        )}

        {/* Options */}
        {q.option_type === 'TABLE' && Array.isArray(q.table_rows) ? (
          <table className="placement-table">
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
          <div className="placement-options">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <label key={letter} className={`placement-option ${answers[idx] === letter ? 'selected' : ''}`}>
                <input type="radio" checked={answers[idx] === letter} onChange={() => setAnswer(letter)} />
                <span>{letter}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="placement-options">
            {q.options && String(q.options).split('\n').map((opt, i) => {
              const t = opt.trim()
              if (!t) return null
              const selected = answers[idx] === t
              return (
                <label key={i} className={`placement-option ${selected ? 'selected' : ''}`}>
                  <input type="radio" checked={selected} onChange={() => setAnswer(t)} />
                  <span>{t}</span>
                </label>
              )
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="placement-nav">
          <button
            className="placement-btn-secondary"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
          >
            ← Previous
          </button>
          <span className="placement-nav-count">{answeredCount}/{total} answered</span>
          {isLast ? (
            <button
              className="placement-btn-primary"
              onClick={submitPlacement}
              disabled={loading || !allAnswered}
              title={!allAnswered ? 'Answer all questions to finish' : ''}
            >
              {loading ? 'Scoring…' : allAnswered ? 'Finish & get my rank' : `${total - answeredCount} left`}
            </button>
          ) : (
            <button className="placement-btn-secondary" onClick={() => setIdx(Math.min(total - 1, idx + 1))}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

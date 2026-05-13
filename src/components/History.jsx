import React, { useState, useEffect } from 'react'
import './History.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function History({ authToken }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    fetchAttempts()
  }, [])

  const fetchAttempts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load history')
      }

      const data = await response.json()
      setAttempts(data.attempts || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching attempts:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadReview = async (attemptId) => {
    try {
      setReviewLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/history/${attemptId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load review details')
      }

      const data = await response.json()
      const attemptData = data.attempt

      // Ensure all question data has the necessary fields
      if (attemptData.questions_data) {
        attemptData.questions_data = attemptData.questions_data.map(q => ({
          ...q,
          correct_answer: q.correct_answer || q.answer || '(No answer provided)',
          user_answer: q.user_answer !== undefined ? q.user_answer : '(Not answered)'
        }))
      }

      setReviewData(attemptData)
      setSelectedAttempt(attemptId)
    } catch (err) {
      console.error('Error loading review:', err)
      setError(err.message)
    } finally {
      setReviewLoading(false)
    }
  }

  // Find the full option line that corresponds to a letter/label answer.
  // Handles options stored as a newline-delimited string like "A. foo\nB. bar".
  // Falls back to the raw answer if no match is found (e.g. answer already is full text).
  const findOptionByLetter = (optionsStr, answer) => {
    if (!answer) return ''
    if (!optionsStr) return String(answer)
    const target = String(answer).trim().toUpperCase()
    const lines = String(optionsStr).split('\n').map(s => s.trim()).filter(Boolean)
    for (const line of lines) {
      const m = line.match(/^([A-Da-d])[\.\)\s:\-]/)
      if (m && m[1].toUpperCase() === target) return line
    }
    // Already a full option line, or no letter prefix in source
    const direct = lines.find(l => l.trim() === String(answer).trim())
    return direct || String(answer)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Review Screen
  if (reviewData) {
    return (
      <div className="history-container">
        <div className="review-header">
          <button onClick={() => { setReviewData(null); setSelectedAttempt(null); }} className="btn-back">
            ← Back to History
          </button>
          <h2>📋 Review Attempt</h2>
        </div>

        {reviewData.wrong_count === 0 ? (
          <div className="perfect-score">
            <div className="emoji">🎉</div>
            <h3>Perfect Score!</h3>
            <p>You didn't get any questions wrong. Great job!</p>
            <p className="stats">Score: {reviewData.score}/{reviewData.total_questions} ({reviewData.percentage}%)</p>
          </div>
        ) : (
          <div className="review-content">
            <div className="review-stats">
              <span>Score: {reviewData.score}/{reviewData.total_questions}</span>
              <span>Wrong: {reviewData.wrong_count}</span>
              <span>Time: {formatTime(reviewData.time_spent_seconds)}</span>
            </div>

            <div className="wrong-answers-list">
              {reviewData.wrong_answers && reviewData.wrong_answers.map((question, idx) => {
                const userAns = question.user_answer
                const correctAns = question.correct_answer
                const diagramUrl = question.setup_image_url
                const optionsImageUrl =
                  question.option_type === 'IMAGE' ? question.image_url : null

                return (
                  <div key={idx} className="wrong-answer-item">
                    <div className="question-header">
                      <span className="question-num">Question {(question.index ?? idx) + 1}</span>
                    </div>
                    <p className="question-text">{question.question_text}</p>

                    {/* Question diagram (setup image) */}
                    {diagramUrl && (
                      <div className="image-container" style={{ margin: '12px 0' }}>
                        <img
                          src={diagramUrl}
                          alt="Question diagram"
                          className="question-image"
                          style={{ maxWidth: '100%', borderRadius: 8 }}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      </div>
                    )}

                    {/* Options rendering — TABLE / IMAGE / TEXT */}
                    {question.option_type === 'TABLE' && Array.isArray(question.table_rows) ? (
                      (() => {
                        const rawH = question.table_headers || []
                        const flatHeaders = Array.isArray(rawH[0]) ? rawH[rawH.length - 1] : rawH
                        const letterOf = (row, idx) =>
                          (row && typeof row === 'object' ? row._letter : null) ||
                          String.fromCharCode(65 + idx)
                        return (
                          <table className="options-table" style={{ width: '100%', marginTop: 8 }}>
                            {flatHeaders.length > 0 && (
                              <thead>
                                <tr>
                                  {flatHeaders.map((h, i) => <th key={i}>{h}</th>)}
                                  <th style={{ width: 90 }}>Result</th>
                                </tr>
                              </thead>
                            )}
                            <tbody>
                              {question.table_rows.map((row, rIdx) => {
                                const letter = letterOf(row, rIdx)
                                const isUser = String(userAns || '').trim().toUpperCase() === letter
                                const isCorrect = String(correctAns || '').trim().toUpperCase() === letter
                                const rowStyle = isCorrect
                                  ? { background: '#dcfce7' }
                                  : isUser
                                  ? { background: '#fee2e2' }
                                  : {}
                                return (
                                  <tr key={rIdx} style={rowStyle}>
                                    {flatHeaders.map((h, cIdx) => (
                                      <td key={cIdx}>
                                        {row && typeof row === 'object' ? (row[h] ?? '') : ''}
                                      </td>
                                    ))}
                                    <td>
                                      {isCorrect && '✅ Correct'}
                                      {isUser && !isCorrect && '❌ Your pick'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )
                      })()
                    ) : optionsImageUrl ? (
                      <>
                        <div className="image-container" style={{ margin: '12px 0' }}>
                          <img
                            src={optionsImageUrl}
                            alt="Options"
                            className="question-image"
                            style={{ maxWidth: '100%', borderRadius: 8 }}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        </div>
                        <div className="answer-comparison">
                          <div className="wrong-answer">
                            <span className="label">❌ Your Answer:</span>
                            <span className="text">{userAns || '(Not answered)'}</span>
                          </div>
                          <div className="correct-answer">
                            <span className="label">✅ Correct Answer:</span>
                            <span className="text">{correctAns}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="review-options" style={{ marginTop: 8 }}>
                        {question.options &&
                          String(question.options)
                            .split('\n')
                            .map(s => s.trim())
                            .filter(Boolean)
                            .map((opt, oIdx) => {
                              const letterMatch = opt.match(/^([A-Da-d])[\.\)\s:\-]/)
                              const letter = letterMatch ? letterMatch[1].toUpperCase() : null
                              const isUser =
                                letter && letter === String(userAns).trim().toUpperCase()
                              const isCorrect =
                                letter && letter === String(correctAns).trim().toUpperCase()
                              const bg = isCorrect
                                ? '#dcfce7'
                                : isUser
                                ? '#fee2e2'
                                : 'transparent'
                              const border = isCorrect
                                ? '1px solid #86efac'
                                : isUser
                                ? '1px solid #fca5a5'
                                : '1px solid #e5e7eb'
                              return (
                                <div
                                  key={oIdx}
                                  style={{
                                    padding: '8px 12px',
                                    margin: '6px 0',
                                    background: bg,
                                    border,
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                  }}
                                >
                                  <span style={{ flex: 1 }}>{opt}</span>
                                  {isCorrect && <span>✅</span>}
                                  {isUser && !isCorrect && <span>❌</span>}
                                </div>
                              )
                            })}

                        {/* Summary line — uses full option text, not just the letter */}
                        <div className="answer-comparison" style={{ marginTop: 10 }}>
                          <div className="wrong-answer">
                            <span className="label">❌ Your Answer:</span>
                            <span className="text">
                              {userAns ? findOptionByLetter(question.options, userAns) : '(Not answered)'}
                            </span>
                          </div>
                          <div className="correct-answer">
                            <span className="label">✅ Correct Answer:</span>
                            <span className="text">
                              {findOptionByLetter(question.options, correctAns)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="question-meta">
                      <span>📌 {question.subtopic}</span>
                      <span>⭐ {question.difficulty}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Attempts List Screen
  if (loading) {
    return (
      <div className="history-container">
        <div className="header-section">
          <h1>📋 History</h1>
          <p>Your quiz attempts</p>
        </div>
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="header-section">
          <h1>📋 History</h1>
        </div>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (attempts.length === 0) {
    return (
      <div className="history-container">
        <div className="header-section">
          <h1>📋 History</h1>
          <p>Your quiz attempts</p>
        </div>
        <div className="no-data">
          <div className="emoji">📝</div>
          <p>No quiz attempts yet. Create and take a quiz to see your history!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      <div className="header-section">
        <h1>📋 History</h1>
        <p>Review your past attempts</p>
      </div>

      <div className="attempts-list">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="attempt-item">
            <div className="attempt-info">
              <div className="attempt-number">
                {attempt.name || `Quiz #${attempt.parent_attempt_id || attempt.id}`}
                {attempt.attempt_number && (
                  <span style={{ opacity: 0.7, fontWeight: 'normal' }}>
                    {' '}— Attempt {attempt.attempt_number}
                  </span>
                )}
              </div>
              <div className="attempt-details">
                <p className="attempt-meta">
                  {attempt.subtopic && <span>📚 {attempt.subtopic}</span>}
                  {attempt.difficulty && <span>⭐ {attempt.difficulty}</span>}
                  <span>❓ {attempt.total_questions} questions</span>
                </p>
                <p className="attempt-stats">
                  <span>⏱️ {formatTime(attempt.time_spent_seconds)}</span>
                  <span>📅 {formatDate(attempt.attempted_at)}</span>
                </p>
              </div>
            </div>

            <div className="attempt-actions">
              <div className="score-display">
                <span className="score-number">{attempt.percentage}%</span>
                <span className="score-text">{attempt.score}/{attempt.total_questions}</span>
              </div>
              <button
                onClick={() => loadReview(attempt.id)}
                disabled={reviewLoading}
                className="btn-review"
              >
                {reviewLoading ? '⏳ Loading...' : '👁️ Review'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

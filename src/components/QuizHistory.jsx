import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './QuizHistory.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function QuizHistory({ authToken, onGoBack, onRetakeQuiz }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [mistakeDetails, setMistakeDetails] = useState(null)

  // Get auth token
  const token = authToken || localStorage.getItem('auth_token')

  // Load quiz history on mount
  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
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
        throw new Error('Failed to load quiz history')
      }

      const data = await response.json()
      setHistory(data.attempts || [])
    } catch (err) {
      setError(err.message || 'Error loading history')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMistakeReview = async (attemptId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${attemptId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load attempt details')
      }

      const data = await response.json()
      setSelectedAttempt(attemptId)
      setMistakeDetails(data.attempt)
    } catch (err) {
      console.error('Error loading mistakes:', err)
    }
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

  const handleRetakeQuiz = (attempt) => {
    // Retake the quiz with the same questions from the previous attempt
    if (onRetakeQuiz) {
      onRetakeQuiz({
        id: attempt.id,
        subtopic: attempt.subtopic,
        difficulty: attempt.difficulty,
        count: attempt.total_questions,
        isRetake: true
      })
    }
  }

  // Prepare data for progress chart
  const chartData = history.reverse().map((attempt, idx) => ({
    name: `Attempt ${idx + 1}`,
    score: attempt.percentage,
    date: new Date(attempt.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  // Mistake review screen
  if (mistakeDetails) {
    return (
      <div className="quiz-history-container">
        <div className="mistake-review-card">
          <div className="mistake-header">
            <button onClick={() => setMistakeDetails(null)} className="btn btn-outline">
              ← Back to History
            </button>
            <h2>📋 Mistake Review</h2>
            <div className="mistake-stats">
              <span>Score: {mistakeDetails.score}/{mistakeDetails.total_questions}</span>
              <span>Wrong: {mistakeDetails.wrong_count}</span>
              <span>Time: {formatTime(mistakeDetails.time_spent_seconds)}</span>
            </div>
          </div>

          {mistakeDetails.wrong_count === 0 ? (
            <div className="perfect-score">
              <div className="emoji">🎉</div>
              <h3>Perfect Score!</h3>
              <p>You didn't get any questions wrong. Keep it up!</p>
            </div>
          ) : (
            <div className="mistakes-list">
              {mistakeDetails.wrong_answers.map((question, idx) => (
                <div key={idx} className="mistake-item">
                  <div className="mistake-number">Question {question.index + 1}</div>
                  <p className="mistake-question">{question.question_text}</p>

                  <div className="answer-comparison">
                    <div className="wrong-answer">
                      <span className="label">❌ Your Answer:</span>
                      <span className="text">{question.user_answer || '(Not answered)'}</span>
                    </div>
                    <div className="correct-answer">
                      <span className="label">✅ Correct Answer:</span>
                      <span className="text">{question.correct_answer}</span>
                    </div>
                  </div>

                  <div className="question-meta">
                    <span>📌 {question.subtopic}</span>
                    <span>⭐ {question.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setMistakeDetails(null)} className="btn btn-primary">
            Close Review
          </button>
        </div>
      </div>
    )
  }

  // Main history screen
  return (
    <div className="quiz-history-container">
      <div className="history-card">
        <div className="history-header">
          <button onClick={onGoBack} className="btn btn-outline">
            ← Back to Quiz
          </button>
          <h2>📊 Quiz History</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading your quiz history...</div>
        ) : history.length === 0 ? (
          <div className="no-history">
            <div className="emoji">📚</div>
            <p>No quiz attempts yet. Start your first quiz!</p>
          </div>
        ) : (
          <>
            {/* Progress Chart */}
            <div className="progress-chart-section">
              <h3>📈 Your Progress Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#FF6A1A"
                    dot={{ fill: '#FF6A1A' }}
                    name="Score %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Summary */}
            <div className="stats-summary">
              <div className="stat-box">
                <div className="stat-value">{history.length}</div>
                <div className="stat-label">Total Attempts</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{Math.round(history.reduce((sum, a) => sum + a.percentage, 0) / history.length)}%</div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{Math.max(...history.map(a => a.percentage))}%</div>
                <div className="stat-label">Best Score</div>
              </div>
            </div>

            {/* Attempts List */}
            <div className="attempts-list">
              <h3>📝 All Attempts</h3>
              {history.map((attempt, idx) => (
                <div key={attempt.id} className="attempt-item">
                  <div className="attempt-info">
                    <div className="attempt-number">Attempt {history.length - idx}</div>
                    <div className="attempt-details">
                      <p className="attempt-score">
                        Score: <strong>{attempt.score}/{attempt.total_questions}</strong> ({attempt.percentage}%)
                      </p>
                      <p className="attempt-meta">
                        {attempt.subtopic && <span>📌 {attempt.subtopic}</span>}
                        {attempt.difficulty && <span>⭐ {attempt.difficulty}</span>}
                        <span>⏱️ {formatTime(attempt.time_spent_seconds)}</span>
                      </p>
                      <p className="attempt-date">{formatDate(attempt.attempted_at)}</p>
                    </div>
                  </div>
                  <div className="attempt-actions">
                    <button
                      onClick={() => loadMistakeReview(attempt.id)}
                      className="btn btn-secondary btn-small"
                    >
                      👁️ Review
                    </button>
                    <button
                      onClick={() => handleRetakeQuiz(attempt)}
                      className="btn btn-primary btn-small"
                    >
                      🔄 Retake
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

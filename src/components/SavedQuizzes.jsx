import React, { useState, useEffect } from 'react'
import './SavedQuizzes.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function SavedQuizzes({ authToken, onRetake }) {
  const token = authToken || localStorage.getItem('auth_token')
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSavedQuizzes()
  }, [])

  const fetchSavedQuizzes = async () => {
    try {
      setLoading(true)
      setError(null)

      // saved_only=true returns originals only — retakes are hidden here
      // and show up in the History tab instead
      const response = await fetch(`${API_BASE_URL}/api/history?saved_only=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load saved quizzes')
      }

      const data = await response.json()
      setQuizzes(data.attempts || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetake = (attempt) => {
    if (onRetake) {
      onRetake({
        id: attempt.id,
        subtopic: attempt.subtopic,
        difficulty: attempt.difficulty,
        count: attempt.total_questions,
        isRetake: true
      })
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

  if (loading) {
    return (
      <div className="saved-quizzes">
        <div className="header-section">
          <h1>💾 Saved Quizzes</h1>
          <p>Quizzes you can retake</p>
        </div>
        <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading saved quizzes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="saved-quizzes">
        <div className="header-section">
          <h1>💾 Saved Quizzes</h1>
        </div>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="saved-quizzes">
        <div className="header-section">
          <h1>💾 Saved Quizzes</h1>
          <p>Quizzes you can retake</p>
        </div>
        <div className="no-data">
          <div className="emoji">📝</div>
          <p>No saved quizzes yet. Create a quiz to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="saved-quizzes">
      <div className="header-section">
        <h1>💾 Saved Quizzes</h1>
        <p>Quizzes you have taken and can retake</p>
      </div>

      <div className="quizzes-list">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="quiz-item">
            <div className="quiz-info">
              <div className="quiz-number">{quiz.name || `Quiz #${quiz.id}`}</div>
              <div className="quiz-details">
                <p className="quiz-meta">
                  {quiz.subtopic && <span>📚 {quiz.subtopic}</span>}
                  {quiz.difficulty && <span>⭐ {quiz.difficulty}</span>}
                  <span>❓ {quiz.total_questions} questions</span>
                </p>
                <p className="quiz-stats">
                  <span>🎯 {quiz.attempt_count || 1} attempt{(quiz.attempt_count || 1) === 1 ? '' : 's'}</span>
                  <span>📅 Created {formatDate(quiz.attempted_at)}</span>
                </p>
              </div>
            </div>

            <div className="quiz-score">
              <button onClick={() => handleRetake(quiz)} className="btn-retake">
                🔄 Retake
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

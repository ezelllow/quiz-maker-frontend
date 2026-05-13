import React, { useState, useEffect } from 'react'
import './Dashboard.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Dashboard({ authToken, onNavigate }) {
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 7,
    totalTime: 0
  })
  const [recentAttempts, setRecentAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  const token = authToken || localStorage.getItem('auth_token')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load dashboard data')

      const data = await response.json()
      const attempts = data.attempts || []

      // Calculate stats
      const totalAttempts = attempts.length
      const averageScore = totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts)
        : 0
      const bestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0

      setStats({
        totalAttempts,
        averageScore,
        bestScore,
        currentStreak: 7,
        totalTime: totalAttempts * 5 // estimated
      })

      // Get recent 5 attempts
      setRecentAttempts(attempts.slice(-5).reverse())
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome Back! 👋</h1>
          <p>Keep up your learning streak and reach your goals</p>
        </div>
        <button
          onClick={() => onNavigate('create-quiz')}
          className="btn-start-quiz"
        >
          ✏️ Start a Quiz
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalAttempts}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{stats.averageScore}%</div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <div className="stat-value">{stats.bestScore}%</div>
            <div className="stat-label">Best Score</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.currentStreak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button
            onClick={() => onNavigate('create-quiz')}
            className="action-card"
          >
            <div className="action-icon">✏️</div>
            <div className="action-title">Create New Quiz</div>
            <div className="action-desc">Start a fresh quiz</div>
          </button>

          <button
            onClick={() => onNavigate('my-quizzes')}
            className="action-card"
          >
            <div className="action-icon">📚</div>
            <div className="action-title">My Quizzes</div>
            <div className="action-desc">View all your quizzes</div>
          </button>

          <button
            onClick={() => onNavigate('progress')}
            className="action-card"
          >
            <div className="action-icon">📈</div>
            <div className="action-title">View Progress</div>
            <div className="action-desc">Track your improvement</div>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="action-card"
          >
            <div className="action-icon">⚙️</div>
            <div className="action-title">Settings</div>
            <div className="action-desc">Customize your experience</div>
          </button>
        </div>
      </div>

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <div className="recent-section">
          <h2>Recent Attempts</h2>
          <div className="recent-list">
            {recentAttempts.map((attempt, idx) => (
              <div key={attempt.id} className="recent-item">
                <div className="recent-number">#{recentAttempts.length - idx}</div>
                <div className="recent-info">
                  <div className="recent-topic">
                    {attempt.subtopic || 'General Quiz'}
                  </div>
                  <div className="recent-meta">
                    {attempt.difficulty && <span className="meta-badge">{attempt.difficulty}</span>}
                    <span className="meta-date">{formatDate(attempt.attempted_at)}</span>
                  </div>
                </div>
                <div className={`recent-score ${
                  attempt.percentage >= 80 ? 'excellent' :
                  attempt.percentage >= 60 ? 'good' :
                  'needs-work'
                }`}>
                  <span className="score-percent">{attempt.percentage}%</span>
                  <span className="score-details">{attempt.score}/{attempt.total_questions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && stats.totalAttempts === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No quizzes yet</h3>
          <p>Get started by creating your first quiz!</p>
          <button
            onClick={() => onNavigate('create-quiz')}
            className="btn-primary-large"
          >
            Create First Quiz
          </button>
        </div>
      )}
    </div>
  )
}

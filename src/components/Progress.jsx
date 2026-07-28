import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Icon from './ui/Icon'
import './Progress.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Progress({ authToken }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartType, setChartType] = useState('line')

  const token = authToken || localStorage.getItem('auth_token')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load history')

      const data = await response.json()
      setHistory(data.attempts || [])
    } catch (err) {
      setError(err.message || 'Error loading progress')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Prepare data for progress chart
  const chartData = history.reverse().map((attempt, idx) => ({
    name: `Attempt ${idx + 1}`,
    score: attempt.percentage,
    date: new Date(attempt.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  // Calculate statistics by difficulty
  const difficultyStats = history.reduce((acc, attempt) => {
    const diff = attempt.difficulty || 'Unknown'
    if (!acc[diff]) {
      acc[diff] = { count: 0, total: 0, scores: [] }
    }
    acc[diff].count++
    acc[diff].scores.push(attempt.percentage)
    return acc
  }, {})

  const difficultyChartData = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
    name: difficulty,
    average: Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length),
    attempts: stats.count
  }))

  // Calculate statistics by subtopic
  const subtopicStats = history.reduce((acc, attempt) => {
    const subtopic = attempt.subtopic || 'General'
    if (!acc[subtopic]) {
      acc[subtopic] = { count: 0, scores: [] }
    }
    acc[subtopic].count++
    acc[subtopic].scores.push(attempt.percentage)
    return acc
  }, {})

  const subtopicChartData = Object.entries(subtopicStats)
    .map(([subtopic, stats]) => ({
      name: subtopic,
      average: Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
    }))
    .sort((a, b) => b.average - a.average)

  // Overall statistics
  const overallStats = {
    totalAttempts: history.length,
    averageScore: history.length > 0
      ? Math.round(history.reduce((sum, a) => sum + a.percentage, 0) / history.length)
      : 0,
    bestScore: history.length > 0 ? Math.max(...history.map(a => a.percentage)) : 0,
    improvementTrend: history.length >= 2
      ? ((history[history.length - 1].percentage - history[0].percentage) / history[0].percentage * 100).toFixed(1)
      : 0
  }

  if (loading) {
    return <div className="progress loading">Loading your progress...</div>
  }

  if (history.length === 0) {
    return (
      <div className="progress">
        <div className="progress-empty">
          <div className="empty-icon"><Icon name="chart" className="w-16 h-16 mx-auto" /></div>
          <h2>No quiz data yet</h2>
          <p>Start taking quizzes to see your progress!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="progress">
      {error && <div className="error-message">{error}</div>}

      <div className="progress-header">
        <h1 className="inline-flex items-center gap-2"><Icon name="trend" className="w-7 h-7" /> Your Progress</h1>
        <p>Track your improvement over time</p>
      </div>

      {/* Overall Stats */}
      <div className="overall-stats">
        <div className="stat-box">
          <div className="stat-label">Total Attempts</div>
          <div className="stat-value">{overallStats.totalAttempts}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Average Score</div>
          <div className="stat-value">{overallStats.averageScore}%</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Best Score</div>
          <div className="stat-value">{overallStats.bestScore}%</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Improvement</div>
          <div className="stat-value" style={{
            color: overallStats.improvementTrend >= 0 ? '#22c55e' : '#ef4444'
          }}>
            {overallStats.improvementTrend >= 0 ? '+' : ''}{overallStats.improvementTrend}%
          </div>
        </div>
      </div>

      {/* Score Trend Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Score Trend</h2>
          <div className="chart-type-toggle">
            <button
              className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
            <button
              className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis domain={[0, 100]} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => `${value}%`}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 5 }}
                activeDot={{ r: 7 }}
                name="Score"
              />
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis domain={[0, 100]} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="score" fill="#667eea" radius={[8, 8, 0, 0]} name="Score" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Performance by Difficulty */}
      {difficultyChartData.length > 0 && (
        <div className="chart-section">
          <h2>Performance by Difficulty</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={difficultyChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis domain={[0, 100]} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="average" fill="#22c55e" radius={[8, 8, 0, 0]} name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance by Subtopic */}
      {subtopicChartData.length > 0 && (
        <div className="chart-section">
          <h2>Performance by Topic</h2>
          <div className="topic-grid">
            {subtopicChartData.map((topic, idx) => (
              <div key={idx} className="topic-card">
                <div className="topic-name">{topic.name}</div>
                <div className="topic-score">
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${topic.average}%`,
                        background: topic.average >= 80 ? '#22c55e' : topic.average >= 60 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="score-text">{topic.average}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

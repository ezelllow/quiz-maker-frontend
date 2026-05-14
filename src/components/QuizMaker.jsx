import React, { useState, useEffect } from 'react'
import './QuizMaker.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Normalize an answer to a comparable key so option-text vs letter compares correctly.
// "C. lamp X" -> "C", "C" -> "C", table _letter "C" -> "C". Falls back to the
// uppercased string when there's no A-D letter prefix.
function answerKey(val) {
  if (val === undefined || val === null) return ''
  const s = String(val).trim()
  const m = s.match(/^([A-Da-d])[\.\)\s:\-]?/)
  if (m) return m[1].toUpperCase()
  return s.toUpperCase()
}

export default function QuizMaker({ authToken, retakeAttempt, onRetakeClear }) {
  const token = authToken || localStorage.getItem('auth_token')

  // State for filters
  const [subtopics, setSubtopics] = useState([])
  const [difficulties, setDifficulties] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('Physics')
  const [selectedSubtopic, setSelectedSubtopic] = useState('')
  const [selectedSubtopics, setSelectedSubtopics] = useState([])  // up to 3 picks
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [quizName, setQuizName] = useState('')

  // State for quiz
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [quizStartTime, setQuizStartTime] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)
  const [isRetaking, setIsRetaking] = useState(false)
  const [retakeParentId, setRetakeParentId] = useState(null)

  // Fetch available filters on mount
  useEffect(() => {
    fetchFilters()
  }, [])

  // Handle retake attempt - load quiz directly
  useEffect(() => {
    if (retakeAttempt) {
      loadRetakeQuiz()
    }
  }, [retakeAttempt])

  const loadRetakeQuiz = async () => {
    try {
      setLoading(true)
      setError(null)
      setIsRetaking(true)

      // Fetch the original quiz questions from history using the /quiz endpoint
      const response = await fetch(`${API_BASE_URL}/api/history/${retakeAttempt.id}/quiz`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load quiz for retake')
      }

      const data = await response.json()
      const questionsData = data.questions

      if (!questionsData || questionsData.length === 0) {
        throw new Error('No questions found for this attempt')
      }

      console.log('Questions data from backend:', questionsData)
      console.log('First question structure:', questionsData[0])

      // Reconstruct the quiz object with the returned questions
      // Keep all original fields, just ensure answer field is populated
      const reconstructedQuiz = {
        questions: questionsData.map(q => ({
          ...q,  // Keep all original fields (options, option_type, etc.)
          answer: q.answer || q.correct_answer || '',  // Ensure answer field exists
          correct_answer: q.correct_answer || q.answer || ''  // Also include correct_answer
        }))
      }

      console.log('Reconstructed quiz:', reconstructedQuiz)
      setQuiz(reconstructedQuiz)
      setSelectedSubtopic(retakeAttempt.subtopic)
      setSelectedDifficulty(retakeAttempt.difficulty)
      setQuestionCount(retakeAttempt.count)
      setRetakeParentId(retakeAttempt.id)
      setCurrentQuestionIndex(0)
      setUserAnswers({})
      setShowResults(false)
      setQuizStartTime(Date.now())
      setSubmitSuccess(null)
      // Consume the retakeAttempt prop so the quiz doesn't auto-reload
      // if the user navigates away and back via the sidebar.
      if (onRetakeClear) onRetakeClear()
    } catch (err) {
      setError(`Error loading quiz for retake: ${err.message}`)
      console.error('Retake error:', err)
      setIsRetaking(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilters = async () => {
    try {
      const [subRes, difRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/subtopics`),
        fetch(`${API_BASE_URL}/api/difficulties`)
      ])

      if (!subRes.ok || !difRes.ok) throw new Error('Failed to fetch filters')

      const subs = await subRes.json()
      const difs = await difRes.json()

      setSubtopics(subs)
      setDifficulties(difs)
    } catch (err) {
      setError(`Error loading filters: ${err.message}`)
    }
  }

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Error: No authorization token found. Please log in again.')
      return
    }

    // Client-side validation: more topics than questions = error before request
    const count = parseInt(questionCount, 10) || 0
    const topics = selectedSubtopics.filter(Boolean)
    if (topics.length > count) {
      setError(
        `You picked ${topics.length} topics but only ${count} question${count === 1 ? '' : 's'}. ` +
        `Reduce topics or increase question count.`
      )
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: selectedSubject || 'Physics',
          difficulty: selectedDifficulty || null,
          // Send the multi-topic list. If empty the backend treats it as "any topic".
          subtopics: topics.length > 0 ? topics : null,
          // Keep the legacy field for compatibility (first topic, if any)
          subtopic: topics[0] || null,
          count
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create quiz')
      }

      const quizData = await response.json()
      setQuiz(quizData)
      setCurrentQuestionIndex(0)
      setUserAnswers({})
      setShowResults(false)
      setQuizStartTime(Date.now())
      setSubmitSuccess(null)
    } catch (err) {
      setError(`Error creating quiz: ${err.message}`)
      console.error('Quiz creation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSubmitQuiz = async () => {
    // Block submission if any question is unanswered. We check by index
    // because userAnswers is keyed by the question index in the quiz.
    const unanswered = quiz.questions
      .map((_, idx) => idx)
      .filter((idx) => userAnswers[idx] === undefined || userAnswers[idx] === null || userAnswers[idx] === '')
    if (unanswered.length > 0) {
      const list = unanswered.map((i) => i + 1).join(', ')
      setError(`Please answer all questions before submitting. Unanswered: Q${list}`)
      // Jump the user to the first unanswered question for convenience
      setCurrentQuestionIndex(unanswered[0])
      return
    }
    setError(null)

    try {
      setLoading(true)

      // Calculate scores
      let correctCount = 0
      quiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index]
        const correctAnswer = question.answer
        // Compare by normalized answer key — TEXT options are stored as the full
        // line ("C. lamp X") while question.answer is just the letter ("C").
        if (answerKey(userAnswer) && answerKey(userAnswer) === answerKey(correctAnswer)) {
          correctCount++
        }
      })

      const percentage = Math.round((correctCount / quiz.questions.length) * 100)
      const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000)

      // Submit to backend
      const submitResponse = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          difficulty: selectedDifficulty || null,
          // For display/grouping in Saved/History: join multiple picks with " · "
          subtopic: selectedSubtopics.filter(Boolean).length > 0
            ? selectedSubtopics.filter(Boolean).join(' · ')
            : (selectedSubtopic || null),
          count: quiz.questions.length,
          time_spent_seconds: timeSpent,
          user_answers: userAnswers,
          score: correctCount,
          percentage: percentage,
          // When the user came in via the Retake button on a saved quiz,
          // tag this submission with the original attempt id so the backend
          // records it as a retake (visible in History, not Saved Quizzes).
          parent_attempt_id: (isRetaking && retakeParentId) || null,
          // Name is only used by the backend on the original (first) attempt;
          // retakes inherit the parent's name regardless of what we send.
          name: !isRetaking ? (quizName.trim() || null) : null,
          questions: quiz.questions.map((q, idx) => ({
            ...q,  // Send ALL question fields
            index: idx
          }))
        })
      })

      if (!submitResponse.ok) {
        throw new Error('Failed to save quiz results')
      }

      const submitData = await submitResponse.json()
      console.log('Quiz submitted successfully:', submitData)

      setShowResults({ correctCount, percentage, attemptId: submitData.attempt_id })
      setSubmitSuccess(`Quiz saved! You scored ${correctCount}/${quiz.questions.length} (${percentage}%)`)
    } catch (err) {
      setError(`Error submitting quiz: ${err.message}`)
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetakeQuiz = () => {
    setQuiz(null)
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setShowResults(false)
    setError(null)
    setSubmitSuccess(null)
    setIsRetaking(false)
    setRetakeParentId(null)
    if (onRetakeClear) {
      onRetakeClear()
    }
  }

  // ==================== RENDER ====================

  // Filter Selection Screen
  if (!quiz) {
    return (
      <div className="quiz-maker">
        <div className="quiz-header-section">
          <h1>✏️ Create a Practice Quiz</h1>
          <p>Choose your filters to generate questions</p>
        </div>

        <div className="filter-card">
          {error && <div className="error-message">{error}</div>}
          {submitSuccess && (
            <div style={{
              padding: '15px',
              background: '#dcfce7',
              border: '1px solid #86efac',
              borderLeft: '4px solid #22c55e',
              color: '#166534',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              ✅ {submitSuccess}
            </div>
          )}

          <form onSubmit={handleCreateQuiz} className="filter-form">
            <div className="form-group">
              <label>Quiz Name</label>
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                placeholder="e.g. Electricity drill #1 (optional)"
                className="form-input"
                maxLength={120}
              />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="form-select"
              >
                <option value="Physics">⚛️ Physics</option>
                <option value="Math" disabled>➗ Math (coming soon)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Topics (pick up to 3)</label>
              {[0, 1, 2].map((slotIdx) => {
                const value = selectedSubtopics[slotIdx] || ''
                // Topics already chosen in OTHER slots — disable them in this dropdown.
                const taken = new Set(
                  selectedSubtopics
                    .filter((_, i) => i !== slotIdx)
                    .filter(Boolean)
                )
                // Only show slot 2/3 once the previous slot has a value.
                if (slotIdx > 0 && !selectedSubtopics[slotIdx - 1]) return null
                return (
                  <select
                    key={slotIdx}
                    value={value}
                    onChange={(e) => {
                      const next = [...selectedSubtopics]
                      const v = e.target.value
                      if (!v) {
                        // Clearing this slot also clears any later slots.
                        next.splice(slotIdx)
                      } else {
                        next[slotIdx] = v
                      }
                      setSelectedSubtopics(next.filter(Boolean))
                    }}
                    className="form-select"
                    style={{ marginTop: slotIdx > 0 ? '8px' : 0 }}
                  >
                    <option value="">
                      {slotIdx === 0 ? '📚 All Topics' : `+ Add another topic (${slotIdx + 1} of 3)`}
                    </option>
                    {subtopics.map((sub) => (
                      <option key={sub} value={sub} disabled={taken.has(sub)}>
                        {sub}
                      </option>
                    ))}
                  </select>
                )
              })}
              {selectedSubtopics.filter(Boolean).length > 1 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginTop: '6px' }}>
                  Questions will be split randomly across {selectedSubtopics.filter(Boolean).length} topics.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Difficulty Level</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="form-select"
              >
                <option value="">⭐ All Levels</option>
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Number of Questions</label>
              <input
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
            >
              {loading ? '⏳ Starting practice set...' : '🚀 Start practice set'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Results Screen
  if (showResults) {
    const { correctCount, percentage } = showResults
    return (
      <div className="quiz-maker">
        <div className="results-card">
          <h2>📊 Practice Results</h2>

          <div className="results-score">
            <div className="score-circle">
              <div className="score-number">{percentage}%</div>
              <div className="score-label">Score</div>
            </div>
            <div className="results-text">
              <p>You got <strong>{correctCount}</strong> out of <strong>{quiz.questions.length}</strong> questions correct!</p>
            </div>
          </div>

          <div className="results-actions">
            <button onClick={handleRetakeQuiz} className="btn btn-primary">
              🔄 Practice Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Taking Screen
  const currentQuestion = quiz.questions[currentQuestionIndex]
  const totalCount = quiz.questions.length

  return (
    <div className="quiz-maker">
      <div className="quiz-card">
        <div className="quiz-header">
          <h1>{currentQuestion.question_text}</h1>
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {totalCount}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / totalCount) * 100}%`
              }}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="question-section">
          {/* Question diagram (setup image) — always shown if present */}
          {currentQuestion.setup_image_url && (
            <div className="image-container">
              <img
                src={currentQuestion.setup_image_url}
                alt="Question diagram"
                className="question-image"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}

          {/* For IMAGE-type questions, show the options image (if distinct from the setup diagram) */}
          {currentQuestion.option_type === 'IMAGE' &&
            currentQuestion.image_url &&
            currentQuestion.image_url !== currentQuestion.setup_image_url && (
              <div className="image-container">
                <img
                  src={currentQuestion.image_url}
                  alt="Answer options"
                  className="question-image"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}

          {/* Fallback for legacy non-IMAGE questions where setup_image_url was empty
              and only image_url is populated */}
          {currentQuestion.option_type !== 'IMAGE' &&
            !currentQuestion.setup_image_url &&
            currentQuestion.image_url && (
              <div className="image-container">
                <img
                  src={currentQuestion.image_url}
                  alt="Question"
                  className="question-image"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            )}

          {/* Display options based on type */}
          {currentQuestion.option_type === 'TABLE' ? (
            (() => {
              // Headers may be a flat list (single-level) or a list of lists (multi-level).
              // Use the deepest row as the column keys for each data row.
              const rawHeaders = currentQuestion.table_headers || []
              const flatHeaders = Array.isArray(rawHeaders[0])
                ? rawHeaders[rawHeaders.length - 1]
                : rawHeaders
              const rows = Array.isArray(currentQuestion.table_rows) ? currentQuestion.table_rows : []
              // table_rows are dicts keyed by header, with `_letter` for selection ('A'/'B'/...)
              const rowLetter = (row) => (row && typeof row === 'object' ? row._letter : null)
              return (
                <div className="table-options-container">
                  <table className="options-table">
                    <thead>
                      <tr>
                        {flatHeaders.map((header, idx) => (
                          <th key={idx}>{header}</th>
                        ))}
                        <th style={{ width: '70px', textAlign: 'center' }}>Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIdx) => {
                        const letter = rowLetter(row) || String.fromCharCode(65 + rowIdx) // fallback A/B/C/D
                        const isSelected = userAnswers[currentQuestionIndex] === letter
                        return (
                          <tr
                            key={rowIdx}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: letter })}
                          >
                            {flatHeaders.map((header, cellIdx) => (
                              <td key={cellIdx}>
                                {row && typeof row === 'object' ? (row[header] ?? '') : ''}
                              </td>
                            ))}
                            <td className="option-selector-col">
                              <input
                                type="radio"
                                name={`question-${currentQuestionIndex}`}
                                checked={isSelected}
                                onChange={() => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: letter })}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()
          ) : currentQuestion.option_type === 'IMAGE' ? (
            // The options live inside the image above — just render A/B/C/D radios
            <div className="options-container">
              {['A', 'B', 'C', 'D'].map((letter) => {
                const isSelected = userAnswers[currentQuestionIndex] === letter
                return (
                  <label key={letter} className={`option-label ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      className="option-input"
                      checked={isSelected}
                      onChange={() => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: letter })}
                    />
                    <span className="option-text">{letter}</span>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="options-container">
              {currentQuestion.options && currentQuestion.options.split('\n').map((option, idx) => {
                const isSelected = userAnswers[currentQuestionIndex] === option.trim()
                return (
                  <label key={idx} className={`option-label ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      className="option-input"
                      checked={isSelected}
                      onChange={() => setUserAnswers({ ...userAnswers, [currentQuestionIndex]: option.trim() })}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="navigation-section">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn btn-secondary"
          >
            ← Previous
          </button>

          <span className="nav-indicator">
            {currentQuestionIndex + 1} / {totalCount}
          </span>

          {currentQuestionIndex === totalCount - 1 ? (() => {
            const unansweredCount = quiz.questions.filter(
              (_, i) => userAnswers[i] === undefined || userAnswers[i] === null || userAnswers[i] === ''
            ).length
            const allAnswered = unansweredCount === 0
            return (
              <button
                onClick={handleSubmitQuiz}
                disabled={loading || !allAnswered}
                className={`btn btn-success ${loading ? 'loading' : ''}`}
                title={!allAnswered ? `${unansweredCount} unanswered question(s) — please answer all before submitting` : ''}
              >
                {loading
                  ? '⏳ Submitting...'
                  : allAnswered
                  ? '✅ Submit Practice Quiz'
                  : `⚠️ ${unansweredCount} unanswered`}
              </button>
            )
          })() : (
            <button
              onClick={handleNextQuestion}
              className="btn btn-secondary"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

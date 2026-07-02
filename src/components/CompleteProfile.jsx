import React, { useState } from 'react'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// CompleteProfile — the gate shown to any signed-in user who is missing
// school / class / teacher (Google signups + accounts created before these
// fields existed). Same three required fields as the email signup form; on
// success it PATCHes the user via /api/auth/complete-profile.
export default function CompleteProfile({ user, onComplete, onLogout }) {
  const [school, setSchool] = useState(user?.school || '')
  const [studentClass, setStudentClass] = useState(user?.student_class || '')
  const [teacher, setTeacher] = useState(user?.teacher || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const inputCls =
    'w-full rounded-2xl bg-white border-2 border-[#E5E7EB] px-4 py-3 text-base ' +
    'text-quiz-text placeholder:text-quiz-muted focus:outline-none focus:border-quiz-blue ' +
    'focus:ring-2 focus:ring-quiz-blue/40 transition-colors disabled:opacity-60'

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!school)              { setError('Please select your school'); return }
    if (!studentClass.trim()) { setError('Please enter your class'); return }
    if (!teacher)             { setError('Please select your teacher'); return }
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE_URL}/api/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ school, student_class: studentClass.trim(), teacher }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not save your details')
      onComplete({ school: data.school, student_class: data.student_class, teacher: data.teacher })
    } catch (err) {
      setError(err.message || 'Could not save your details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Screen width="narrow">
        <div className="text-center mb-6">
          <img
            src="/brand/ooka/mascot/ooka_mascot_4.png"
            alt="Ooka mascot"
            className="w-28 h-28 sm:w-36 sm:h-36 mx-auto object-contain"
          />
          <h1 className="!text-2xl !font-black tracking-tight mt-2">One more step</h1>
          <p className="text-quiz-muted font-semibold text-sm">
            Tell us your school, class and teacher to finish setting up your account.
          </p>
        </div>

        <Card variant="solid" className="!p-6 sm:!p-8 space-y-5">
          {error && (
            <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">School</label>
              <select
                value={school} onChange={(e) => setSchool(e.target.value)}
                required disabled={loading} className={inputCls}
              >
                <option value="">Select your school</option>
                <option value="ESSS">ESSS</option>
                <option value="BGSS">BGSS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Class</label>
              <input
                type="text" value={studentClass} onChange={(e) => setStudentClass(e.target.value)}
                placeholder="e.g. 3E1" required disabled={loading}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Teacher</label>
              <select
                value={teacher} onChange={(e) => setTeacher(e.target.value)}
                required disabled={loading} className={inputCls}
              >
                <option value="">Select your teacher</option>
                <option value="Mr Lloyd Goh">Mr Lloyd Goh</option>
              </select>
            </div>

            <Button3d type="submit" variant="purple" size="lg" full disabled={loading}>
              {loading ? '⏳ Saving...' : '✅ Finish setup'}
            </Button3d>
          </form>

          {onLogout && (
            <button
              type="button" onClick={onLogout}
              className="w-full text-center text-xs font-bold text-quiz-muted hover:text-quiz-blue"
            >
              Log out
            </button>
          )}
        </Card>
      </Screen>
    </div>
  )
}

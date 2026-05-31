import React, { useState } from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

// SignupPage — QuizQuest-styled. Same /api/auth/signup + Google flow as before.
export default function SignupPage({ onSignupSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const validate = () => {
    if (!name.trim())                                    return 'Please enter your name'
    if (!email.trim())                                   return 'Please enter your email'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))       return 'Please enter a valid email'
    if (password.length < 6)                             return 'Password must be at least 6 characters'
    if (password !== confirmPassword)                    return 'Passwords do not match'
    return null
  }

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) { setError(v); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onSignupSuccess(data.token, data.user)
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Google signup failed')
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onSignupSuccess(data.token, data.user)
    } catch (err) {
      setError(err.message || 'Google signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-2xl bg-white border-2 border-[#E5E7EB] ' +
    'px-4 py-3 text-base text-quiz-text placeholder:text-quiz-muted ' +
    'focus:outline-none focus:border-quiz-blue focus:ring-2 focus:ring-quiz-blue/40 ' +
    'transition-colors disabled:opacity-60'

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Screen width="narrow">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🚀</div>
          <h1 className="!text-4xl !font-black mb-1 tracking-tight">Join HabitGo</h1>
          <p className="text-quiz-muted font-semibold">Create your account and start climbing the ranks</p>
        </div>

        <Card variant="solid" className="!p-6 sm:!p-8 space-y-5">
          {error && (
            <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Display Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" required disabled={loading}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com" required disabled={loading}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" required disabled={loading}
                  className={inputCls + ' pr-12'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl opacity-80 hover:opacity-100">
                  {showPw ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showCpw ? 'text' : 'password'}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type it again" required disabled={loading}
                  className={inputCls + ' pr-12'}
                />
                <button type="button" onClick={() => setShowCpw(!showCpw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl opacity-80 hover:opacity-100">
                  {showCpw ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <Button3d type="submit" variant="purple" size="lg" full disabled={loading}>
              {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
            </Button3d>
          </form>

          <div className="flex items-center gap-3 text-xs font-bold text-quiz-muted uppercase tracking-widest">
            <div className="flex-1 h-px bg-quiz-border" />
            or
            <div className="flex-1 h-px bg-quiz-border" />
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div className="flex justify-center">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google signup failed. Please try again.')}
                  theme="filled_black" size="large" shape="pill" width="100%"
                />
              </GoogleOAuthProvider>
            </div>
          ) : (
            <p className="text-center text-xs text-quiz-muted">
              (Google sign-in not configured)
            </p>
          )}
        </Card>

        <p className="text-center text-sm text-quiz-muted mt-6">
          Already have an account?{' '}
          <button
            onClick={() => (window.location.href = '/login')}
            className="text-quiz-blue font-bold underline-offset-4 hover:underline"
          >
            Log in
          </button>
        </p>
      </Screen>
    </div>
  )
}

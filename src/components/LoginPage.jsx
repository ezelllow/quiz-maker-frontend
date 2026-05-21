import React, { useState } from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import Screen from './ui/Screen'
import Card from './ui/Card'
import Button3d from './ui/Button3d'

// LoginPage — QuizQuest-styled rebuild (pilot screen for the redesign).
// Functionality unchanged: same /api/auth/login + /api/auth/google calls,
// same localStorage writes, same onLoginSuccess callback.
export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLoginSuccess(data.token, data.user)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Google login failed')
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLoginSuccess(data.token, data.user)
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.')
      console.error('Google login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => setError('Google login failed. Please try again.')

  const inputCls =
    'w-full rounded-2xl bg-[#1a1a35] border-2 border-[rgba(140,140,220,0.25)] ' +
    'px-4 py-3 text-base text-quiz-text placeholder:text-quiz-muted ' +
    'focus:outline-none focus:border-quiz-blue focus:ring-2 focus:ring-quiz-blue/40 ' +
    'transition-colors disabled:opacity-60'

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Screen width="narrow">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎯</div>
          <h1 className="!text-4xl !font-black mb-1 tracking-tight">HabitGo</h1>
          <p className="text-quiz-muted font-semibold">Welcome back, ready to level up?</p>
        </div>

        <Card variant="solid" className="!p-6 sm:!p-8 space-y-5">
          {error && (
            <div className="rounded-2xl border-2 border-quiz-red/50 bg-quiz-red/15 text-quiz-red px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={loading}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-quiz-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className={inputCls + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xl opacity-80 hover:opacity-100"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <Button3d
              type="submit"
              variant="green"
              size="lg"
              full
              disabled={loading}
            >
              {loading ? '⏳ Logging in...' : '🔓 Login'}
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
                  onError={handleGoogleError}
                  theme="filled_black"
                  size="large"
                  shape="pill"
                  width="100%"
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
          Don't have an account?{' '}
          <button
            onClick={() => (window.location.href = '/signup')}
            className="text-quiz-blue font-bold underline-offset-4 hover:underline"
          >
            Sign up
          </button>
        </p>
      </Screen>
    </div>
  )
}

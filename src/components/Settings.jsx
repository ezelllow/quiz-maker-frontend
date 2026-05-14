import React, { useState, useRef } from 'react'
import './Settings.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Resize an uploaded image to a square <=256px and return a JPEG data URL.
// Keeps the avatar payload small (~10-40KB) so it fits comfortably in the DB.
function resizeImageToDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        // center-crop to square
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Settings({ onLogout, user, onUserUpdate }) {
  const token = localStorage.getItem('auth_token')
  const stored = user || JSON.parse(localStorage.getItem('user') || '{}')

  const [name, setName] = useState(stored.name || '')
  const [avatarUrl, setAvatarUrl] = useState(stored.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInputRef = useRef(null)

  const email = stored.email || ''
  // Has the user changed anything?
  const dirty = name.trim() !== (stored.name || '') || avatarUrl !== (stored.avatar_url || '')

  const handlePickFile = () => fileInputRef.current && fileInputRef.current.click()

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setError(null)
    setSuccess(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, etc.)')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('That image is too large. Please pick one under 8MB.')
      return
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setAvatarUrl(dataUrl)
    } catch (err) {
      setError(err.message || 'Could not process that image')
    }
    // reset so picking the same file again still fires onChange
    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    setAvatarUrl('')
    setError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    if (!name.trim()) {
      setError('Display name cannot be empty')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          avatar_url: avatarUrl || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save profile')

      // Persist the updated user everywhere the app reads it
      localStorage.setItem('user', JSON.stringify(data.user))
      if (onUserUpdate) onUserUpdate(data.user)
      setSuccess('Profile updated!')
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = (name || email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>👤 Profile</h1>
        <p>Manage your account</p>
      </div>

      {/* Editable profile card */}
      <div className="settings-section">
        <h2>Profile</h2>

        {error && <div className="settings-banner error">{error}</div>}
        {success && <div className="settings-banner success">{success}</div>}

        <div className="profile-edit">
          {/* Avatar */}
          <div className="avatar-block">
            <div className="avatar-preview">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" />
                : <span className="avatar-initials">{initials}</span>}
            </div>
            <div className="avatar-actions">
              <button type="button" className="btn-soft" onClick={handlePickFile}>
                {avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarUrl && (
                <button type="button" className="btn-ghost-danger" onClick={handleRemovePhoto}>
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            <p className="avatar-hint">JPG or PNG. We'll resize it to a 256×256 square.</p>
          </div>

          {/* Fields */}
          <div className="profile-fields">
            <div className="field">
              <label>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={120}
                className="settings-input"
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="text"
                value={email}
                disabled
                className="settings-input disabled"
              />
              <p className="field-hint">Email can't be changed.</p>
            </div>

            <button
              type="button"
              className="btn-save"
              onClick={handleSave}
              disabled={saving || !dirty}
            >
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="settings-section danger">
        <h2>Account Actions</h2>
        <div className="settings-actions">
          <button onClick={(e) => { e.preventDefault(); onLogout && onLogout() }} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  )
}

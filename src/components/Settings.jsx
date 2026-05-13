import React from 'react'
import './Settings.css'

export default function Settings({ onLogout, user }) {
  const userData = user || JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = (e) => {
    e.preventDefault()
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>👤 Profile</h1>
        <p>Manage your account</p>
      </div>

      {/* User Information */}
      <div className="settings-section">
        <h2>Account Information</h2>
        <div className="settings-items">
          <div className="setting-item">
            <div className="setting-info">
              <h3>Full Name</h3>
              <p className="setting-value">{userData.name || 'Not set'}</p>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Email</h3>
              <p className="setting-value">{userData.email || 'Not set'}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Account Actions */}
      <div className="settings-section danger">
        <h2>Account Actions</h2>
        <div className="settings-actions">
          <button onClick={handleLogout} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  )
}

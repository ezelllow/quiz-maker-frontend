import React, { useState } from 'react'
import './Layout.css'

export default function Layout({ children, currentPage, onNavigate, userName, userAvatar, rank, onLogout }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const initials = (userName || 'Student').trim().charAt(0).toUpperCase()

  const handleLogoutClick = (e) => {
    e.preventDefault()
    if (onLogout) {
      onLogout()
    }
  }

  const navItems = [
    { id: 'quiz', icon: '✏️', label: 'Practice' },
    { id: 'daily', icon: '🔥', label: 'Daily' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'saved', icon: '💾', label: 'Saved' },
    { id: 'history', icon: '📋', label: 'History' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ]

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">QuizMaker</span>
          </div>
        </div>

        <div className="navbar-right">
          {rank && (
            <div
              title={rank.tier_name}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', marginRight: 4, borderRadius: 999,
                background: 'linear-gradient(135deg, rgba(93,169,255,0.18), rgba(139,92,246,0.18))',
                border: '1px solid rgba(93,169,255,0.35)',
              }}
            >
              <span style={{ fontSize: 14 }}>{rank.tier_icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#5DA9FF' }}>
                {rank.tier_name}
              </span>
            </div>
          )}
          <div className="profile-dropdown">
            <button
              className="profile-button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="Profile menu"
            >
              <span className="profile-avatar">
                {userAvatar
                  ? <img src={userAvatar} alt="" className="profile-avatar-img" />
                  : initials}
              </span>
              <span className="profile-name">{userName || 'Student'}</span>
            </button>
            {profileMenuOpen && (
              <div className="profile-menu">
                <button onClick={() => { onNavigate('settings'); setProfileMenuOpen(false); }} className="profile-menu-item">⚙️ Settings</button>
                <hr className="profile-menu-divider" />
                <button onClick={handleLogoutClick} className="profile-menu-item logout">🚪 Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}

import React, { useState } from 'react'
import './Layout.css'

export default function Layout({ children, currentPage, onNavigate, userName, onLogout }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const handleLogoutClick = (e) => {
    e.preventDefault()
    if (onLogout) {
      onLogout()
    }
  }

  const navItems = [
    { id: 'quiz', icon: '✏️', label: 'Quiz' },
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
          <div className="profile-dropdown">
            <button
              className="profile-button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="Profile menu"
            >
              <span className="profile-avatar">👤</span>
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

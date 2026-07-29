import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Curriculum from './pages/Curriculum'
import Portal from './pages/Portal'
import VirtualSchoolMap from './pages/VirtualSchoolMap'

import { ChevronRightIcon, MenuIcon, XIcon } from './lib/icons.jsx'

const AppPlatform = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Dashboard', to: '/' },
    { label: 'Curriculum', to: '/curriculum' },
    { label: 'Virtual School', to: '/virtual-school' },
    { label: 'Agents', to: '/agents' },
    { label: 'Portal', to: '/portal' },
  ]

  const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:3003'

  return (
    <Router>
      <div className="kev-app">
        <a className="skip-link" href="#main">Skip to content</a>
        <header className={`kev-nav${scrolled ? ' kev-nav-scrolled' : ''}`} role="banner" aria-label="Platform header">
          <div className="kev-nav-inner">
            <Link to="/" className="kev-brand">KEV Platform</Link>

            <nav id="kev-nav-links" className={`kev-nav-links${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Platform navigation">
              {navLinks.map((item) => (
                <Link key={item.to} to={item.to} className="kev-nav-link" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}

              <a
                className="kev-btn kev-btn-secondary"
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </a>
              <a
                className="kev-btn kev-btn-primary"
                href="#main"
              >
                Go Live
                <ChevronRightIcon style={{ marginLeft: '0.5rem' }} width={18} height={18} aria-hidden="true" />
              </a>
            </nav>

            <button className="kev-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-controls="kev-nav-links" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
              {menuOpen ? <XIcon width={22} height={22} aria-hidden="true" /> : <MenuIcon width={22} height={22} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <main id="main" role="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/virtual-school" element={<VirtualSchoolMap />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/portal" element={<Portal />} />
          </Routes>
        </main>

        <footer className="kev-footer">
          <div className="kev-footer-inner">
            <p style={{ fontWeight: 700, color: '#0f172a' }}>KEV Platform</p>
            <p style={{ maxWidth: '740px', color: '#475569' }}>
              The KEV learning platform for managing curriculum, tutors, and learner operations in real time.
            </p>
            <p style={{ color: '#68778c', fontSize: '0.95rem' }}>
              © 2026 KEV • Learning platform • 185+ subjects • 230+ tutors
            </p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default AppPlatform

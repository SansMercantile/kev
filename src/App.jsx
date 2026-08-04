import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import Landing from './pages/Landing'
import Docs from './pages/Docs'
import Technical from './pages/Technical'
import Categories from './pages/Categories'
import Platform from './pages/Platform'
import Integration from './pages/Integration'
import VirtualSchoolMap from './pages/VirtualSchoolMap'
import VRCampus from './pages/VRCampus'

import { ChevronRightIcon, MenuIcon, XIcon } from './lib/icons.jsx'

const App = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Explore', to: '/explore' },
    { label: 'Platform', to: '/platform' },
    { label: 'Campus Map', to: '/campus-map' },
    { label: 'VR Campus', to: '/vr' },
    { label: 'Docs', to: '/docs' },
    { label: 'Tech', to: '/tech' },
  ]

  return (
    <Router>
      <div className="kev-app">
        <a className="skip-link" href="#main">Skip to content</a>
        <header className={`kev-nav${scrolled ? ' kev-nav-scrolled' : ''}`} role="banner" aria-label="Top header">
          <div className="kev-nav-inner">
            <Link to="/" className="kev-brand">
              <img src="/kev-logo.svg" alt="KEV" className="kev-brand-logo" width={32} height={32} />
              KEV
            </Link>

            <nav id="kev-nav-links" className={`kev-nav-links${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
              {navLinks.map((item) => (
                <Link key={item.to} to={item.to} className="kev-nav-link" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}

              <a
                className="kev-btn kev-btn-primary"
                href="https://sansmercantile.com/contact"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact
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
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Landing />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/tech" element={<Technical />} />
            <Route path="/technical" element={<Technical />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/campus-map" element={<VirtualSchoolMap />} />
            <Route path="/vr" element={<VRCampus />} />
          </Routes>
        </main>

        <footer className="kev-footer">
          <div className="kev-footer-inner">
            <p style={{ fontWeight: 700, color: '#0f172a' }}>KEV</p>
            <p style={{ maxWidth: '740px', color: '#475569' }}>
              KEV provides the curriculum, tutor orchestration, and analytics needed to scale
              personalized learning across institutions and immersive environments.
            </p>
            <p style={{ color: '#68778c', fontSize: '0.95rem' }}>
              © 2026 KEV • 185+ subjects • 230+ specialized tutors • Constellation-ready
            </p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App

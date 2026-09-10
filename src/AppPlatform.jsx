import React, { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import OfflineBanner from './components/OfflineBanner'

import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Curriculum from './pages/Curriculum'
import Portal from './pages/Portal'
import Pricing from './pages/Pricing'
import Billing from './pages/Billing'
import VirtualSchoolMap from './pages/VirtualSchoolMap'
import VRCampus from './pages/VRCampus'
const ImmersiveLab = lazy(() => import('./pages/ImmersiveLab'))
const XRAcademy = lazy(() => import('./pages/XRAcademy'))

import { ChevronRightIcon, MenuIcon, XIcon } from './lib/icons.jsx'
import { setAuthToken, getCurriculumSubjects, getAgentsAvailable } from './lib/api'

function RequireAuth({ children }) {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  if (isLoading) return null

  if (!isAuthenticated) {
    return (
      <section className="kev-section" aria-label={t('nav.signInRequired')}>
        <h2 className="kev-section-title">{t('nav.signInRequired')}</h2>
        <p className="kev-section-copy">{t('nav.classroomRequiredBody')}</p>
        <button className="kev-btn kev-btn-primary" onClick={() => loginWithRedirect()}>
          {t('nav.signIn')}
        </button>
      </section>
    )
  }

  return children
}

const AppPlatform = () => {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [liveCounts, setLiveCounts] = useState(null)
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Live footer counts (subjects + tutors) so marketing numbers are real.
  useEffect(() => {
    let cancelled = false
    Promise.all([getCurriculumSubjects().catch(() => null), getAgentsAvailable().catch(() => null)])
      .then(([subjects, agents]) => {
        if (cancelled || !subjects?.subjects) return
        setLiveCounts({ subjects: subjects.subjects.length, tutors: agents?.agents?.length || 0 })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthToken(null)
      return
    }
    let cancelled = false
    getAccessTokenSilently()
      .then((token) => { if (!cancelled) setAuthToken(token) })
      .catch(() => { if (!cancelled) setAuthToken(null) })
    return () => { cancelled = true }
  }, [isAuthenticated, getAccessTokenSilently])

  const navLinks = [
    { label: t('nav.dashboard'), to: '/' },
    { label: t('nav.curriculum'), to: '/curriculum' },
    { label: t('nav.virtualSchool'), to: '/virtual-school' },
    { label: t('nav.vrCampus'), to: '/vr' },
    { label: t('nav.immersiveLab'), to: '/anatomy' },
    { label: t('nav.xrAcademy'), to: '/xr-academy' },
    { label: t('nav.agents'), to: '/agents' },
    { label: t('nav.portal'), to: '/portal' },
    { label: t('nav.pricing'), to: '/pricing' },
    { label: t('nav.billing'), to: '/billing' },
  ]

  const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:3003'

  return (
    <Router>
      <div className="kev-app">
        <a className="skip-link" href="#main">{t('nav.skipToContent')}</a>
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
                {t('nav.website')}
              </a>
              <a
                className="kev-btn kev-btn-primary"
                href="#main"
              >
                {t('nav.goLive')}
                <ChevronRightIcon style={{ marginLeft: '0.5rem' }} width={18} height={18} aria-hidden="true" />
              </a>
              <LanguageSwitcher compact />
            </nav>

            <button className="kev-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-controls="kev-nav-links" aria-expanded={menuOpen} aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}>
              {menuOpen ? <XIcon width={22} height={22} aria-hidden="true" /> : <MenuIcon width={22} height={22} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <OfflineBanner />

        <main id="main" role="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/virtual-school" element={<VirtualSchoolMap />} />
            <Route path="/vr" element={<RequireAuth><VRCampus /></RequireAuth>} />
            <Route path="/anatomy" element={<Suspense fallback={<section className="kev-section">Loading Immersive Lab...</section>}><ImmersiveLab /></Suspense>} />
            <Route path="/xr-academy" element={<RequireAuth><Suspense fallback={<section className="kev-section">Loading XR Academy...</section>}><XRAcademy /></Suspense></RequireAuth>} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
          </Routes>
        </main>

        <footer className="kev-footer">
          <div className="kev-footer-inner">
            <p style={{ fontWeight: 700, color: '#0f172a' }}>KEV Platform</p>
            <p style={{ maxWidth: '740px', color: '#475569' }}>
              {t('nav.platformFooterTagline')}
            </p>
            <p style={{ color: '#68778c', fontSize: '0.95rem' }}>
              {liveCounts ? t('nav.platformFooterRights', liveCounts) : t('nav.platformFooterRightsPlain')}
            </p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default AppPlatform

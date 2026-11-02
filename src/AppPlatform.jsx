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
import Signup from './pages/Signup'
import Login from './pages/Login'
import VirtualSchoolMap from './pages/VirtualSchoolMap'
import VRCampus from './pages/VRCampus'
const ImmersiveLab = lazy(() => import('./pages/ImmersiveLab'))
const XRAcademy = lazy(() => import('./pages/XRAcademy'))

import { ChevronRightIcon, MenuIcon, XIcon } from './lib/icons.jsx'
import { setAuthToken, setUnauthorizedHandler, getCurriculumSubjects, getAgentsAvailable } from './lib/api'
import { DEV_BYPASS_AUTH, DevAuthBypassBanner } from './lib/devAuthBypass'
import { restoreNativeSession, refreshOnUnauthorized, useNativeUser } from './lib/nativeAuth'
import RoleLogin from './components/RoleLogin'
import { getRole, ROLES, signOutOfRole } from './lib/roleSession'

const TeacherStudio = lazy(() => import('./pages/TeacherStudio'))

/**
 * Landing-page role gate. KEV is one building with two schools in it: until a
 * visitor chooses a door they get the login choice, and afterwards each role
 * only ever sees its own surfaces (the route table below and the backend both
 * enforce this again - the gate is convenience, not the boundary).
 */
function RoleGate({ roles, children }) {
  const [, setTick] = useState(0)
  const role = getRole()
  if (!role || (roles && !roles.includes(role))) {
    return <RoleLogin onSignedIn={() => setTick((n) => n + 1)} />
  }
  return children
}

function RequireAuth({ children }) {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  const nativeUser = useNativeUser()

  // Dev-only shortcut, after the hooks so their order is unconditional. Gated on
  // two compile-time constants and stripped from production builds — see
  // lib/devAuthBypass.jsx.
  if (DEV_BYPASS_AUTH) return children

  if (isLoading) return null

  if (!isAuthenticated && !nativeUser) {
    return (
      <section className="kev-section" aria-label={t('nav.signInRequired')}>
        <h2 className="kev-section-title">{t('nav.signInRequired')}</h2>
        <p className="kev-section-copy">{t('nav.classroomRequiredBody')}</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="kev-btn kev-btn-primary" to="/login">
            {t('nav.signIn')}
          </Link>
          <Link className="kev-btn kev-btn-secondary" to="/signup">
            Create account
          </Link>
          <button className="kev-btn kev-btn-secondary" onClick={() => loginWithRedirect()}>
            Continue with Auth0
          </button>
        </div>
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
  // Bumped when the role session changes so nav and gates re-read it.
  const [, setRoleTick] = useState(0)
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
    setUnauthorizedHandler(() => refreshOnUnauthorized())
    let cancelled = false
    restoreNativeSession()
      .then((nativeSession) => {
        if (cancelled || nativeSession) return
        if (!isAuthenticated) {
          setAuthToken(null)
          return
        }
        return getAccessTokenSilently()
          .then((token) => { if (!cancelled) setAuthToken(token) })
          .catch(() => { if (!cancelled) setAuthToken(null) })
      })
      .catch(() => {
        if (!cancelled && !isAuthenticated) setAuthToken(null)
      })
    return () => { cancelled = true }
    // SWAP-POINT (kev/docs/AUTH0_ROLES_AND_COHORTS.md): once the tenant emits
    // role / study_level claims, decode them from this token (or read
    // useAuth0().user) and seed the role session from the verified claims
    // instead of the landing-page choice; roleHeaders() then stops asserting
    // what the token already proves.
  }, [isAuthenticated, getAccessTokenSilently])

  // Role-shaped navigation: a teacher's bar carries the teaching studio and
  // drops the student portal; a student's bar never shows the studio. The
  // routes are guarded independently - this only keeps each role's view clean.
  const sessionRole = getRole()
  const navLinks = [
    { label: t('nav.dashboard'), to: '/' },
    { label: t('nav.curriculum'), to: '/curriculum' },
    { label: t('nav.virtualSchool'), to: '/virtual-school' },
    { label: t('nav.vrCampus'), to: '/vr' },
    { label: t('nav.immersiveLab'), to: '/anatomy' },
    { label: t('nav.xrAcademy'), to: '/xr-academy' },
    { label: t('nav.agents'), to: '/agents' },
    ...(sessionRole === ROLES.TEACHER
      ? [{ label: 'Teaching studio', to: '/teacher' }]
      : [{ label: t('nav.portal'), to: '/portal' }]),
    { label: t('nav.pricing'), to: '/pricing' },
    { label: t('nav.billing'), to: '/billing' },
  ]

  const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'http://localhost:3003'

  return (
    <Router>
      <div className="kev-app">
        <a className="skip-link" href="#main">{t('nav.skipToContent')}</a>
        <DevAuthBypassBanner />
        <header className={`kev-nav${scrolled ? ' kev-nav-scrolled' : ''}`} role="banner" aria-label="Platform header">
          <div className="kev-nav-inner">
            <Link to="/" className="kev-brand">KEV Platform</Link>

            <nav id="kev-nav-links" className={`kev-nav-links${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Platform navigation">
              {navLinks.map((item) => (
                <Link key={item.to} to={item.to} className="kev-nav-link" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}

              <div className="kev-nav-actions">
                {sessionRole && (
                  <button
                    type="button"
                    className="kev-btn kev-btn-secondary"
                    onClick={() => { signOutOfRole(); setRoleTick((n) => n + 1) }}
                  >
                    Switch role
                  </button>
                )}
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
              </div>
            </nav>

            <button className="kev-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-controls="kev-nav-links" aria-expanded={menuOpen} aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}>
              {menuOpen ? <XIcon width={22} height={22} aria-hidden="true" /> : <MenuIcon width={22} height={22} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <OfflineBanner />

        <main id="main" role="main">
          <Routes>
            <Route path="/" element={<RoleGate><Dashboard /></RoleGate>} />
            <Route path="/dashboard" element={<RoleGate><Dashboard /></RoleGate>} />
            <Route
              path="/teacher"
              element={(
                <RoleGate roles={[ROLES.TEACHER]}>
                  <Suspense fallback={<section className="kev-section">Loading teaching studio...</section>}>
                    <TeacherStudio />
                  </Suspense>
                </RoleGate>
              )}
            />
            <Route path="/curriculum" element={<RequireAuth><Curriculum /></RequireAuth>} />
            <Route path="/virtual-school" element={<RequireAuth><VirtualSchoolMap /></RequireAuth>} />
            <Route path="/vr" element={<RequireAuth><VRCampus /></RequireAuth>} />
            <Route path="/anatomy" element={<RequireAuth><Suspense fallback={<section className="kev-section">Loading Immersive Lab...</section>}><ImmersiveLab /></Suspense></RequireAuth>} />
            <Route path="/xr-academy" element={<RequireAuth><Suspense fallback={<section className="kev-section">Loading XR Academy...</section>}><XRAcademy /></Suspense></RequireAuth>} />
            <Route path="/agents" element={<RequireAuth><Agents /></RequireAuth>} />
            <Route path="/portal" element={<RequireAuth><Portal /></RequireAuth>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
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

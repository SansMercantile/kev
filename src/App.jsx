import React, { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'
import OfflineBanner from './components/OfflineBanner'

import Landing from './pages/Landing'
import Docs from './pages/Docs'
import Technical from './pages/Technical'
import Categories from './pages/Categories'
import Platform from './pages/Platform'
import Integration from './pages/Integration'
import VirtualSchoolMap from './pages/VirtualSchoolMap'
import VRCampus from './pages/VRCampus'
const ImmersiveLab = lazy(() => import('./pages/ImmersiveLab'))
const XRAcademy = lazy(() => import('./pages/XRAcademy'))
const TeacherStudio = lazy(() => import('./pages/TeacherStudio'))
const Agents = lazy(() => import('./pages/Agents'))
const Curriculum = lazy(() => import('./pages/Curriculum'))
import Portal from './pages/Portal'
import Onboarding from './pages/Onboarding'
import Pricing from './pages/Pricing'
import Billing from './pages/Billing'
import Signup from './pages/Signup'
import Login from './pages/Login'

import { ChevronRightIcon, MenuIcon, XIcon } from './lib/icons.jsx'
import { setAuthToken, setUnauthorizedHandler, getCurriculumSubjects, getAgentsAvailable } from './lib/api'
import { DEV_BYPASS_AUTH, DevAuthBypassBanner } from './lib/devAuthBypass'
import {
  getNativeSession,
  clearNativeSession,
  restoreNativeSession,
  refreshOnUnauthorized,
  useNativeUser,
} from './lib/nativeAuth'
import RoleLogin from './components/RoleLogin'
import { getRole, ROLES } from './lib/roleSession'

function AuthButton() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0()
  const nativeUser = useNativeUser()

  if (isLoading) return null

  if (nativeUser) {
    return (
      <button
        className="kev-btn kev-btn-secondary"
        onClick={() => clearNativeSession()}
        title={nativeUser.email || ''}
      >
        {nativeUser.name || nativeUser.email || t('nav.account')} · {t('nav.signOut')}
      </button>
    )
  }

  if (isAuthenticated) {
    return (
      <button
        className="kev-btn kev-btn-secondary"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        {user?.given_name || user?.name || t('nav.account')} · {t('nav.signOut')}
      </button>
    )
  }

  return (
    <>
      <Link className="kev-btn kev-btn-secondary" to="/login">
        {t('nav.signIn')}
      </Link>
      <Link className="kev-btn kev-btn-primary" to="/signup">
        Create account
      </Link>
    </>
  )
}

/**
 * Role gate, mirroring AppPlatform. The teaching studio is a staff surface:
 * until a visitor chooses the teacher door it shows the role login, and only
 * a teacher session proceeds. Convenience, not the boundary - the platform's
 * RoleGate and the backend re-check independently.
 */
function RoleGate({ roles, children }) {
  const [, setTick] = useState(0)
  const role = getRole()
  if (!role || (roles && !roles.includes(role))) {
    return <RoleLogin onSignedIn={() => setTick((n) => n + 1)} />
  }
  return children
}

// KEV is a work-in-progress product with real costs (Bedrock calls) and
// real data collection (onboarding/KYC) - the interactive/functional
// surface requires sign-in, not just the marketing pages.
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
        <p className="kev-section-copy">
          {t('nav.signInRequiredBody')}
        </p>
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

const App = () => {
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
  // Silent fallback to the neutral plain string when the backend is down.
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

  // Keeps api.js's outgoing Authorization header in sync with the current
  // session. Native (Cognito) sessions win when present; otherwise the Auth0
  // session applies, so protected endpoints (onboarding, agents, vr,
  // library) get a real, verifiable JWT rather than being called anonymously.
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

  const navLinks = [
    { label: t('nav.explore'), to: '/explore' },
    { label: t('nav.platform'), to: '/platform' },
    { label: t('nav.campusMap'), to: '/campus-map' },
    { label: t('nav.vrCampus'), to: '/vr' },
    { label: t('nav.immersiveLab'), to: '/anatomy' },
    { label: t('nav.xrAcademy'), to: '/xr-academy' },
    { label: t('nav.pricing'), to: '/pricing' },
    { label: t('nav.onboarding'), to: '/onboarding' },
    { label: t('nav.docs'), to: '/docs' },
    { label: t('nav.tech'), to: '/tech' },
  ]

  return (
    <Router>
      <div className="kev-app">
        <a className="skip-link" href="#main">{t('nav.skipToContent')}</a>
        <DevAuthBypassBanner />
        <header className={`kev-nav${scrolled ? ' kev-nav-scrolled' : ''}`} role="banner" aria-label="Top header">
          <div className="kev-nav-inner">
            <Link to="/" className="kev-brand">
              <img src="/kev-logo.svg" alt="KEV" className="kev-brand-logo" width={32} height={32} />
              KEV
            </Link>

            <nav id="kev-nav-links" className={`kev-nav-links${menuOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `kev-nav-link${isActive ? ' kev-nav-link-active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="kev-nav-actions">
                <a
                  className="kev-btn kev-btn-primary"
                  href="https://sansmercantile.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('nav.contact')}
                  <ChevronRightIcon style={{ marginLeft: '0.5rem' }} width={18} height={18} aria-hidden="true" />
                </a>
                <LanguageSwitcher compact />
                <AuthButton />
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
            <Route path="/" element={<Landing />} />
            <Route path="/explore" element={<Landing />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/tech" element={<Technical />} />
            <Route path="/technical" element={<Technical />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/campus-map" element={<RequireAuth><VirtualSchoolMap /></RequireAuth>} />
            <Route path="/vr" element={<RequireAuth><VRCampus /></RequireAuth>} />
            <Route path="/anatomy" element={<Suspense fallback={<section className="kev-section">Loading Immersive Lab...</section>}><ImmersiveLab /></Suspense>} />
            <Route path="/xr-academy" element={<RequireAuth><Suspense fallback={<section className="kev-section">Loading XR Academy...</section>}><XRAcademy /></Suspense></RequireAuth>} />
            <Route path="/agents" element={<RequireAuth><Suspense fallback={<section className="kev-section">Loading tutors...</section>}><Agents /></Suspense></RequireAuth>} />
            <Route path="/curriculum" element={<RequireAuth><Suspense fallback={<section className="kev-section">Loading curriculum...</section>}><Curriculum /></Suspense></RequireAuth>} />
            <Route path="/portal" element={<RequireAuth><Portal /></RequireAuth>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
            <Route path="/teacher" element={<RoleGate roles={[ROLES.TEACHER]}><Suspense fallback={<section className="kev-section">Loading teaching studio...</section>}><TeacherStudio /></Suspense></RoleGate>} />
          </Routes>
        </main>

        <footer className="kev-footer">
          <div className="kev-footer-inner">
            <p style={{ fontWeight: 700, color: '#0f172a' }}>KEV</p>
            <p style={{ maxWidth: '740px', color: '#475569' }}>
              {t('nav.footerTagline')}
            </p>
            <p style={{ color: '#68778c', fontSize: '0.95rem' }}>
              {liveCounts ? t('nav.footerRights', liveCounts) : t('nav.footerRightsPlain')}
            </p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App

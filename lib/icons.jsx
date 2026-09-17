import React from 'react'

export const BookOpenIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5V6.75a1.5 1.5 0 0 1 1.5-1.5h4.5a.75.75 0 0 1 .75.75v12.75" />
    <path d="M20 19.5V6.75a1.5 1.5 0 0 0-1.5-1.5h-4.5a.75.75 0 0 0-.75.75v12.75" />
    <path d="M4 6.75l8 3.6 8-3.6" />
  </svg>
)

export const ShieldCheckIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3l7 3.25v5.75c0 5.5-3.75 8.75-7 9.75-3.25-1-7-4.25-7-9.75V6.25L12 3z" />
    <path d="M9.5 12.5l1.75 1.75 3.75-3.75" />
  </svg>
)

export const BrainCircuitIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 7.5a4 4 0 0 1 8 0" />
    <path d="M8 16.5a4 4 0 0 0 8 0" />
    <path d="M12 7.5v9" />
    <path d="M7.5 10.5H6.75a.75.75 0 0 1-.75-.75V7.5" />
    <path d="M16.5 10.5h.75a.75.75 0 0 0 .75-.75V7.5" />
    <path d="M7.5 13.5H6.75a.75.75 0 0 0-.75.75v2.25" />
    <path d="M16.5 13.5h.75a.75.75 0 0 1 .75.75v2.25" />
  </svg>
)

export const GlobeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16" />
    <path d="M12 4a15.3 15.3 0 0 1 0 16" />
    <path d="M12 4a15.3 15.3 0 0 0 0 16" />
  </svg>
)

export const LayoutDashboardIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 5.25h18" />
    <path d="M3 10.5h18" />
    <path d="M3 15.75h18" />
    <path d="M3 21h18" />
  </svg>
)

export const CompassIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="8" />
    <path d="M16 8l-6 2 2 6 6-6z" />
  </svg>
)

export const UsersIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

export const ActivityIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12h4l3-8 4 16 3-8h4" />
  </svg>
)

export const StarIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2.75l2.96 6.57 7.24 1.05-5.24 5.11 1.24 7.23L12 18.6l-6.2 3.26 1.24-7.23-5.24-5.11 7.24-1.05L12 2.75z" />
  </svg>
)

export const CheckIcon = ({ ariaLabel = 'Check', ...props }) => (
  <svg role="img" aria-label={ariaLabel} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path className="check-path" d="M20 6L9 17l-5-5" />
  </svg>
)

export const ChevronRightIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

export const MenuIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
)

export const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
)

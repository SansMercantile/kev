import React, { Suspense, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import XRAcademyApp from '../xr/XRAcademyApp'
import { ToastProvider } from '../xr/components/toast/ToastContext'
import { setXrAuthToken } from '../xr/lib/xrApi'
import '../xr/xr.css'

// Full port of the XR Online School & Virtual Labs demo (src/xr/*).
// Gated behind sign-in like the other functional surfaces (VR Campus,
// Campus Map) because the AI tutor endpoints call Bedrock per request.
export default function XRAcademy() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    if (!isAuthenticated) {
      setXrAuthToken(null)
      return
    }
    let cancelled = false
    getAccessTokenSilently()
      .then((token) => { if (!cancelled) setXrAuthToken(token) })
      .catch(() => { if (!cancelled) setXrAuthToken(null) })
    return () => { cancelled = true }
  }, [isAuthenticated, getAccessTokenSilently])

  return (
    <div className="kev-xr-embed">
      <ToastProvider>
        <Suspense fallback={<section className="kev-section">Loading XR Academy...</section>}>
          <XRAcademyApp />
        </Suspense>
      </ToastProvider>
    </div>
  )
}

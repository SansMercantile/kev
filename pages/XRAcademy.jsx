import React, { Suspense, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import XRAcademyApp from '../xr/XRAcademyApp'
import { ToastProvider } from '../xr/components/toast/ToastContext'
import { setXrAuthToken } from '../xr/lib/xrApi'
import LiveLessonsStrip from '../components/LiveLessonsStrip'
import LiveLessonModal from '../components/LiveLessonModal'
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

  // Live-lesson ribbon over the campus: attending the virtual school is one
  // click from inside the XR world, and the teacher's door into the studio is
  // the same ribbon. Kept here (a .jsx wrapper) because the role UI is
  // deliberately untyped JavaScript, while XRAcademyApp is checked TypeScript.
  const [joinLesson, setJoinLesson] = useState(null)

  return (
    <div className="kev-xr-embed" style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 45,
          width: 'min(780px, 94%)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <LiveLessonsStrip compact onJoinLesson={setJoinLesson} />
        </div>
      </div>
      <ToastProvider>
        <Suspense fallback={<section className="kev-section">Loading XR Academy...</section>}>
          <XRAcademyApp />
        </Suspense>
      </ToastProvider>
      {joinLesson && (
        <LiveLessonModal lesson={joinLesson} onClose={() => setJoinLesson(null)} />
      )}
    </div>
  )
}

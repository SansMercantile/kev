import React, { useEffect, useState } from 'react'

// Global offline banner: visible on every shell route when the browser
// reports no connectivity. Labs, notebook, cached reads, and queued chat
// keep working — see docs/offline.md.
export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null
  return (
    <div
      role="alert"
      style={{
        background: '#451a03',
        color: '#fde68a',
        fontSize: '0.85rem',
        padding: '0.5rem 1rem',
        textAlign: 'center',
        borderBottom: '1px solid #92400e',
      }}
    >
      You&apos;re offline — 3D labs, notebook, and cached content keep working. Messages queue and send on reconnect.
    </div>
  )
}

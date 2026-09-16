/**
 * On-demand loader for the A-Frame runtime.
 *
 * A-Frame was included as a blocking `<script>` in `index.html`, so roughly
 * 1.5 MB of third-party JavaScript was downloaded and parsed before first paint
 * for every visitor — including the ones who never open the VR Campus page,
 * which is the only place in the app that uses it.
 *
 * `VRCampus` already feature-detects `window.AFRAME` and renders a graceful
 * fallback when it is missing, so the script can simply be fetched when that
 * page mounts. The loader is idempotent and shared: concurrent callers get the
 * same promise, a script already in the document is adopted rather than
 * duplicated, and a failed fetch clears the memo so a later visit can retry.
 */

const AFRAME_SRC = 'https://aframe.io/releases/1.5.0/aframe.min.js'

let pending = null

/**
 * Ensure the A-Frame runtime is available.
 *
 * @returns {Promise<boolean>} true when `window.AFRAME` is usable.
 */
export function loadAFrame() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.AFRAME) return Promise.resolve(true)
  if (pending) return pending

  pending = new Promise((resolve) => {
    // Adopt a tag that is already in the document (or in flight) instead of
    // adding a second copy.
    const existing = document.querySelector(`script[src="${AFRAME_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.AFRAME)), { once: true })
      existing.addEventListener('error', () => {
        pending = null
        resolve(false)
      }, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = AFRAME_SRC
    script.async = true
    script.onload = () => resolve(Boolean(window.AFRAME))
    script.onerror = () => {
      // Clear the memo so a retry is possible, then report unavailability —
      // callers render their non-WebXR fallback rather than hanging.
      pending = null
      resolve(false)
    }
    document.head.appendChild(script)
  })

  return pending
}

/** True when the A-Frame runtime has already been loaded. */
export function isAFrameReady() {
  return typeof window !== 'undefined' && Boolean(window.AFRAME)
}

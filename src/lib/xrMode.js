// XR/VR device detection + unified experience mode.
// Returns 'xr' if a VR/AR device is available, 'flat' otherwise.
// Both modes share the same game logic, progression, and vehicles.

import { useEffect, useState } from 'react'

let cachedMode = null

export async function detectXRMode() {
  if (cachedMode) return cachedMode
  if (typeof navigator === 'undefined' || !navigator.xr) {
    cachedMode = 'flat'
    return cachedMode
  }
  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr')
    cachedMode = supported ? 'xr' : 'flat'
  } catch {
    cachedMode = 'flat'
  }
  return cachedMode
}

export function useXRMode() {
  const [mode, setMode] = useState(cachedMode || 'detecting')
  useEffect(() => {
    let cancelled = false
    detectXRMode().then((m) => {
      if (!cancelled) setMode(m)
    })
    return () => { cancelled = true }
  }, [])
  return mode
}

// Input abstraction: keyboard/mouse for flat, controllers for XR.
// Both map to the same control intents (throttle, steer, look, action).
export function usePilotInput(mode) {
  const [input, setInput] = useState({ throttle: 0, steer: 0, look: { yaw: 0, pitch: 0 }, action: false })

  useEffect(() => {
    if (mode === 'flat') {
      // keyboard + mouse
      const keys = {}
      const onKey = (e, down) => {
        keys[e.code] = down
        const throttle = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0)
        const steer = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0)
        setInput((prev) => ({ ...prev, throttle, steer, action: keys['Space'] || false }))
      }
      const onMouseMove = (e) => {
        if (document.pointerLockElement) {
          setInput((prev) => ({
            ...prev,
            look: {
              yaw: prev.look.yaw - e.movementX * 0.002,
              pitch: Math.max(-0.5, Math.min(0.5, prev.look.pitch - e.movementY * 0.002)),
            },
          }))
        }
      }
      window.addEventListener('keydown', (e) => onKey(e, true))
      window.addEventListener('keyup', (e) => onKey(e, false))
      document.addEventListener('mousemove', onMouseMove)
      return () => {
        window.removeEventListener('keydown', (e) => onKey(e, true))
        window.removeEventListener('keyup', (e) => onKey(e, false))
        document.removeEventListener('mousemove', onMouseMove)
      }
    } else if (mode === 'xr') {
      // XR controllers (via A-Frame's tracked-controls or WebXR API)
      const session = navigator.xr && navigator.xr.session
      if (!session) return undefined
      const onSelect = () => setInput((prev) => ({ ...prev, action: true }))
      const onSelectEnd = () => setInput((prev) => ({ ...prev, action: false }))
      session.addEventListener('selectstart', onSelect)
      session.addEventListener('selectend', onSelectEnd)
      // thumbstick input
      const checkGamepad = () => {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : []
        for (const gp of gamepads) {
          if (gp && gp.axes.length >= 4) {
            const steer = gp.axes[2] || 0  // right thumbstick X
            const throttle = -(gp.axes[3] || 0)  // right thumbstick Y (inverted)
            setInput((prev) => ({ ...prev, throttle, steer }))
          }
        }
        requestAnimationFrame(checkGamepad)
      }
      const raf = requestAnimationFrame(checkGamepad)
      return () => {
        session.removeEventListener('selectstart', onSelect)
        session.removeEventListener('selectend', onSelectEnd)
        cancelAnimationFrame(raf)
      }
    }
    return undefined
  }, [mode])

  return input
}

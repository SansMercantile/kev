// Progression system: exam passes unlock hands-on control (pilot mode) for a
// field's flagship vehicle, up to 5 uses per pass. State persists in localStorage.
import React from 'react'

const FIELDS = {
  mechanical: {
    label: 'Mechanical Engineering',
    vehicle: 'car',
    vehicleLabel: 'Car',
    icon: '🔧',
    examTopics: ['engine systems', 'transmission', 'suspension', 'brakes', 'electrical'],
  },
  aerospace: {
    label: 'Aerospace',
    vehicle: 'fighter_jet',
    vehicleLabel: 'Fighter Jet',
    icon: '✈️',
    examTopics: ['aerodynamics', 'propulsion', 'flight controls', 'avionics'],
  },
  maritime: {
    label: 'Maritime',
    vehicle: 'warship',
    vehicleLabel: 'Warship',
    icon: '⚓',
    examTopics: ['hull design', 'propulsion', 'navigation', 'weapon systems'],
  },
  rail: {
    label: 'Rail Engineering',
    vehicle: 'locomotive',
    vehicleLabel: 'Locomotive',
    icon: '🚂',
    examTopics: ['bogies', 'braking', 'traction', 'signalling'],
  },
  military: {
    label: 'Military Systems',
    vehicle: 'tank',
    vehicleLabel: 'Tank',
    icon: '🎖️',
    examTopics: ['armor', 'ballistics', 'targeting', 'mobility'],
  },
  space: {
    label: 'Spaceflight',
    vehicle: 'rocket',
    vehicleLabel: 'Rocket',
    icon: '🚀',
    examTopics: ['orbital mechanics', 'propulsion', 'life support', 'docking'],
  },
}

const STORAGE_KEY = 'kev_progression'

export function getProgression() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveProgression(prog) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prog))
    window.dispatchEvent(new CustomEvent('kev-progression-change'))
  } catch {
    /* storage unavailable */
  }
}

export function useProgression() {
  const [prog, setProg] = React.useState(getProgression)
  React.useEffect(() => {
    const refresh = () => setProg(getProgression())
    window.addEventListener('kev-progression-change', refresh)
    return () => window.removeEventListener('kev-progression-change', refresh)
  }, [])
  return prog
}

export function examPassed(field) {
  const prog = getProgression()
  const state = prog[field] || { examPassed: false, unlocksRemaining: 0 }
  state.examPassed = true
  state.unlocksRemaining = 5
  prog[field] = state
  saveProgression(prog)
  return state
}

export function useUnlock(field) {
  const prog = getProgression()
  const state = prog[field] || { examPassed: false, unlocksRemaining: 0 }
  if (!state.examPassed || state.unlocksRemaining <= 0) return false
  state.unlocksRemaining -= 1
  prog[field] = state
  saveProgression(prog)
  return true
}

export function canPilot(field) {
  const prog = getProgression()
  const state = prog[field] || { examPassed: false, unlocksRemaining: 0 }
  return state.examPassed && state.unlocksRemaining > 0
}

export { FIELDS }

/**
 * useAtlasViewer - shared React glue for the full BodyParts3D atlas engine.
 *
 * Mounts AtlasViewer on a host element, streams progress, and on any load
 * failure falls back to the upgraded representative box catalog
 * (ANATOMY_PARTS) via SubjectViewer - the lightweight viewer KEV shipped
 * before the quality pass, kept as an honest degradation path rather than
 * deleted. Selection from either engine is normalized to
 * { name, description, systemId, partId, source } for the host page.
 */

import { useEffect, useRef, useState } from 'react'
import { AtlasViewer } from './atlasScene'
import { SubjectViewer } from './subjectScenes'
import { ANATOMY_SYSTEMS, ANATOMY_PARTS, anatomyExplanation } from '../anatomySystems'

const FALLBACK_SUBJECT = {
  systems: ANATOMY_SYSTEMS.map((s) => ({ id: s.id, label: s.name, color: s.color })),
  parts: ANATOMY_PARTS,
}

export const ATLAS_DEFAULT_VISIBLE = [
  'cardiac', 'sensory', 'skeletal', 'muscular', 'arterial', 'venous', 'nervous',
  'respiratory', 'digestive', 'urinary', 'lymphatic', 'endocrine', 'reproductive', 'connective',
]

/**
 * @param {React.RefObject<HTMLElement>} hostRef
 * @param {object} opts
 * @param {(sel:{name:string,description:string,systemId:string,partId?:string,source?:string|null})=>void} [opts.onSelectPart]
 * @param {'light'|'dark'} [opts.theme='light']
 * @param {boolean} [opts.enabled=true]
 */
export function useAtlasViewer(hostRef, opts = {}) {
  const { onSelectPart, theme = 'light', enabled = true } = opts
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [atlas, setAtlas] = useState(null)
  const [fallback, setFallback] = useState(false)
  const viewerRef = useRef(null)
  const selectRef = useRef(onSelectPart)
  selectRef.current = onSelectPart

  useEffect(() => {
    const host = hostRef.current
    if (!host || !enabled) return undefined
    setProgress(0)
    setError(null)
    setAtlas(null)
    setFallback(false)

    const partIndex = new Map()
    let constructing = true
    let pendingFallback = null
    let cancelled = false

    const mountFallback = (message) => {
      if (cancelled) return
      const current = viewerRef.current
      viewerRef.current = null
      if (current && current.dispose) current.dispose()
      setFallback(true)
      setError(message)
      try {
        const fb = new SubjectViewer(host, 'anatomy', FALLBACK_SUBJECT, {
          onError: (m) => setError(m),
          onSelect: (systemId, userData) => {
            selectRef.current &&
              selectRef.current({
                name: userData.name,
                description: userData.description,
                systemId,
                source: userData.source || null,
              })
          },
        })
        viewerRef.current = fb
      } catch {
        /* host detached mid-fallback; nothing left to try */
      }
    }

    try {
      const viewer = new AtlasViewer(host, {
        theme,
        systems: ANATOMY_SYSTEMS,
        onProgress: (p) => setProgress(p),
        onAtlas: (data) => {
          data.parts.forEach((p) => partIndex.set(p.id, p))
          setAtlas(data)
        },
        onError: (message) => {
          // Constructor-time failures fire before viewerRef is assigned;
          // defer them so the fallback mounts exactly once, in order.
          if (constructing) pendingFallback = message
          else mountFallback(message)
        },
        onSelect: (partId) => {
          const p = partIndex.get(partId)
          if (!p) return
          selectRef.current &&
            selectRef.current({
              name: p.name,
              description: anatomyExplanation(p.name, p.system),
              systemId: p.system,
              partId: p.id,
              source: null,
            })
        },
      })
      constructing = false
      if (pendingFallback) mountFallback(pendingFallback)
      else viewerRef.current = viewer
    } catch {
      constructing = false
      mountFallback('The 3D viewer could not start on this device.')
    }

    return () => {
      cancelled = true
      const v = viewerRef.current
      viewerRef.current = null
      if (v && v.dispose) v.dispose()
    }
    // theme/enabled changes remount; the host element is stable per page.
  }, [hostRef, theme, enabled])

  /** Route state to whichever engine is live (atlas or fallback). */
  const setState = (partial) => {
    const v = viewerRef.current
    if (!v) return
    if (fallback) {
      // SubjectViewer contract: activeSystem/explode/isolated/selectedName.
      const mapped = {}
      if (partial.activeSystem) mapped.activeSystem = partial.activeSystem
      else if (partial.visible && partial.visible.length === 1) mapped.activeSystem = partial.visible[0]
      if (partial.explode !== undefined) mapped.explode = partial.explode
      if (partial.isolate !== undefined) mapped.isolated = partial.isolate
      if (partial.selectedName !== undefined) mapped.selectedName = partial.selectedName
      if (partial.rotate !== undefined) mapped.autoRotate = partial.rotate
      v.setState(mapped)
      return
    }
    v.setState(partial)
  }

  const reset = () => {
    const v = viewerRef.current
    if (v && v.reset) v.reset()
  }

  return { progress, error, atlas, fallback, setState, reset, viewerRef }
}

import React, { useEffect, useRef, useState } from 'react'

/**
 * The lesson blackboard, in two halves.
 *
 * `BoardCanvas` is the teacher's board: freehand strokes drawn with the
 * pointer, placed note cards, and pinned KEV tools and study materials. Every
 * mark goes to the server (only the owning teacher's writes are accepted) so
 * the students' view is the same board, not a copy.
 *
 * `BoardView` is what everyone else sees: the same items, read-only. Breaking
 * a concept down means the teacher can layer a tool demonstration over their
 * own drawing - place a molecular viewer stroke-by-stroke, then pin the
 * physics playground next to it.
 */

const STROKE_COLORS = ['#e2e8f0', '#fbbf24', '#38bdf8', '#f472b6', '#4ade80']

export function BoardView({ items = [], onLaunchTool }) {
  const strokes = items.filter((i) => i.kind === 'stroke')
  const others = items.filter((i) => i.kind !== 'stroke')

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <div
        style={{
          position: 'relative',
          background: '#0f172a',
          borderRadius: '0.75rem',
          border: '1px solid #334155',
          minHeight: 260,
          overflow: 'hidden',
        }}
      >
        <svg viewBox="0 0 1000 560" style={{ width: '100%', height: '100%', display: 'block' }} aria-label="Lesson blackboard">
          {strokes.map((s) => {
            const pts = (s.payload && s.payload.points) || []
            if (pts.length < 2) return null
            const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
            return (
              <path
                key={s.id}
                d={d}
                fill="none"
                stroke={(s.payload && s.payload.color) || '#e2e8f0'}
                strokeWidth={(s.payload && s.payload.width) || 4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })}
        </svg>
        {items.length === 0 && (
          <p style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#64748b', margin: 0 }}>
            The board is empty.
          </p>
        )}
      </div>

      {others.length > 0 && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {others.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #c9a227',
                borderRadius: '0.5rem',
                padding: '0.6rem 0.8rem',
                background: '#fffdf8',
              }}
            >
              {item.kind === 'note' && <span style={{ color: '#0f172a' }}>{(item.payload || {}).text}</span>}
              {item.kind === 'tool' && (
                <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#0e7490' }}>Tool: {(item.payload || {}).label || (item.payload || {}).toolId}</strong>
                  {onLaunchTool && (
                    <button
                      type="button"
                      onClick={() => onLaunchTool(item.payload || {})}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #0e7490', background: 'transparent', color: '#0e7490', cursor: 'pointer' }}
                    >
                      Open demonstration
                    </button>
                  )}
                </span>
              )}
              {item.kind === 'material' && (
                <span style={{ display: 'grid', gap: '0.2rem' }}>
                  <strong style={{ color: '#8a3324' }}>Material: {(item.payload || {}).title}</strong>
                  <small style={{ color: '#475569' }}>{(item.payload || {}).summary}</small>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function BoardCanvas({ onStroke, onUndo, onClear }) {
  const svgRef = useRef(null)
  const [drawing, setDrawing] = useState(null)
  const [color, setColor] = useState(STROKE_COLORS[0])

  const toPoint = (event) => {
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 1000
    const y = ((event.clientY - rect.top) / rect.height) * 560
    return [Math.round(x), Math.round(y)]
  }

  const start = (event) => {
    event.preventDefault()
    setDrawing({ points: [toPoint(event)], color })
  }
  const move = (event) => {
    if (!drawing) return
    setDrawing({ ...drawing, points: [...drawing.points, toPoint(event)] })
  }
  const end = () => {
    if (drawing && drawing.points.length > 1) onStroke(drawing)
    setDrawing(null)
  }

  useEffect(() => {
    const up = () => end()
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  })

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div
        style={{
          background: '#0f172a',
          borderRadius: '0.75rem',
          border: '1px solid #334155',
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1000 560"
          style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          aria-label="Blackboard drawing surface"
        >
          {drawing && drawing.points.length > 1 && (
            <path
              d={drawing.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')}
              fill="none"
              stroke={drawing.color}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {STROKE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Chalk colour ${c}`}
            onClick={() => setColor(c)}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: c,
              border: color === c ? '3px solid #0e7490' : '2px solid transparent',
              cursor: 'pointer',
            }}
          />
        ))}
        <button type="button" className="kev-btn kev-btn-secondary" style={{ color: '#334155', borderColor: '#cbd5e1', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={onUndo}>
          Undo last
        </button>
        <button type="button" className="kev-btn kev-btn-secondary" style={{ color: '#b91c1c', borderColor: '#fca5a5', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={onClear}>
          Erase board
        </button>
        <small style={{ color: '#64748b' }}>Draw with pointer or finger; students see it live.</small>
      </div>
    </div>
  )
}

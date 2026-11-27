/**
 * Life Science — Fantastic Voyage style. Students shrink to microscopic size
 * and travel through the human body, diagnosing and treating a patient. Story
 * quests: identify a disease, navigate to the affected organ, apply treatment.
 *
 * Route: /life-science?case=pneumonia
 */
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerTap } from '../lib/pointerTap'
import '../styles/planets.css'

const CASES = {
  pneumonia: {
    label: 'Pneumonia',
    organ: 'respiratory',
    symptoms: ['cough', 'fever', 'chest pain', 'difficulty breathing'],
    treatment: 'antibiotics',
    story: 'A patient has a bacterial infection in the lungs. Navigate to the respiratory system and apply antibiotics.',
  },
  appendicitis: {
    label: 'Appendicitis',
    organ: 'digestive',
    symptoms: ['abdominal pain', 'nausea', 'fever', 'loss of appetite'],
    treatment: 'surgery',
    story: 'The patient\'s appendix is inflamed. Navigate to the digestive system and prepare for surgical removal.',
  },
  anemia: {
    label: 'Anemia',
    organ: 'cardiovascular',
    symptoms: ['fatigue', 'pale skin', 'shortness of breath', 'dizziness'],
    treatment: 'iron supplements',
    story: 'The patient has low red blood cell count. Navigate to the cardiovascular system and boost iron levels.',
  },
}

const ORGANS = [
  { id: 'heart', name: 'Heart', system: 'cardiovascular', position: [0, 2, 0], color: 0xb96760 },
  { id: 'lungs', name: 'Lungs', system: 'respiratory', position: [-1, 2.5, 0], color: 0xb98991 },
  { id: 'liver', name: 'Liver', system: 'digestive', position: [1, 1.5, 0], color: 0xb8916b },
  { id: 'stomach', name: 'Stomach', system: 'digestive', position: [0.5, 1, 0], color: 0xb8916b },
  { id: 'intestines', name: 'Intestines', system: 'digestive', position: [0, 0.5, 0], color: 0xb8916b },
  { id: 'brain', name: 'Brain', system: 'nervous', position: [0, 4, 0], color: 0xd8b565 },
  { id: 'kidneys', name: 'Kidneys', system: 'urinary', position: [-0.5, 1.5, -1], color: 0xb47961 },
]

export default function LifeScience() {
  const hostRef = useRef(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const caseId = CASES[searchParams.get('case')] ? searchParams.get('case') : 'pneumonia'
  const caseData = CASES[caseId]

  const [stage, setStage] = useState('briefing')  // briefing | navigate | diagnose | treat | complete
  const [message, setMessage] = useState(caseData.story)
  const [selectedOrgan, setSelectedOrgan] = useState(null)
  const [treatmentApplied, setTreatmentApplied] = useState(false)

  const stateRef = useRef({ stage, selectedOrgan, caseData })
  useEffect(() => { stateRef.current = { stage, selectedOrgan, caseData } }, [stage, selectedOrgan, caseData])

  useEffect(() => {
    if (stage !== 'navigate') return undefined
    const el = hostRef.current
    if (!el) return undefined
    const renderer = new T.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping
    el.appendChild(renderer.domElement)

    const scene = new T.Scene()
    scene.background = new T.Color('#1a0a0a')
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(5, 5, 10)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.target.set(0, 2, 0)
    controls.maxDistance = 30

    // body cavity (semi-transparent shell)
    const body = new T.Mesh(
      new T.SphereGeometry(5, 32, 24),
      new T.MeshStandardMaterial({ color: 0x8a4a3a, transparent: true, opacity: 0.2, side: T.DoubleSide })
    )
    body.scale.set(1, 1.5, 0.7)
    body.position.y = 2
    scene.add(body)

    // organs
    const organMeshes = []
    ORGANS.forEach((org) => {
      const mesh = new T.Mesh(
        new T.SphereGeometry(0.4, 16, 12),
        new T.MeshStandardMaterial({ color: org.color, roughness: 0.7 })
      )
      mesh.position.set(...org.position)
      mesh.userData.organId = org.id
      mesh.userData.system = org.system
      mesh.userData.name = org.name
      scene.add(mesh)
      organMeshes.push(mesh)
    })

    // blood vessels (tubes connecting organs)
    const vesselMat = new T.MeshStandardMaterial({ color: 0xc05245, transparent: true, opacity: 0.6 })
    ORGANS.forEach((org, i) => {
      if (i < ORGANS.length - 1) {
        const next = ORGANS[i + 1]
        const tube = new T.Mesh(
          new T.CylinderGeometry(0.05, 0.05, 2, 8),
          vesselMat
        )
        tube.position.set(
          (org.position[0] + next.position[0]) / 2,
          (org.position[1] + next.position[1]) / 2,
          (org.position[2] + next.position[2]) / 2
        )
        tube.lookAt(new T.Vector3(...next.position))
        tube.rotateX(Math.PI / 2)
        scene.add(tube)
      }
    })

    scene.add(new T.AmbientLight(0xffffff, 0.5))
    const key = new T.DirectionalLight(0xffd8a8, 1.0)
    key.position.set(5, 10, 5)
    scene.add(key)

    // picking
    const raycaster = new T.Raycaster()
    const pointer = new T.Vector2()
    const tap = new PointerTap()
    const down = (e) => tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5)
    const move = (e) => tap.move(e.pointerId, e.clientX, e.clientY)
    const up = (e) => {
      if (!tap.up(e.pointerId, e.clientX, e.clientY)) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(organMeshes, false)
      if (hits[0]) {
        const orgId = hits[0].object.userData.organId
        const system = hits[0].object.userData.system
        const name = hits[0].object.userData.name
        const s = stateRef.current
        setSelectedOrgan({ id: orgId, system, name })
        if (s.stage === 'navigate') {
          if (system === s.caseData.organ) {
            setMessage(`✓ You reached the ${name}. This is where the problem is. Proceed to diagnosis.`)
          } else {
            setMessage(`This is the ${name}. The problem is in the ${s.caseData.organ.replace(/_/g, ' ')} system. Keep looking.`)
          }
        } else if (s.stage === 'diagnose') {
          if (system === s.caseData.organ) {
            setMessage(`✓ Confirmed: ${s.caseData.label} in the ${name}. Apply treatment: ${s.caseData.treatment}.`)
          } else {
            setMessage(`No, the problem isn't here. Check the ${s.caseData.organ.replace(/_/g, ' ')} system.`)
          }
        }
      }
    }
    renderer.domElement.addEventListener('pointerdown', down)
    renderer.domElement.addEventListener('pointermove', move)
    renderer.domElement.addEventListener('pointerup', up)

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    const clock = new T.Clock()
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      // pulse the target organ
      organMeshes.forEach((mesh) => {
        if (mesh.userData.system === stateRef.current.caseData.organ) {
          mesh.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.1)
        }
      })
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [stage, caseData])

  return (
    <div className="planet-page">
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Life Science — {caseData.label}</span>
          <h1>Fantastic Voyage</h1>
          <span className="planet-sub">{caseData.story}</span>
        </div>
        <div className="body-selector">
          {Object.entries(CASES).map(([id, c]) => (
            <button key={id} type="button"
              className={caseId === id ? 'body-btn active' : 'body-btn'}
              onClick={() => { setStage('briefing'); setSelectedOrgan(null); setTreatmentApplied(false); window.location.search = `?case=${id}` }}>
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {stage === 'briefing' && (
        <div className="story-panel">
          <h2>Patient briefing</h2>
          <div className="symptoms">
            <h3>Symptoms:</h3>
            <ul>
              {caseData.symptoms.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <p>{caseData.story}</p>
          <button className="kev-btn kev-btn-primary" onClick={() => setStage('navigate')}>
            Begin procedure
          </button>
        </div>
      )}

      {stage === 'navigate' && (
        <>
          <div className="planet-stage" ref={hostRef} />
          <footer className="garage-status">
            <div className="status-message">{message}</div>
            {selectedOrgan && selectedOrgan.system === caseData.organ && (
              <button className="kev-btn kev-btn-primary" onClick={() => setStage('diagnose')}>
                Proceed to diagnosis
              </button>
            )}
          </footer>
        </>
      )}

      {stage === 'diagnose' && (
        <div className="story-panel">
          <h2>Diagnosis: {caseData.label}</h2>
          <p>The patient has {caseData.label} in the {caseData.organ.replace(/_/g, ' ')} system. Apply the correct treatment.</p>
          <div className="treatment-options">
            <button className="kev-btn kev-btn-primary" onClick={() => { setTreatmentApplied(true); setStage('treat') }}>
              Apply {caseData.treatment}
            </button>
            <button className="kev-btn kev-btn-secondary" onClick={() => setStage('navigate')}>
              Back to navigation
            </button>
          </div>
        </div>
      )}

      {stage === 'treat' && (
        <div className="story-panel">
          <h2>✓ Treatment applied</h2>
          <p>The {caseData.treatment} is working. The patient is recovering from {caseData.label}.</p>
          <button className="kev-btn kev-btn-primary" onClick={() => setStage('complete')}>
            Complete case
          </button>
        </div>
      )}

      {stage === 'complete' && (
        <div className="story-panel">
          <h2>✓ Case complete: {caseData.label}</h2>
          <p>You successfully diagnosed and treated {caseData.label}. The patient has made a full recovery.</p>
          <div className="case-actions">
            <button className="kev-btn kev-btn-primary" onClick={() => navigate('/anatomy')}>
              Explore the anatomy atlas
            </button>
            <button className="kev-btn kev-btn-secondary" onClick={() => { setStage('briefing'); setSelectedOrgan(null); setTreatmentApplied(false) }}>
              New case
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

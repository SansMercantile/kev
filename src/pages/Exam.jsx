/**
 * Exam system — per-field quizzes. Pass a field's exam to unlock hands-on
 * control of its flagship vehicle (pilot mode), up to 5 uses per pass.
 *
 * Route: /exam?field=mechanical
 */
import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FIELDS, examPassed, canPilot, useProgression } from '../lib/progression'
import '../styles/planets.css'

const QUESTIONS = {
  mechanical: [
    { q: 'What component connects the engine to the wheels?', a: ['Transmission', 'Radiator', 'Alternator', 'Exhaust'], correct: 0 },
    { q: 'What does the suspension system absorb?', a: ['Road shocks', 'Fuel vapors', 'Heat', 'Noise'], correct: 0 },
    { q: 'Which part stops the car by friction?', a: ['Brake pads', 'Spark plugs', 'Pistons', 'Gears'], correct: 0 },
    { q: 'What charges the battery while the engine runs?', a: ['Alternator', 'Starter', 'Fuel pump', 'Radiator'], correct: 0 },
    { q: 'What ignites the fuel-air mixture in a gasoline engine?', a: ['Spark plug', 'Injector', 'Carburetor', 'Turbocharger'], correct: 0 },
  ],
  aerospace: [
    { q: 'What force opposes gravity in flight?', a: ['Lift', 'Thrust', 'Drag', 'Weight'], correct: 0 },
    { q: 'What controls pitch on an aircraft?', a: ['Elevators', 'Ailerons', 'Rudder', 'Flaps'], correct: 0 },
    { q: 'What produces thrust in a jet engine?', a: ['Expelling exhaust gases', 'Spinning propeller', 'Compressing air', 'Burning fuel'], correct: 0 },
    { q: 'What is the wing\'s curved upper surface called?', a: ['Airfoil', 'Fuselage', 'Empennage', 'Nacelle'], correct: 0 },
  ],
  maritime: [
    { q: 'What part of a ship keeps it stable in water?', a: ['Hull', 'Mast', 'Rudder', 'Anchor'], correct: 0 },
    { q: 'What steers a ship?', a: ['Rudder', 'Propeller', 'Keel', 'Bow'], correct: 0 },
    { q: 'What measures a ship\'s speed through water?', a: ['Knot meter', 'Barometer', 'Compass', 'Sextant'], correct: 0 },
  ],
  rail: [
    { q: 'What guides a train along the track?', a: ['Flanged wheels', 'Rubber tires', 'Magnetic brakes', 'Pantograph'], correct: 0 },
    { q: 'What connects rail cars together?', a: ['Coupler', 'Bogie', 'Buffer', 'Chassis'], correct: 0 },
    { q: 'What powers an electric train?', a: ['Pantograph', 'Diesel engine', 'Steam boiler', 'Battery'], correct: 0 },
  ],
  military: [
    { q: 'What protects a tank\'s crew?', a: ['Composite armor', 'Rubber tracks', 'Camouflage', 'Smoke grenades'], correct: 0 },
    { q: 'What stabilizes a tank\'s gun while moving?', a: ['Gyroscopic stabilizer', 'Shock absorbers', 'Recoil spring', 'Counterweight'], correct: 0 },
  ],
  space: [
    { q: 'What pushes a rocket forward?', a: ['Expelling exhaust at high speed', 'Air resistance', 'Solar wind', 'Gravity'], correct: 0 },
    { q: 'What keeps astronauts alive in space?', a: ['Life support system', 'Solar panels', 'Heat shield', 'Parachute'], correct: 0 },
    { q: 'What is the speed needed to orbit Earth?', a: ['~7.8 km/s', '~3.0 km/s', '~11.2 km/s', '~1.5 km/s'], correct: 0 },
  ],
}

export default function Exam() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fieldId = FIELDS[searchParams.get('field')] ? searchParams.get('field') : 'mechanical'
  const field = FIELDS[fieldId]
  const prog = useProgression()
  const fieldState = prog[fieldId] || { examPassed: false, unlocksRemaining: 0 }

  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)

  const questions = QUESTIONS[fieldId] || QUESTIONS.mechanical
  const total = questions.length
  const passThreshold = Math.ceil(total * 0.7)

  const select = (qi, ai) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qi]: ai }))
  }

  const submit = () => {
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++
    })
    setScore(correct)
    setSubmitted(true)
    if (correct >= passThreshold) {
      setPassed(true)
      examPassed(fieldId)
    }
  }

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setPassed(false)
  }

  return (
    <div className="planet-page" style={{ overflow: 'auto' }}>
      <header className="planet-header">
        <div className="planet-title">
          <span className="planet-kicker">Exam — {field.label}</span>
          <h1>{field.icon} {field.label} Certification</h1>
          <span className="planet-sub">
            {fieldState.examPassed
              ? `✓ Certified — ${fieldState.unlocksRemaining} pilot ${fieldState.unlocksRemaining === 1 ? 'use' : 'uses'} remaining`
              : `Pass ${passThreshold}/${total} to unlock pilot mode for the ${field.vehicleLabel}`}
          </span>
        </div>
      </header>

      <div className="exam-body">
        {!fieldState.examPassed && !submitted && (
          <>
            <div className="exam-instructions">
              <p>Answer all {total} questions. Score {passThreshold}/{total} or better to earn your {field.label} certification and unlock hands-on control of the {field.vehicleLabel}.</p>
            </div>
            <div className="exam-questions">
              {questions.map((q, qi) => (
                <div key={qi} className="exam-question">
                  <h3>{qi + 1}. {q.q}</h3>
                  <div className="exam-options">
                    {q.a.map((opt, ai) => (
                      <button key={ai} type="button"
                        className={`exam-option ${answers[qi] === ai ? 'selected' : ''}`}
                        onClick={() => select(qi, ai)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="kev-btn kev-btn-primary exam-submit" type="button" onClick={submit}
              disabled={Object.keys(answers).length < total}>
              Submit answers
            </button>
          </>
        )}

        {fieldState.examPassed && !submitted && (
          <div className="exam-passed">
            <h2>✓ Already certified</h2>
            <p>You have {fieldState.unlocksRemaining} pilot {fieldState.unlocksRemaining === 1 ? 'use' : 'uses'} remaining for the {field.vehicleLabel}.</p>
            <button className="kev-btn kev-btn-primary" onClick={() => navigate(`/pilot?vehicle=${field.vehicle}`)}>
              Pilot the {field.vehicleLabel}
            </button>
            <button className="kev-btn kev-btn-secondary" onClick={reset}>Retake exam</button>
          </div>
        )}

        {submitted && (
          <div className={`exam-result ${passed ? 'passed' : 'failed'}`}>
            <h2>{passed ? '✓ Passed!' : '✗ Not yet'}</h2>
            <p>You scored {score}/{total}. {passed ? `You earned your ${field.label} certification and 5 pilot uses for the ${field.vehicleLabel}.` : `You need ${passThreshold}/${total} to pass.`}</p>
            {passed && (
              <button className="kev-btn kev-btn-primary" onClick={() => navigate(`/pilot?vehicle=${field.vehicle}`)}>
                Pilot the {field.vehicleLabel}
              </button>
            )}
            <button className="kev-btn kev-btn-secondary" onClick={reset}>Try again</button>
          </div>
        )}

        {!submitted && (
          <div className="exam-questions">
            {questions.map((q, qi) => (
              <div key={qi} className="exam-question">
                <h3>{qi + 1}. {q.q}</h3>
                <div className="exam-options">
                  {q.a.map((opt, ai) => (
                    <button key={ai} type="button"
                      className={`exam-option ${answers[qi] === ai ? 'selected' : ''}`}
                      onClick={() => select(qi, ai)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="kev-btn kev-btn-primary exam-submit" onClick={submit}
              disabled={Object.keys(answers).length < total}>
              Submit exam
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHealth, getSystemStatus, getCurriculumSubjects, getAgentsAvailable } from '../lib/api'
import { xrClient } from '../lib/xrClient'

// Platform home: live operations view over the real backend (all calls go
// through lib/api.js -> same-origin /api in prod, VITE_API_BASE_URL locally).
export default function Dashboard() {
  const { t } = useTranslation()
  const [health, setHealth] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [agentCount, setAgentCount] = useState(null)
  const [xr, setXr] = useState({ floors: 0, tutors: 0, tracks: 0, levels: 0, liveFacilities: 0 })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadDashboardData = async () => {
      try {
        const [healthData, statusData, subjectsData, agentsData] = await Promise.all([
          getHealth(),
          getSystemStatus(),
          getCurriculumSubjects(),
          getAgentsAvailable(),
        ])
        // XR snapshot is best-effort (separate surface, same backend).
        let xrSnapshot = { floors: 0, tutors: 0, tracks: 0, levels: 0, liveFacilities: 0 }
        try {
          const [floors, tutors, tracks, levels, live] = await Promise.all([
            xrClient.floors(),
            xrClient.tutors(),
            xrClient.tracks(),
            xrClient.levels(),
            xrClient.liveFacilities(),
          ])
          xrSnapshot = {
            floors: floors.floors?.length || 0,
            tutors: tutors.tutors?.length || 0,
            tracks: tracks.tracks?.length || 0,
            levels: levels.levels?.length || 0,
            liveFacilities: live.facilities?.length || 0,
          }
        } catch {
          /* XR snapshot stays zeroed when unreachable */
        }
        if (cancelled) return
        setHealth(healthData)
        setSystemStatus(statusData.status === 'success' ? statusData : statusData)
        setSubjects(subjectsData.subjects || [])
        setAgentCount(agentsData.agents?.length ?? null)
        setXr(xrSnapshot)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const system = systemStatus?.system || {}
  const virtualSchool = systemStatus?.virtual_school || {}

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2">KEV Learning Dashboard</h1>
      <p className="text-gray-600 mb-8">Live operations view — every number below comes from the backend.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Service Status</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {health ? health.status : 'Loading...'}
          </p>
          <p className="text-xs text-gray-400 mt-2">API v{health?.version || 'unknown'}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Tutor Agents</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {agentCount ?? system.total_agents ?? '—'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {system.available_agents || 0} available · capacity {system.system_capacity || '—'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Active Sessions</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {system.active_sessions || 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {system.occupancy_rate?.toFixed(1) || 0}% capacity
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Subjects</h3>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {subjects.length}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            in the live curriculum engine
          </p>
        </div>
      </div>

      {/* Agent Roles Breakdown */}
      {system.agent_roles && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Agent Roles</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(system.agent_roles).map(([role, count]) => (
              <div key={role} className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 capitalize">{role}</p>
                <p className="text-2xl font-bold text-blue-600">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XR Academy snapshot */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">XR Academy Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ['Campus floors', xr.floors],
            ['XR tutors', xr.tutors],
            ['Lab tracks', xr.tracks],
            ['Study levels', xr.levels],
            ['Live facilities', xr.liveFacilities],
          ].map(([label, value]) => (
            <div key={label} className="p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">{label}</p>
              <p className="text-2xl font-bold text-indigo-600">{loading && value === 0 ? '…' : value}</p>
            </div>
          ))}
        </div>
        <a href="/xr-academy" className="text-sm text-blue-600 mt-4 inline-block">Open the XR Academy →</a>
      </div>

      {/* Curriculum Subjects */}
      {subjects.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Curriculum Subjects ({subjects.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.slice(0, 9).map((subject) => (
              <div key={subject.id} className="p-4 border rounded hover:bg-blue-50 transition">
                <h3 className="font-semibold text-sm">{subject.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{subject.description}</p>
                {subject.dependencies?.length > 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    Prerequisites: {subject.dependencies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
          {subjects.length > 9 && (
            <p className="text-sm text-gray-500 mt-4">
              ... and {subjects.length - 9} more — see the full <a href="/curriculum" className="text-blue-600">Curriculum</a>.
            </p>
          )}
        </div>
      )}

      {/* Continue learning */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Continue learning</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a href="/xr-academy" className="p-4 border rounded hover:bg-blue-50 transition">
            <h3 className="font-semibold text-sm">{t('nav.xrAcademy')}</h3>
            <p className="text-xs text-gray-600 mt-1">3D labs, campus, tutors & missions</p>
          </a>
          <a href="/anatomy" className="p-4 border rounded hover:bg-blue-50 transition">
            <h3 className="font-semibold text-sm">{t('nav.immersiveLab')}</h3>
            <p className="text-xs text-gray-600 mt-1">Anatomy, vehicle, earth & plant systems</p>
          </a>
          <a href="/campus-map" className="p-4 border rounded hover:bg-blue-50 transition">
            <h3 className="font-semibold text-sm">{t('nav.campusMap')}</h3>
            <p className="text-xs text-gray-600 mt-1">Book live facilities</p>
          </a>
          <a href="/curriculum" className="p-4 border rounded hover:bg-blue-50 transition">
            <h3 className="font-semibold text-sm">{t('nav.curriculum')}</h3>
            <p className="text-xs text-gray-600 mt-1">Recommendations & tracks</p>
          </a>
        </div>
      </div>

      {/* Shared Resources Status */}
      {systemStatus?.shared_resources && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Shared Resources</h2>
          <div className="space-y-3">
            {Object.entries(systemStatus.shared_resources).map(([resource, status]) => (
              <div key={resource} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium capitalize">{resource.replace(/_/g, ' ')}</span>
                <span className={`text-xs font-semibold px-3 py-1 rounded ${
                  status.status === 'mock' ? 'bg-yellow-100 text-yellow-800' :
                  status.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {status.status || 'unknown'}
                </span>
              </div>
            ))}
          </div>
          {virtualSchool.total_facilities !== undefined && (
            <p className="text-sm text-gray-500 mt-4">
              Virtual school: {virtualSchool.total_facilities} facilities · {virtualSchool.available_facilities} available
            </p>
          )}
        </div>
      )}

      {/* Full Status JSON */}
      <details className="bg-white p-6 rounded-lg shadow">
        <summary className="text-xl font-semibold cursor-pointer">Full System Status (raw)</summary>
        {loading ? (
          <p className="text-gray-600 mt-4">Loading...</p>
        ) : (
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96 mt-4">
            {JSON.stringify({ health, systemStatus, subjectCount: subjects.length, agentCount }, null, 2)}
          </pre>
        )}
      </details>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { getHealth } from '../lib/api'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function Dashboard() {
  const [health, setHealth] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [agents, setAgents] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch health
        const healthData = await getHealth()
        setHealth(healthData)
        
        // Fetch system status
        const systemRes = await fetch(`${API_BASE}/system/status`)
        if (systemRes.ok) {
          const systemData = await systemRes.json()
          setSystemStatus(systemData.status || systemData)
        }
        
        // Fetch available subjects
        const subjectsRes = await fetch(`${API_BASE}/curriculum/subjects`)
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json()
          setSubjects(subjectsData.subjects || [])
        }
        
        // Fetch available agents
        const agentsRes = await fetch(`${API_BASE}/agents/available`)
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setAgents(agentsData)
        }
        
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2">KEV Learning Dashboard</h1>
      <p className="text-gray-600 mb-8">Educational system with Central Library and Curriculum Framework for 185+ subjects</p>
      
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
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total Agents</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {systemStatus?.total_agents || '—'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {systemStatus?.available_agents || 0} available
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Active Sessions</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {systemStatus?.active_sessions || 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {systemStatus?.occupancy_rate?.toFixed(1) || 0}% capacity
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Subjects</h3>
          <p className="text-2xl font-bold text-orange-600 mt-2">
            {subjects.length}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {systemStatus?.subjects_covered || 0} categories
          </p>
        </div>
      </div>

      {/* Agent Roles Breakdown */}
      {systemStatus?.agent_roles && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Agent Roles</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(systemStatus.agent_roles).map(([role, count]) => (
              <div key={role} className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 capitalize">{role}</p>
                <p className="text-2xl font-bold text-blue-600">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curriculum Subjects */}
      {subjects.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Subjects ({subjects.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.slice(0, 9).map((subject) => (
              <div key={subject.id} className="p-4 border rounded hover:bg-blue-50 cursor-pointer transition">
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
              ... and {subjects.length - 9} more subjects available
            </p>
          )}
        </div>
      )}

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
        </div>
      )}

      {/* Full Status JSON */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Full System Status</h2>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify({ health, systemStatus, subjectCount: subjects.length, agents }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

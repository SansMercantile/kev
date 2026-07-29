import React, { useEffect, useState } from 'react'
import { getVirtualSchoolFacilities, getVirtualSchoolOverview } from '../lib/api'

export default function VirtualSchoolMap() {
  const [overview, setOverview] = useState(null)
  const [facilitiesByLevel, setFacilitiesByLevel] = useState({})
  const [selectedLevel, setSelectedLevel] = useState('ground')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const BuildingLevel = {
    basement: 'Basement',
    ground: 'Ground Floor',
    first: 'First Floor',
    second: 'Second Floor',
    third: 'Third Floor',
    roof: 'Roof',
  }

  const levelOrder = ['basement', 'ground', 'first', 'second', 'third', 'roof']

  const levelColors = {
    basement: '#1e293b',
    ground: '#0f172a',
    first: '#1e40af',
    second: '#7c3aed',
    third: '#dc2626',
    roof: '#16a34a',
  }

  const facilityTypeColors = {
    classroom: '#3b82f6',
    lecture_hall: '#8b5cf6',
    laboratory: '#ec4899',
    library: '#f59e0b',
    gymnasium: '#10b981',
    music_room: '#06b6d4',
    art_studio: '#f97316',
    computer_lab: '#6366f1',
    cafeteria: '#84cc16',
    office: '#6b7280',
    common_area: '#0ea5e9',
    auditorium: '#d946ef',
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [overviewResult, facilitiesResult] = await Promise.all([
          getVirtualSchoolOverview(),
          getVirtualSchoolFacilities(),
        ])

        setOverview(overviewResult.virtual_school)

        // Group facilities by level
        const grouped = {}
        levelOrder.forEach((level) => {
          grouped[level] = []
        })

        if (facilitiesResult.facilities) {
          facilitiesResult.facilities.forEach((facility) => {
            const level = facility.level
            if (!grouped[level]) {
              grouped[level] = []
            }
            grouped[level].push(facility)
          })
        }

        setFacilitiesByLevel(grouped)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const currentLevelFacilities = facilitiesByLevel[selectedLevel] || []
  const availableCount = currentLevelFacilities.filter((f) => !f.is_booked).length
  const bookedCount = currentLevelFacilities.filter((f) => f.is_booked).length

  return (
    <main className="kev-section">
      <section className="kev-section" aria-label="Virtual School Map">
        <h2 className="kev-section-title">Virtual School Map</h2>
        <p className="kev-section-copy">
          Interactive 3D campus map showing building levels, facility locations, and real-time availability.
        </p>

        {loading && <p>Loading virtual school map...</p>}
        {error && <p style={{ color: '#dc2626' }}>Error: {error}</p>}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2rem' }}>
            {/* Level Selector */}
            <div className="kev-card" style={{ height: 'fit-content' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Building Levels</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {levelOrder.map((level) => {
                  const count = facilitiesByLevel[level]?.length || 0
                  const isSelected = level === selectedLevel
                  return (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: isSelected ? '#dbeafe' : '#ffffff',
                        color: isSelected ? '#0c4a6e' : '#475569',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: isSelected ? '600' : '500',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{BuildingLevel[level]}</span>
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>({count})</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>{BuildingLevel[selectedLevel]}</h4>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div>
                    <strong>Total Rooms:</strong> {currentLevelFacilities.length}
                  </div>
                  <div style={{ color: '#10b981' }}>
                    <strong>Available:</strong> {availableCount}
                  </div>
                  <div style={{ color: '#dc2626' }}>
                    <strong>Booked:</strong> {bookedCount}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Occupancy: {currentLevelFacilities.length > 0 ? Math.round((bookedCount / currentLevelFacilities.length) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Floor Layout */}
            <div className="kev-card">
              <h3 style={{ margin: '0 0 1rem 0' }}>Floor Layout: {BuildingLevel[selectedLevel]}</h3>

              {currentLevelFacilities.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Grid visualization */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: '#f1f5f9',
                      borderRadius: '0.75rem',
                      border: `2px solid ${levelColors[selectedLevel]}`,
                    }}
                  >
                    {currentLevelFacilities.map((facility) => (
                      <div
                        key={facility.id}
                        style={{
                          padding: '0.75rem',
                          background: facility.is_booked ? '#fee2e2' : '#dbeafe',
                          border: `2px solid ${facilityTypeColors[facility.facility_type] || '#cbd5e1'}`,
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                        }}
                        title={`${facility.name} - ${facility.is_booked ? 'Booked' : 'Available'}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                          {facility.name.split(' ')[0]}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#64748b',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Cap: {facility.capacity}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: facility.is_booked ? '#dc2626' : '#16a34a',
                          }}
                        >
                          {facility.is_booked ? '🔒 Booked' : '✓ Available'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed facility list */}
                  <div>
                    <h4 style={{ margin: '1rem 0 0.75rem 0', fontSize: '0.95rem' }}>Facilities List</h4>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {currentLevelFacilities.map((facility) => (
                        <div
                          key={facility.id}
                          style={{
                            padding: '0.75rem',
                            background: facility.is_booked ? '#fef2f2' : '#f0fdf4',
                            borderLeft: `4px solid ${facilityTypeColors[facility.facility_type] || '#cbd5e1'}`,
                            borderRadius: '0.25rem',
                            fontSize: '0.9rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <strong>{facility.name}</strong>
                              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {facility.facility_type.replace(/_/g, ' ')} • Capacity: {facility.capacity}
                              </div>
                              {facility.equipment && facility.equipment.length > 0 && (
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  Equipment: {facility.equipment.join(', ')}
                                </div>
                              )}
                            </div>
                            <span
                              style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                background: facility.is_booked ? '#fee2e2' : '#dcfce7',
                                color: facility.is_booked ? '#991b1b' : '#166534',
                              }}
                            >
                              {facility.is_booked ? 'BOOKED' : 'AVAILABLE'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>No facilities on this level.</p>
              )}
            </div>
          </div>
        )}

        {/* Building Overview Stats */}
        {overview && (
          <section className="kev-section" style={{ marginTop: '2rem' }}>
            <h3 className="kev-section-title">Building Overview</h3>
            <div className="kev-grid kev-grid-4">
              <div className="kev-stat-card">
                <div>
                  <strong>{overview.statistics?.total_facilities || 0}</strong>
                  <small>Total Facilities</small>
                </div>
              </div>
              <div className="kev-stat-card">
                <div>
                  <strong>{overview.statistics?.available_facilities || 0}</strong>
                  <small>Available</small>
                </div>
              </div>
              <div className="kev-stat-card">
                <div>
                  <strong>{overview.statistics?.booked_facilities || 0}</strong>
                  <small>Booked</small>
                </div>
              </div>
              <div className="kev-stat-card">
                <div>
                  <strong>{overview.accessibility ? 'Yes' : 'No'}</strong>
                  <small>Accessible</small>
                </div>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

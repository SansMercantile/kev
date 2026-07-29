import React, { useEffect, useState } from 'react'
import { getVirtualSchoolFacilities, getVirtualSchoolOverview, bookVirtualSchoolFacility } from '../lib/api'

export default function Portal() {
  const [overview, setOverview] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingError, setBookingError] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [overviewResult, facilitiesResult] = await Promise.all([
          getVirtualSchoolOverview(),
          getVirtualSchoolFacilities({ available: true }),
        ])
        setOverview(overviewResult.virtual_school)
        setFacilities(facilitiesResult.facilities || [])
      } catch (err) {
        setBookingError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleBookFacility = async (facilityId) => {
    setBookingError(null)
    setBookingSuccess(null)

    try {
      const result = await bookVirtualSchoolFacility(facilityId, `session-${Date.now()}`)
      setFacilities((currentFacilities) =>
        currentFacilities.map((facility) =>
          facility.id === facilityId ? { ...facility, is_booked: true, current_session: result.current_session } : facility
        )
      )
      setBookingSuccess('Facility booked successfully. Refreshing availability.')
    } catch (err) {
      setBookingError(err.message)
    }
  }

  return (
    <main className="kev-section" style={{ paddingTop: '2rem' }}>
      <section className="kev-portal-card">
        <div className="kev-pill">Virtual School Portal</div>
        <h2 className="kev-section-title">Operational Dashboard</h2>
        <p className="kev-card-text">
          A live view of KEV’s virtual campus, facilities, and curriculum environments.
        </p>

        {loading ? (
          <p>Loading virtual school data...</p>
        ) : (
          <div className="kev-grid kev-grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="kev-stat-card" style={{ background: '#ffffff' }}>
              <div>
                <strong>{overview?.statistics?.total_facilities ?? 0}</strong>
                <small>Total Facilities</small>
              </div>
            </div>
            <div className="kev-stat-card" style={{ background: '#ffffff' }}>
              <div>
                <strong>{overview?.statistics?.available_facilities ?? 0}</strong>
                <small>Available Facilities</small>
              </div>
            </div>
            <div className="kev-stat-card" style={{ background: '#ffffff' }}>
              <div>
                <strong>{overview?.statistics?.booked_facilities ?? 0}</strong>
                <small>Booked Facilities</small>
              </div>
            </div>
            <div className="kev-stat-card" style={{ background: '#ffffff' }}>
              <div>
                <strong>{overview?.accessibility ? 'Compliant' : 'Review Required'}</strong>
                <small>Accessibility Compliance</small>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="kev-section" style={{ marginTop: '2rem' }}>
        <div className="kev-pill" style={{ background: '#f8fafc', color: '#334155' }}>
          Facility Reservation
        </div>
        <h3 style={{ marginTop: '1rem' }}>Available Learning Spaces</h3>
        {bookingError && <p style={{ color: '#dc2626' }}>{bookingError}</p>}
        {bookingSuccess && <p style={{ color: '#16a34a' }}>{bookingSuccess}</p>}

        {loading ? (
          <p>Loading facilities...</p>
        ) : (
          <div style={{ marginTop: '1.25rem', display: 'grid', gap: '1rem' }}>
            {facilities.length > 0 ? (
              facilities.map((facility) => (
                <div key={facility.id} style={{ borderRadius: '1.25rem', padding: '1rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{facility.name}</h4>
                      <small style={{ color: '#64748b' }}>{facility.facility_type.replace('_', ' ')}</small>
                    </div>
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>
                      Capacity: {facility.capacity}
                    </span>
                  </div>
                  <p style={{ margin: '0.85rem 0 0', color: '#475569', fontSize: '0.95rem' }}>
                    {facility.equipment?.join(', ') || 'Virtual tools ready for student use.'}
                  </p>
                  <button
                    className="kev-btn kev-btn-primary"
                    style={{ marginTop: '1rem' }}
                    onClick={() => handleBookFacility(facility.id)}
                    disabled={facility.is_booked}
                  >
                    {facility.is_booked ? 'Booked' : 'Book Facility'}
                  </button>
                </div>
              ))
            ) : (
              <div className="kev-card">
                <p className="kev-card-text">No available facilities found. Try again in a moment.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

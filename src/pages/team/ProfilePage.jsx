import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Layers, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyTeam, updateMyTeam } from '../../services/api'
import { FormField, LoadingSpinner } from '../../components/ui'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [team, setTeam] = useState(null)
  const [form, setForm] = useState({
    leadName: '',
    usnRollNumber: '',
    mobile: '',
    email: '',
    dept: '',
    division: '',
    roomNumber: '',
    courseName: '',
  })

  useEffect(() => {
    getMyTeam()
      .then((r) => {
        const t = r.data.data
        setTeam(t)
        setForm({
          leadName: t.leadName || '',
          usnRollNumber: t.usnRollNumber || '',
          mobile: t.mobile || '',
          email: t.email || '',
          dept: t.dept || '',
          division: t.division || '',
          roomNumber: t.roomNumber || '',
          courseName: t.courseName || '',
        })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateMyTeam({
        leadName: form.leadName,
        usnRollNumber: form.usnRollNumber,
        mobile: form.mobile,
        dept: form.dept,
        division: form.division,
        roomNumber: form.roomNumber,
        courseName: form.courseName,
      })
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!team) return null

  const batch = team.batchId || {}
  const departments = batch.departments || []
  const divisions = batch.divisions || []
  const rooms = batch.rooms || []
  const courses = batch.courses || []

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: -1 }}>Profile Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 6 }}>Manage your Team Lead details and project metadata.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ borderRadius: 20, padding: 28, border: '1px solid rgba(37,99,235,0.2)' }}
      >
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: 'var(--color-accent)' }} /> Personal Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <FormField label="Full Name *" id="profile-name">
              <input
                id="profile-name"
                className="input-dark"
                placeholder="Team Lead's Full Name"
                value={form.leadName}
                onChange={(e) => setVal('leadName', e.target.value)}
                required
              />
            </FormField>
            <FormField label="USN / Roll Number *" id="profile-usn">
              <input
                id="profile-usn"
                className="input-dark"
                placeholder="e.g. 1MS22CS001"
                value={form.usnRollNumber}
                onChange={(e) => setVal('usnRollNumber', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Mobile Number *" id="profile-mobile">
              <input
                id="profile-mobile"
                className="input-dark"
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={form.mobile}
                onChange={(e) => setVal('mobile', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Email Address" id="profile-email">
              <input
                id="profile-email"
                className="input-dark bg-dark-disabled"
                type="email"
                value={form.email}
                disabled
                style={{ cursor: 'not-allowed', opacity: 0.6 }}
              />
            </FormField>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} style={{ color: 'var(--color-accent)' }} /> College & Project Metadata
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            
            {/* Department */}
            <FormField label="Department *" id="profile-dept">
              {departments.length > 0 ? (
                <select
                  id="profile-dept"
                  className="input-dark"
                  value={form.dept}
                  onChange={(e) => setVal('dept', e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="profile-dept"
                  className="input-dark"
                  placeholder="e.g. CSE"
                  value={form.dept}
                  onChange={(e) => setVal('dept', e.target.value)}
                  required
                />
              )}
            </FormField>

            {/* Division */}
            <FormField label="Division / Section *" id="profile-division">
              {divisions.length > 0 ? (
                <select
                  id="profile-division"
                  className="input-dark"
                  value={form.division}
                  onChange={(e) => setVal('division', e.target.value)}
                  required
                >
                  <option value="">Select Division</option>
                  {divisions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="profile-division"
                  className="input-dark"
                  placeholder="e.g. A"
                  value={form.division}
                  onChange={(e) => setVal('division', e.target.value)}
                  required
                />
              )}
            </FormField>

            {/* Training Room */}
            <FormField label="Training Room Number *" id="profile-room">
              {rooms.length > 0 ? (
                <select
                  id="profile-room"
                  className="input-dark"
                  value={form.roomNumber}
                  onChange={(e) => setVal('roomNumber', e.target.value)}
                  required
                >
                  <option value="">Select Room</option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="profile-room"
                  className="input-dark"
                  placeholder="e.g. Lab 3"
                  value={form.roomNumber}
                  onChange={(e) => setVal('roomNumber', e.target.value)}
                  required
                />
              )}
            </FormField>

            {/* Course Name */}
            <FormField label="Course Name *" id="profile-course">
              {courses.length > 0 ? (
                <select
                  id="profile-course"
                  className="input-dark"
                  value={form.courseName}
                  onChange={(e) => setVal('courseName', e.target.value)}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="profile-course"
                  className="input-dark"
                  placeholder="e.g. Java Full Stack"
                  value={form.courseName}
                  onChange={(e) => setVal('courseName', e.target.value)}
                  required
                />
              )}
            </FormField>
          </div>

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            style={{ width: '100%', padding: 12, borderRadius: 12, justifyContent: 'center' }}
            disabled={saving}
          >
            {saving ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <>
                <Save size={16} /> Save Profile
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

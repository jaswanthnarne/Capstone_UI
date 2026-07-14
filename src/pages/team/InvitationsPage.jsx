import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Trash2, Mail, Send, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyTeam, inviteMember, getMyInvitations, resendInvitation, cancelInvitation } from '../../services/api'
import { StatusBadge, LoadingSpinner, Modal, FormField, SectionHeader } from '../../components/ui'
import useAuthStore from '../../store/authStore'

function InviteMemberForm({ batch, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    email: '',
    mobile: '',
    dept: '',
    division: '',
    roomNumber: '',
    courseName: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const departments = (batch?.departments && batch.departments.length > 0) ? batch.departments : ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT']
  const divisions = (batch?.divisions && batch.divisions.length > 0) ? batch.divisions : ['A', 'B', 'C', 'D']
  const rooms = (batch?.rooms && batch.rooms.length > 0) ? batch.rooms : ['Lab 1', 'Lab 2', 'Lab 3', 'Lab 4', 'Seminar Room']
  const courses = (batch?.courses && batch.courses.length > 0) ? batch.courses : ['Java Full Stack', 'Python Full Stack', 'MERN Stack', 'Cyber Security']

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Member Name" id="inv-name">
          <input id="inv-name" className="input-dark" placeholder="e.g. Deepika K" value={form.name} onChange={e => set('name', e.target.value)} required />
        </FormField>
        <FormField label="USN / Registration Number" id="inv-roll">
          <input id="inv-roll" className="input-dark" placeholder="e.g. 2026CS02" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} required />
        </FormField>
        <FormField label="Email Address" id="inv-email">
          <input id="inv-email" className="input-dark" type="email" placeholder="student@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
        </FormField>
        <FormField label="Mobile Number" id="inv-mobile">
          <input id="inv-mobile" className="input-dark" placeholder="e.g. +91 9999999999" value={form.mobile} onChange={e => set('mobile', e.target.value)} required />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <FormField label="Department" id="inv-dept">
          <select id="inv-dept" className="input-dark" value={form.dept} onChange={e => set('dept', e.target.value)} required>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>

        <FormField label="Division" id="inv-division">
          <select id="inv-division" className="input-dark" value={form.division} onChange={e => set('division', e.target.value)} required>
            <option value="">Select Division</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>

        <FormField label="Training Room Number" id="inv-room">
          <select id="inv-room" className="input-dark" value={form.roomNumber} onChange={e => set('roomNumber', e.target.value)} required>
            <option value="">Select Room</option>
            {rooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </FormField>

        <FormField label="Name of Course" id="inv-course">
          <select id="inv-course" className="input-dark" value={form.courseName} onChange={e => set('courseName', e.target.value)} required>
            <option value="">Select Course</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
      </div>

      <button type="submit" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 16 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><Send size={14} /> Send Invitation Email</>}
      </button>
    </form>
  )
}

export default function InvitationsPage() {
  const [team, setTeam] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteModal, setInviteModal] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [actionId, setActionId] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      getMyTeam(),
      getMyInvitations().catch(() => ({ data: { data: [] } }))
    ])
      .then(([teamRes, invRes]) => {
        setTeam(teamRes.data.data)
        setInvitations(invRes.data.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleInvite = async (form) => {
    setInviting(true)
    try {
      await inviteMember(form)
      toast.success('Invitation email sent successfully!')
      setInviteModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleResend = async (id) => {
    setActionId(id)
    try {
      await resendInvitation(id)
      toast.success('Invitation email resent successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation')
    } finally {
      setActionId(null)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) return
    setActionId(id)
    try {
      await cancelInvitation(id)
      toast.success('Invitation cancelled.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invitation')
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!team) return null

  const memberCount = (team.members?.length || 0) + 1
  const min = team.batchId?.minMembers ?? 2
  const max = team.batchId?.maxMembers ?? 6
  const isSizeInvalid = memberCount < min || memberCount > max

  return (
    <div>
      <SectionHeader
        title="Team Members & Invitations"
        subtitle="Manage invitations and view active team members."
        action={
          memberCount < max && (
            <button className="btn-primary" onClick={() => setInviteModal(true)}>
              <Plus size={16} /> Invite Member
            </button>
          )
        }
      />

      {isSizeInvalid && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--color-danger)', fontWeight: 500 }}>
            Warning: Your team size ({memberCount}) does not meet the project batch size limit of {min} to {max} members (including the Team Lead). Please invite more members.
          </div>
        </div>
      )}

      <div className="layout-split-sidebar">
        {/* Active Members */}
        <motion.div
          className="glass"
          style={{ borderRadius: 16, overflow: 'hidden' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Active Team Members</span>
            <span className="badge badge-blue">{memberCount} of {max} Members</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark w-full" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {/* Team Lead */}
              <tr style={{ background: 'var(--color-accent-dim)' }}>
                <td style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>Lead</td>
                <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{team.leadUsername} (You)</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{team.usnRollNumber || '—'}</td>
                <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{team.email}</td>
                <td><span className="badge badge-blue">Team Lead</span></td>
              </tr>
              {/* Other Members */}
              {team.members?.length > 0 ? team.members.map((m, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{m.rollNumber}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{m.email || '—'}</td>
                  <td><span className="badge badge-gray">Member</span></td>
                </tr>
              )) : null}
            </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pending Invitations list */}
        <motion.div
          className="glass"
          style={{ borderRadius: 16, padding: 18, height: 'fit-content' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Pending Invites</h3>
          {invitations.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12, padding: '30px 0' }}>
              No pending invitations
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {invitations.map(inv => (
                <div key={inv._id} style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{inv.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace', marginTop: 2 }}>{inv.rollNumber}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{inv.email}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-warning)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Mail size={10} /> Sent
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={() => handleResend(inv._id)}
                        disabled={actionId !== null}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 11, cursor: 'pointer', fontWeight: 500, padding: 0 }}
                      >
                        {actionId === inv._id ? 'Sending...' : 'Resend'}
                      </button>
                      <button
                        onClick={() => handleCancel(inv._id)}
                        disabled={actionId !== null}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 11, cursor: 'pointer', fontWeight: 500, padding: 0 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Invite Modal */}
      <Modal isOpen={inviteModal} onClose={() => setInviteModal(false)} title="Invite Team Member" wide>
        <InviteMemberForm batch={team?.batchId} onSubmit={handleInvite} loading={inviting} />
      </Modal>
    </div>
  )
}

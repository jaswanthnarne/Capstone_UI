import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Edit, FileText, AlertTriangle, HelpCircle, User, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyTeam, updateMyTeam } from '../../services/api'
import { StatusBadge, LoadingSpinner, Modal, FormField } from '../../components/ui'
import useAuthStore from '../../store/authStore'


export default function TeamHomePage() {
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editModal, setEditModal] = useState(false)
  const [editName, setEditName] = useState('')

  const { user } = useAuthStore()

  const load = () => {
    setLoading(true)
    getMyTeam()
      .then((teamRes) => {
        setTeam(teamRes.data.data)
        setEditName(teamRes.data.data.name)
      })
      .catch(() => toast.error('Failed to load team data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpdateName = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateMyTeam({ name: editName })
      toast.success('Team name updated!')
      setEditModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update name')
    } finally {
      setSaving(false)
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
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: -1 }}>My Team</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 6 }}>Team dashboard for {team.leadUsername}</p>
      </div>

      {isSizeInvalid && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
            Warning: Your team size ({memberCount}) does not meet the project batch size limit of {min} to {max} members. Please invite your members.
          </div>
        </div>
      )}

      <div className="grid-2-responsive" style={{ marginBottom: 24 }}>
        {/* Team info */}
        <motion.div className="glass" style={{ borderRadius: 16, padding: 22 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Team</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: -0.5 }}>{team.name}</div>
            </div>
            <StatusBadge status={team.status} />
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Team Lead', value: team.leadUsername },
              { label: 'Email', value: team.email },
              { label: 'College', value: team.collegeId?.name },
              { label: 'Batch', value: team.batchId?.name },
              { label: 'Course (Subject)', value: team.batchId?.subjectId?.name || '—' },
              { label: 'Allowed Team Size', value: `${team.batchId?.minMembers || 2} to ${team.batchId?.maxMembers || 6} members` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <button id="edit-team-btn" className="btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', padding: '8px' }} onClick={() => setEditModal(true)}>
            <Edit size={14} /> Rename Team
          </button>
        </motion.div>

        {/* Problem statement */}
        <motion.div className="glass" style={{ borderRadius: 16, padding: 22, borderLeft: team.problemStatementId ? '3px solid var(--color-accent)' : '3px solid var(--color-surface-3)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Problem Statement</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Attempts: <strong>{team.problemChangeCount || 0}/3</strong></span>
          </div>
          {team.problemStatementId ? (
            <>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, lineHeight: 1.3 }}>{team.problemStatementId.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {team.problemStatementId.description}
              </div>
              {team.problemStatementId.suggestedTech?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {team.problemStatementId.suggestedTech.map(t => <span key={t} className="badge badge-blue" style={{ fontSize: 10 }}>{t}</span>)}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <FileText size={36} style={{ color: 'var(--color-text-muted)', marginBottom: 8, display: 'block', margin: '0 auto' }} />
              <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>No problem selected yet</div>
              <a href="/team/problems" style={{ fontSize: 13, color: 'var(--color-accent)', display: 'block', marginTop: 8, fontWeight: 600 }}>Browse problems &rarr;</a>
            </div>
          )}
        </motion.div>
      </div>

      {/* Active Team Members */}
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', marginTop: 24 }}>
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
      </div>

      {/* Project Templates */}
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden', marginTop: 24, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileText size={18} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Shared Project Templates</span>
        </div>
        {!team.batchId?.templates || team.batchId.templates.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: '10px 0' }}>
            No project template files have been uploaded by the trainer yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {team.batchId.templates.map(t => (
              <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Uploaded: {new Date(t.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11, flexShrink: 0 }}>
                  <Download size={12} /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal (Team name only) */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Rename Team">
        <form onSubmit={handleUpdateName}>
          <FormField label="Team Name">
            <input className="input-dark" value={editName} onChange={e => setEditName(e.target.value)} required />
          </FormField>
          <button type="submit" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Changes'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

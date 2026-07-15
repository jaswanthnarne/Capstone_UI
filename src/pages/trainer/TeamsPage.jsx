import { useState, useEffect } from 'react'
import { Users, Search, Plus, Filter, AlertCircle, Trash2, Save, Download, Check, Clock, Star, FileText, Lightbulb, Zap, Code2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getAllTeams, getColleges, getBatches, getSubjects, createTeam,
  getProblems, getTeamMilestones, getAllSubmissions, getAllEvaluations,
  adminOverrideTeam, deleteTeam, getTeamDailyLogs, resetDailyLogLimit
} from '../../services/api'
import { EmptyState, SectionHeader, StatusBadge, LoadingSpinner, Modal, FormField } from '../../components/ui'
import { useNavigate } from 'react-router-dom'
import { exportTeamExcel } from '../../utils/excelExport'

function CreateTeamForm({ batches, onSubmit, loading, defaultBatchId }) {
  const [form, setForm] = useState({ name: '', leadUsername: '', password: '', email: '', batchId: defaultBatchId || '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <FormField label="Team Name" id="team-name">
        <input id="team-name" className="input-dark" placeholder="e.g. Team Alpha" value={form.name} onChange={e => set('name', e.target.value)} required />
      </FormField>
      <FormField label="Lead Username" id="team-username">
        <input id="team-username" className="input-dark" placeholder="e.g. leadalpha" value={form.leadUsername} onChange={e => set('leadUsername', e.target.value)} required />
      </FormField>
      <FormField label="Lead Email" id="team-email">
        <input id="team-email" className="input-dark" type="email" placeholder="lead@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
      </FormField>
      <FormField label="Password" id="team-password">
        <input id="team-password" className="input-dark" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
      </FormField>
      <FormField label="Select Batch (Capstone Project Course)" id="team-batch">
        <select id="team-batch" className="input-dark" value={form.batchId} onChange={e => set('batchId', e.target.value)} required>
          <option value="">Choose a batch...</option>
          {batches.map(b => (
            <option key={b._id} value={b._id}>
              {b.name} — {b.collegeId?.name} ({b.subjectId?.name})
            </option>
          ))}
        </select>
      </FormField>
      <button type="submit" id="save-team-btn" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Team & Lead'}
      </button>
    </form>
  )
}

function TeamDetailsModal({ team, onClose, problems, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState('crud')
  const [form, setForm] = useState({
    name: team.name || '',
    leadUsername: team.leadUsername || '',
    email: team.email || '',
    password: '',
    problemStatementId: team.problemStatementId?._id || team.problemStatementId || '',
    status: team.status || 'problem_pending'
  })
  const [members, setMembers] = useState(team.members || [])
  const [milestones, setMilestones] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [evals, setEvals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dailyLogs, setDailyLogs] = useState([])
  const [selectedLogDate, setSelectedLogDate] = useState('')
  const [logsLoading, setLogsLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const addMember = () => setMembers(m => [...m, { name: '', rollNumber: '', email: '' }])
  const removeMember = (i) => setMembers(m => m.filter((_, idx) => idx !== i))
  const updateMember = (i, k, v) => setMembers(m => m.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const loadLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await getTeamDailyLogs(team._id)
      setDailyLogs(res.data.data)
      if (res.data.data.length > 0) {
        setSelectedLogDate(res.data.data[0].date)
      }
    } catch (err) {
      toast.error('Failed to load daily logs')
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs()
    }
  }, [activeTab])

  useEffect(() => {
    if (team) {
      setLoading(true)
      Promise.all([
        getTeamMilestones(team._id),
        getAllSubmissions({ teamId: team._id }),
        getAllEvaluations({ teamId: team._id })
      ])
        .then(([mRes, sRes, eRes]) => {
          setMilestones(mRes.data.data || [])
          setSubmissions(sRes.data.data || [])
          setEvals(eRes.data.data || [])
        })
        .catch(() => toast.error('Failed to load team project analysis'))
        .finally(() => setLoading(false))
    }
  }, [team])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminOverrideTeam(team._id, { ...form, members })
      toast.success('Team details updated!')
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update team')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this team entirely and all its associated data (submissions, evaluations, etc.)? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteTeam(team._id)
      toast.success('Team deleted!')
      onDelete()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete team')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div style={{ padding: '40px 0', textAlign: 'center' }}><LoadingSpinner /></div>

  const submission = submissions[0]
  const evaluation = evals[0]
  const milestoneCount = milestones.filter(m => m.status === 'done').length

  const minLimit = team.batchId?.minMembers || 2
  const maxLimit = team.batchId?.maxMembers || 6
  const totalMembers = members.length + 1
  const isSizeInvalid = totalMembers < minLimit || totalMembers > maxLimit

  const getMilestoneStyle = (status) => {
    if (status === 'done') return { color: '#3ECF8E', background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.15)' }
    if (status === 'in_progress') return { color: '#F2B84B', background: 'rgba(242,184,75,0.08)', border: '1px solid rgba(242,184,75,0.15)' }
    return { color: '#8B92A8', background: 'rgba(139,146,168,0.08)', border: '1px solid rgba(139,146,168,0.15)' }
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setActiveTab('crud')}
          style={{
            background: 'none', border: 'none', color: activeTab === 'crud' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            borderBottom: activeTab === 'crud' ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Team CRUD Operations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analysis')}
          style={{
            background: 'none', border: 'none', color: activeTab === 'analysis' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            borderBottom: activeTab === 'analysis' ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Project Analysis & Status
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          style={{
            background: 'none', border: 'none', color: activeTab === 'logs' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            borderBottom: activeTab === 'logs' ? '2px solid var(--color-accent)' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Daily Work Logs
        </button>
      </div>

      {activeTab === 'crud' ? (
        <form onSubmit={handleSubmit}>
          <div className="form-grid-responsive">
            <FormField label="Team Name">
              <input className="input-dark" value={form.name} onChange={e => set('name', e.target.value)} required />
            </FormField>
            <FormField label="Lead Username">
              <input className="input-dark" value={form.leadUsername} onChange={e => set('leadUsername', e.target.value)} required />
            </FormField>
            <FormField label="Lead Email">
              <input className="input-dark" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
            </FormField>
            <FormField label="Reset Password (optional)">
              <input className="input-dark" type="password" placeholder="Leave blank to keep" value={form.password} onChange={e => set('password', e.target.value)} />
            </FormField>
            <FormField label="Problem Statement">
              <select className="input-dark" value={form.problemStatementId} onChange={e => set('problemStatementId', e.target.value)}>
                <option value="">None</option>
                {problems.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </FormField>
            <FormField label="Project Status">
              <select className="input-dark" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="problem_pending">Pending Problem</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
              </select>
            </FormField>
          </div>

          <div style={{ marginTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Team Members</label>
              <button type="button" onClick={addMember} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
                + Add Member
              </button>
            </div>
            {members.map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr auto', gap: 6, marginBottom: 8 }}>
                <input className="input-dark" style={{ fontSize: 12 }} placeholder="Name" value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} required />
                <input className="input-dark" style={{ fontSize: 12 }} placeholder="Roll No" value={m.rollNumber} onChange={e => updateMember(i, 'rollNumber', e.target.value)} required />
                <input className="input-dark" style={{ fontSize: 12 }} placeholder="Email" type="email" value={m.email} onChange={e => updateMember(i, 'email', e.target.value)} required />
                <button type="button" onClick={() => removeMember(i)} className="btn-danger" style={{ padding: '4px 8px' }}>✕</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={handleDelete} className="btn-danger" disabled={deleting} style={{ padding: '10px 16px' }}>
              <Trash2 size={14} /> Delete Team
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid-2-responsive" style={{ gap: 20 }}>
          {/* Milestones and stats */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Milestones Progression</h4>
            {milestones.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No milestone logs started.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.stageName}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      ...getMilestoneStyle(m.status)
                    }}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Overview Insights</h4>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>
                  Roster Size: <strong style={{ color: isSizeInvalid ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{totalMembers}</strong> members (Allowed limits: {minLimit}-{maxLimit})
                  {isSizeInvalid && <span style={{ color: 'var(--color-danger)', fontSize: 11, marginLeft: 4 }}>(Invalid size!)</span>}
                </li>
                <li>Milestones Completed: <strong>{milestoneCount}/5</strong> stages</li>
                <li>Problem Selection Attempts: <strong>{team.problemChangeCount || 0}/3</strong> select calls</li>
                <li>Expected Project Batch Deadline: {team.batchId?.endDate ? new Date(team.batchId.endDate).toLocaleDateString() : 'N/A'}</li>
              </ul>

              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  onClick={() => exportTeamExcel(team)}
                >
                  <Download size={14} /> Export Project Report (Excel)
                </button>
              </div>
            </div>
          </div>

          {/* Submission and evaluation info */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Deliverables & Grades</h4>
            <div className="glass" style={{ borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submission Status</div>
              {submission ? (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                    🔗 <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>GitHub Repo</a>
                  </div>
                  {submission.deployedUrl && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)', wordBreak: 'break-all', marginTop: 4 }}>
                      🌐 <a href={submission.deployedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>Live Deployment</a>
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6 }}>
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>No deliverables submitted yet.</div>
              )}
            </div>

            <div className="glass" style={{ borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluation Score</div>
              {evaluation ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Star size={16} style={{ color: '#ea580c' }} />
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>{evaluation.score}</span>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>/100</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <div>Code: <strong>{evaluation.criteria?.codeQuality || 0}/25</strong></div>
                    <div>Functionality: <strong>{evaluation.criteria?.functionality || 0}/25</strong></div>
                    <div>Docs: <strong>{evaluation.criteria?.documentation || 0}/25</strong></div>
                    <div>Presentation: <strong>{evaluation.criteria?.presentation || 0}/25</strong></div>
                  </div>
                  {evaluation.feedback && (
                    <div style={{ marginTop: 10, fontSize: 11, fontStyle: 'italic', color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.02)', padding: '6px 8px', borderRadius: 6 }}>
                      &ldquo;{evaluation.feedback}&rdquo;
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>Not graded yet. Go to Evaluations tab to enter score.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Daily Work Logs</h4>
          {logsLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}><LoadingSpinner /></div>
          ) : dailyLogs.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No daily work logs submitted by this team yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select Date:</label>
                <select 
                  className="input-dark" 
                  style={{ width: 'auto', padding: '6px 12px' }} 
                  value={selectedLogDate} 
                  onChange={e => setSelectedLogDate(e.target.value)}
                >
                  {dailyLogs.map(l => (
                    <option key={l.date} value={l.date}>{l.date}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const log = dailyLogs.find(l => l.date === selectedLogDate)
                if (!log) return null
                return (
                  <div className="glass" style={{ borderRadius: 12, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Logs for {log.date}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          Edit Count: <strong style={{ color: log.changeCount >= 3 ? '#ef4444' : 'var(--color-text-primary)' }}>{log.changeCount}/3</strong>
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={async () => {
                            if (!window.confirm(`Reset edit limit for log date ${log.date}?`)) return
                            try {
                              await resetDailyLogLimit({ teamId: team._id, date: log.date })
                              toast.success('Edit count reset successfully!')
                              loadLogs()
                            } catch (err) {
                              toast.error('Failed to reset log edit limit')
                            }
                          }}
                        >
                          Reset Limit
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {log.logs.map((item, keyIdx) => (
                        <div key={keyIdx} style={{ padding: 10, background: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                            <span>{item.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{item.rollNumber}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {item.taskDone || '(No work logged)'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TeamsPage() {
  const [colleges, setColleges] = useState([])
  const [subjects, setSubjects] = useState([])
  const [batches, setBatches] = useState([])
  const [problems, setProblems] = useState([])
  
  const [selectedCollegeId, setSelectedCollegeId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')

  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  
  const [filter, setFilter] = useState({ status: '', q: '' })

  const loadMetadata = () => {
    setLoading(true)
    Promise.all([getColleges(), getSubjects(), getBatches(), getProblems()])
      .then(([c, s, b, p]) => {
        setColleges(c.data.data)
        setSubjects(s.data.data)
        setBatches(b.data.data)
        setProblems(p.data.data)
      })
      .catch(() => toast.error('Failed to load colleges and courses'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMetadata() }, [])

  // Load teams when Batch changes
  const loadTeams = () => {
    if (selectedBatchId) {
      setTeamsLoading(true)
      getAllTeams({ batchId: selectedBatchId })
        .then(res => setTeams(res.data.data))
        .catch(() => toast.error('Failed to load teams'))
        .finally(() => setTeamsLoading(false))
    } else {
      setTeams([])
    }
  }

  useEffect(() => { loadTeams() }, [selectedBatchId])

  const handleCreateTeam = async (form) => {
    setSaving(true)
    try {
      await createTeam(form)
      toast.success('Team created!')
      setCreateModalOpen(false)
      loadTeams()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team')
    } finally {
      setSaving(false)
    }
  }

  // Filter batches dropdown based on selected college & subject
  const availableBatches = batches.filter(b => {
    if (selectedCollegeId && b.collegeId?._id !== selectedCollegeId) return false
    if (selectedSubjectId && b.subjectId?._id !== selectedSubjectId) return false
    return true
  })

  // Auto reset batch selection if not in available batches
  useEffect(() => {
    if (selectedBatchId && !availableBatches.some(b => b._id === selectedBatchId)) {
      setSelectedBatchId('')
    }
  }, [selectedCollegeId, selectedSubjectId])

  if (loading) return <LoadingSpinner />

  const now = new Date()
  const filtered = teams.filter(t => {
    const isOverdue = t.batchId?.endDate && new Date(t.batchId.endDate) < now && t.status !== 'submitted'
    const effectiveStatus = isOverdue ? 'overdue' : t.status
    if (filter.status && effectiveStatus !== filter.status) return false
    if (filter.q && !t.name.toLowerCase().includes(filter.q.toLowerCase()) && !t.leadUsername.toLowerCase().includes(filter.q.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <SectionHeader
        title="All Teams"
        subtitle="Manage capstone teams and accounts by selecting project details"
        action={
          <button id="add-team-btn" className="btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> Create Team (TL Account)
          </button>
        }
      />

      {/* Select Filter Controls */}
      <div className="glass" style={{ borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} style={{ color: 'var(--color-accent)' }} /> Project Scope Selection
        </div>
        <div className="form-grid-responsive" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>1. Select College</label>
            <select className="input-dark" value={selectedCollegeId} onChange={e => setSelectedCollegeId(e.target.value)}>
              <option value="">Choose College...</option>
              {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>2. Select Course</label>
            <select className="input-dark" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
              <option value="">Choose Course...</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>3. Select Batch / Project</label>
            <select className="input-dark" value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} disabled={!selectedCollegeId && !selectedSubjectId}>
              <option value="">Choose Batch...</option>
              {availableBatches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search and status controls */}
      {selectedBatchId && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input className="input-dark" style={{ paddingLeft: 34 }} placeholder="Search teams in batch..." value={filter.q} onChange={e => setFilter(f => ({ ...f, q: e.target.value }))} />
          </div>
          <select className="input-dark" style={{ width: 'auto', flex: '0 0 auto' }} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="problem_pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      )}

      {/* Main content body */}
      {!selectedBatchId ? (
        <div className="glass" style={{ borderRadius: 16, padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <AlertCircle size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>No batch selected</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Select a college, course, and batch using the filters above to load Capstone teams.</div>
        </div>
      ) : teamsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No teams found" description="No teams match your batch or search query." />
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark w-full" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>Team</th><th>Lead</th><th>Size</th><th>College</th><th>Batch</th><th>Problem</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(team => {
                  const isOverdue = team.batchId?.endDate && new Date(team.batchId.endDate) < now && team.status !== 'submitted'
                  return (
                    <tr key={team._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedTeam(team); setDetailsModalOpen(true) }}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-accent)', textDecoration: 'underline' }}>{team.name}</span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{team.leadUsername}</td>
                      <td>
                        <span className="badge badge-blue">{(team.members?.length || 0) + 1} members</span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{team.collegeId?.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{team.batchId?.name}</td>
                      <td style={{ maxWidth: 180 }}>
                        {team.problemStatementId?.title
                          ? <span style={{ color: 'var(--color-text-primary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{team.problemStatementId.title}</span>
                          : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Not selected</span>
                        }
                      </td>
                      <td><StatusBadge status={isOverdue ? 'overdue' : team.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Team & TL Account">
        <CreateTeamForm batches={batches} defaultBatchId={selectedBatchId} onSubmit={handleCreateTeam} loading={saving} />
      </Modal>

      {/* Details & CRUD Operations Modal */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title={selectedTeam ? `Team Profile Dashboard: ${selectedTeam.name}` : 'Team Details'} wide>
        {selectedTeam && (
          <TeamDetailsModal
            team={selectedTeam}
            problems={problems.filter(p => p.subjectId === selectedTeam.batchId?.subjectId?._id || p.subjectId === selectedTeam.batchId?.subjectId || p.subjectId?._id === selectedTeam.batchId?.subjectId)}
            onClose={() => setDetailsModalOpen(false)}
            onUpdate={loadTeams}
            onDelete={loadTeams}
          />
        )}
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Plus, Filter, AlertCircle, Trash2, Save, Download, Check, Clock, Star,
  FileText, Lightbulb, Zap, Code2, Edit, LayoutGrid, List, ChevronRight, UserCheck, Shield, ExternalLink, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getAllTeams, getColleges, getBatches, getSubjects, createTeam,
  getProblems, getTeamMilestones, getAllSubmissions, getAllEvaluations,
  adminOverrideTeam, deleteTeam, getTeamDailyLogs, resetDailyLogLimit,
  gradeDailyLog, releaseDailyLogScore, getTeamDocSubmissions, resetSubmissionLimit,
  getAllDailyLogs, overrideDailyLog
} from '../../services/api'
import { EmptyState, SectionHeader, StatusBadge, LoadingSpinner, Modal, FormField } from '../../components/ui'
import { exportTeamExcel, exportTeamLogsExcel, exportAllLogsExcel } from '../../utils/excelExport'

function CreateTeamForm({ batches, onSubmit, loading, defaultBatchId }) {
  const [form, setForm] = useState({ name: '', leadUsername: '', password: '', email: '', batchId: defaultBatchId || '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <FormField label="Team Name" id="team-name">
        <input id="team-name" className="input-dark" placeholder="e.g. Team Alpha (AI Vision)" value={form.name} onChange={e => set('name', e.target.value)} required />
      </FormField>
      <FormField label="Lead Username" id="team-username">
        <input id="team-username" className="input-dark" placeholder="e.g. leadalpha" value={form.leadUsername} onChange={e => set('leadUsername', e.target.value)} required />
      </FormField>
      <FormField label="Lead Email Address" id="team-email">
        <input id="team-email" className="input-dark" type="email" placeholder="lead@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
      </FormField>
      <FormField label="Access Password" id="team-password">
        <input id="team-password" className="input-dark" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
      </FormField>
      <FormField label="Assign Batch (Capstone Course)" id="team-batch">
        <select id="team-batch" className="input-dark" value={form.batchId} onChange={e => set('batchId', e.target.value)} required>
          <option value="">Select Target Batch...</option>
          {batches.map(b => (
            <option key={b._id} value={b._id}>
              {b.name} — {b.collegeId?.name} ({b.subjectId?.name})
            </option>
          ))}
        </select>
      </FormField>
      <button type="submit" id="save-team-btn" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 12 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Team Account & Credentials'}
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
  const [logGradeInputs, setLogGradeInputs] = useState({})
  const [editingLogIdx, setEditingLogIdx] = useState(null)
  const [editingLogText, setEditingLogText] = useState('')

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

  const [docSubmissions, setDocSubmissions] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)

  const loadDocs = async () => {
    setDocsLoading(true)
    try {
      const res = await getTeamDocSubmissions(team._id)
      setDocSubmissions(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load document submissions')
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'logs') loadLogs()
    if (activeTab === 'docs') loadDocs()
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
      toast.success('Team details updated successfully!')
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update team')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete team "${team.name}" and all associated data? This action cannot be reversed.`)) return
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
    if (status === 'done') return { color: '#3ECF8E', background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.2)' }
    if (status === 'in_progress') return { color: '#F2B84B', background: 'rgba(242,184,75,0.08)', border: '1px solid rgba(242,184,75,0.2)' }
    return { color: '#8B92A8', background: 'rgba(139,146,168,0.08)', border: '1px solid rgba(139,146,168,0.2)' }
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 20, overflowX: 'auto' }}>
        {[
          { id: 'crud', label: 'Team Configuration', icon: Edit },
          { id: 'analysis', label: 'Project Progress', icon: Lightbulb },
          { id: 'logs', label: 'Daily Work Logs', icon: Clock },
          { id: 'docs', label: 'Uploaded Documents', icon: FileText }
        ].map(tab => {
          const IconComponent = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                marginBottom: '-1px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap'
              }}
            >
              <IconComponent size={14} /> {tab.label}
            </button>
          )
        })}
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
              <input className="input-dark" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={e => set('password', e.target.value)} />
            </FormField>
            <FormField label="Allocated Problem Statement">
              <select className="input-dark" value={form.problemStatementId} onChange={e => set('problemStatementId', e.target.value)}>
                <option value="">None (Team select pending)</option>
                {problems.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </FormField>
            <FormField label="Project Status">
              <select className="input-dark" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="problem_pending">Pending Problem Selection</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted Deliverables</option>
              </select>
            </FormField>
          </div>

          <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={14} /> Team Roster Members ({totalMembers} total)
              </label>
              <button type="button" onClick={addMember} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }}>
                + Add Member
              </button>
            </div>
            {members.map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr auto', gap: 8, marginBottom: 8 }}>
                <input className="input-dark" style={{ fontSize: 12 }} placeholder="Student Name" value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} required />
                <input className="input-dark" style={{ fontSize: 12 }} placeholder="Roll No / USN" value={m.rollNumber} onChange={e => updateMember(i, 'rollNumber', e.target.value)} required />
                <input className="input-dark" style={{ fontSize: 12 }} placeholder="Email Address" type="email" value={m.email} onChange={e => updateMember(i, 'email', e.target.value)} required />
                <button type="button" onClick={() => removeMember(i)} className="btn-danger" style={{ padding: '4px 8px' }}>✕</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
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
      ) : activeTab === 'analysis' ? (
        <div className="grid-2-responsive" style={{ gap: 20 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Milestone Milestones</h4>
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
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Team Insights</h4>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>
                  Roster Size: <strong style={{ color: isSizeInvalid ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{totalMembers}</strong> members (Limits: {minLimit}-{maxLimit})
                </li>
                <li>Milestones Completed: <strong>{milestoneCount}/5</strong> stages</li>
                <li>Problem Selection Attempts: <strong>{team.problemChangeCount || 0}/3</strong></li>
              </ul>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  onClick={() => exportTeamExcel(team)}
                >
                  <Download size={14} /> Export Team Profile (Excel)
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Submission & Evaluation</h4>
            <div className="glass" style={{ borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deliverables</div>
              {submission ? (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                    🔗 <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>GitHub Repository</a>
                  </div>
                  {submission.deployedUrl && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-primary)', marginTop: 4 }}>
                      🌐 <a href={submission.deployedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981' }}>Live Deployment</a>
                    </div>
                  )}
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
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>Not graded yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'logs' ? (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Daily Work Logs</h4>
          {logsLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}><LoadingSpinner /></div>
          ) : dailyLogs.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No daily work logs submitted yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => exportTeamLogsExcel(team.name, dailyLogs)}
                >
                  <Download size={12} /> Export Logs (Excel)
                </button>
              </div>

              {(() => {
                const log = dailyLogs.find(l => l.date === selectedLogDate)
                if (!log) return null
                return (
                  <div className="glass" style={{ borderRadius: 12, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Logs for {log.date}</span>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={async () => {
                          if (!window.confirm(`Reset edit limit for ${log.date}?`)) return
                          try {
                            await resetDailyLogLimit({ teamId: team._id, date: log.date })
                            toast.success('Edit count reset!')
                            loadLogs()
                          } catch (err) {
                            toast.error('Failed to reset edit limit')
                          }
                        }}
                      >
                        Reset Edit Limit
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {log.logs.map((item, keyIdx) => (
                        <div key={keyIdx} style={{ padding: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                            👤 {item.name} <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>({item.rollNumber})</span>
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
      ) : (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12 }}>Uploaded Documents</h4>
          {docsLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}><LoadingSpinner /></div>
          ) : docSubmissions.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No documents submitted yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {docSubmissions.map((doc, idx) => (
                <div key={idx} className="glass" style={{ borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{doc.requestId?.title || 'Document'}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{doc.fileName} ({doc.fileSize} MB)</div>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Download size={12} /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Expandable Modern Team Card Component
function ExpandableTeamCard({ team, onSelect, onExport, onDelete, isOverdue }) {
  const memberCount = (team.members?.length || 0) + 1
  
  // Dynamic Card Styles
  const getCardAccent = (status, overdue) => {
    if (overdue) return { border: '1px solid rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.05)', color: '#ef4444' }
    if (status === 'submitted') return { border: '1px solid rgba(62,207,142,0.4)', bg: 'rgba(62,207,142,0.05)', color: '#3ecf8e' }
    if (status === 'in_progress') return { border: '1px solid rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.05)', color: '#3b82f6' }
    return { border: '1px solid rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.05)', color: '#f59e0b' }
  }

  const accent = getCardAccent(team.status, isOverdue)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="glass"
      style={{
        borderRadius: 18,
        padding: 20,
        border: accent.border,
        background: 'var(--color-surface-2)',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        gap: 16,
        position: 'relative',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}
    >
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              {team.name}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserCheck size={13} style={{ color: 'var(--color-accent)' }} /> Lead: <strong style={{ color: 'var(--color-text-primary)' }}>{team.leadUsername}</strong>
          </div>
        </div>
        <StatusBadge status={isOverdue ? 'overdue' : team.status} />
      </div>

      {/* Problem Statement Card Info */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Allocated Problem
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: team.problemStatementId?.title ? 'var(--color-text-primary)' : 'var(--color-text-muted)', lineHeight: 1.4 }}>
          {team.problemStatementId?.title || '⚠️ Problem Statement Pending Selection'}
        </div>
      </div>

      {/* Team Roster & College Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <span className="badge badge-blue" style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} /> {memberCount} Members
        </span>
        {team.collegeId?.name && (
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6 }}>
            🏫 {team.collegeId.name}
          </span>
        )}
        {team.batchId?.name && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6 }}>
            📦 {team.batchId.name}
          </span>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginTop: 4 }}>
        <button
          type="button"
          className="btn-primary"
          style={{ flex: 1, padding: '8px 12px', fontSize: 12, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={() => onSelect(team)}
        >
          <Edit size={13} /> Manage Team
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '8px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onClick={() => onExport(team)}
          title="Export Excel Dossier"
        >
          <Download size={13} /> Excel
        </button>
        <button
          type="button"
          className="btn-danger"
          style={{ padding: '8px 12px', fontSize: 12 }}
          onClick={() => onDelete(team._id)}
          title="Delete Team"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
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
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'

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

  const handleExportAllLogs = async () => {
    try {
      const loader = toast.loading('Fetching all daily logs...')
      const res = await getAllDailyLogs()
      toast.dismiss(loader)
      if (res.data?.success) {
        await exportAllLogsExcel(res.data.data)
        toast.success('All daily logs exported successfully!')
      } else {
        throw new Error('Export failed')
      }
    } catch (err) {
      toast.dismiss()
      toast.error('Failed to export daily logs')
    }
  }

  const handleCreateTeam = async (form) => {
    setSaving(true)
    try {
      await createTeam(form)
      toast.success('Team account created!')
      setCreateModalOpen(false)
      loadTeams()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeamInline = async (teamId) => {
    if (!window.confirm('Delete this team entirely? This action cannot be undone.')) return
    try {
      await deleteTeam(teamId)
      toast.success('Team deleted!')
      loadTeams()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete team')
    }
  }

  const availableBatches = batches.filter(b => {
    if (selectedCollegeId && b.collegeId?._id !== selectedCollegeId) return false
    if (selectedSubjectId && b.subjectId?._id !== selectedSubjectId) return false
    return true
  })

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
        title="Capstone Team Directory"
        subtitle="Manage student teams, accounts, milestone progress & daily work logs"
        action={
          <button id="add-team-btn" className="btn-primary" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} /> Create Team & TL Account
          </button>
        }
      />

      {/* Scope Selector Filters */}
      <div className="glass" style={{ borderRadius: 16, padding: 20, marginBottom: 24, background: 'var(--color-surface-2)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} style={{ color: 'var(--color-accent)' }} /> Project Scope & Course Filter
        </div>
        <div className="form-grid-responsive" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>1. Select College</label>
            <select className="input-dark" value={selectedCollegeId} onChange={e => setSelectedCollegeId(e.target.value)}>
              <option value="">All Colleges...</option>
              {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>2. Select Course / Subject</label>
            <select className="input-dark" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
              <option value="">All Courses...</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>3. Select Active Batch</label>
            <select className="input-dark" value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} disabled={!selectedCollegeId && !selectedSubjectId}>
              <option value="">Choose Batch...</option>
              {availableBatches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher, Search & Status Filters */}
      {selectedBatchId && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, flex: '1 1 300px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input className="input-dark" style={{ paddingLeft: 34 }} placeholder="Search teams or leads..." value={filter.q} onChange={e => setFilter(f => ({ ...f, q: e.target.value }))} />
            </div>
            <select className="input-dark" style={{ width: 'auto' }} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Progress</option>
              <option value="problem_pending">Pending Problem</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'var(--color-surface)', padding: 3, borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  background: viewMode === 'cards' ? 'var(--color-accent)' : 'transparent',
                  color: viewMode === 'cards' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: 7,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <LayoutGrid size={14} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'var(--color-accent)' : 'transparent',
                  color: viewMode === 'table' ? '#ffffff' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: 7,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <List size={14} /> Table
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={handleExportAllLogs}
            >
              <Download size={14} /> Export All Logs (Excel)
            </button>
          </div>
        </div>
      )}

      {/* Content Display */}
      {!selectedBatchId ? (
        <div className="glass" style={{ borderRadius: 16, padding: '48px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <AlertCircle size={36} style={{ color: 'var(--color-accent)', margin: '0 auto 14px', display: 'block' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Select College & Batch</div>
          <div style={{ fontSize: 13, marginTop: 6, maxWidth: 460, margin: '6px auto 0' }}>
            Choose a college, course, and active batch using the selector above to display student capstone teams.
          </div>
        </div>
      ) : teamsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No teams found" description="No teams match your selected batch or search query." />
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          <AnimatePresence>
            {filtered.map(team => {
              const isOverdue = team.batchId?.endDate && new Date(team.batchId.endDate) < now && team.status !== 'submitted'
              return (
                <ExpandableTeamCard
                  key={team._id}
                  team={team}
                  isOverdue={isOverdue}
                  onSelect={(t) => { setSelectedTeam(t); setDetailsModalOpen(true) }}
                  onExport={exportTeamExcel}
                  onDelete={handleDeleteTeamInline}
                />
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark w-full" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>Team Name</th><th>Lead Username</th><th>Roster</th><th>College</th><th>Batch</th><th>Allocated Problem</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(team => {
                  const isOverdue = team.batchId?.endDate && new Date(team.batchId.endDate) < now && team.status !== 'submitted'
                  return (
                    <tr key={team._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedTeam(team); setDetailsModalOpen(true) }}>
                      <td><span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{team.name}</span></td>
                      <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{team.leadUsername}</td>
                      <td><span className="badge badge-blue">{(team.members?.length || 0) + 1} members</span></td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{team.collegeId?.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{team.batchId?.name}</td>
                      <td style={{ maxWidth: 200 }}>
                        {team.problemStatementId?.title
                          ? <span style={{ color: 'var(--color-text-primary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{team.problemStatementId.title}</span>
                          : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Not selected</span>
                        }
                      </td>
                      <td><StatusBadge status={isOverdue ? 'overdue' : team.status} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => { setSelectedTeam(team); setDetailsModalOpen(true) }}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Team & Credentials">
        <CreateTeamForm batches={batches} defaultBatchId={selectedBatchId} onSubmit={handleCreateTeam} loading={saving} />
      </Modal>

      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title={selectedTeam ? `Team Profile: ${selectedTeam.name}` : 'Team Details'} wide>
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

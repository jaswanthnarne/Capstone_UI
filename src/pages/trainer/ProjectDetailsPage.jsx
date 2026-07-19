import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Calendar, Building2, BookOpen, Users,
  FileText, Plus, Trash2, Edit, Save, Lock, Unlock, Download, UploadCloud
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getBatch, getProblems, getAllTeams, createTeam, adminOverrideTeam, updateBatch,
  uploadBatchTemplate, deleteBatchTemplate, deleteTeam
} from '../../services/api'
import { exportTeamExcel, exportProjectExcel } from '../../utils/excelExport'
import {
  Modal, FormField, LoadingSpinner, StatusBadge, SectionHeader, EmptyState
} from '../../components/ui'

// Direct Team Creation Form (with credentials email & members)
function CreateTeamForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', leadUsername: '', password: '', email: '' })
  const [members, setMembers] = useState([])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addMember = () => setMembers(m => [...m, { name: '', rollNumber: '', email: '' }])
  const removeMember = (i) => setMembers(m => m.filter((_, idx) => idx !== i))
  const updateMember = (i, k, v) => setMembers(m => m.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, members }) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label="Team Name" id="team-name">
          <input id="team-name" className="input-dark" placeholder="e.g. Team Alpha" value={form.name} onChange={e => set('name', e.target.value)} required />
        </FormField>
        <FormField label="Lead Username" id="team-username">
          <input id="team-username" className="input-dark" placeholder="e.g. leadalpha" value={form.leadUsername} onChange={e => set('leadUsername', e.target.value)} required />
        </FormField>
        <FormField label="Lead Email" id="team-email">
          <input id="team-email" className="input-dark" type="email" placeholder="lead@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
        </FormField>
        <FormField label="Lead Password" id="team-password">
          <input id="team-password" className="input-dark" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
        </FormField>
      </div>

      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Direct Members (Optional)</label>
          <button type="button" onClick={addMember} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
            + Add Member
          </button>
        </div>
        {members.map((m, i) => (
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
      <button type="submit" id="save-team-btn" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Team & Lead'}
      </button>
    </form>
  )
}

// Override Modal Form Component
function EditTeamModal({ team, problems, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: team.name || '',
    leadUsername: team.leadUsername || '',
    email: team.email || '',
    password: '',
    problemStatementId: team.problemStatementId?._id || team.problemStatementId || '',
    status: team.status || 'problem_pending'
  })
  const [members, setMembers] = useState(team.members || [])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addMember = () => setMembers(m => [...m, { name: '', rollNumber: '', email: '' }])
  const removeMember = (i) => setMembers(m => m.filter((_, idx) => idx !== i))
  const updateMember = (i, k, v) => setMembers(m => m.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, members }) }}>
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
        <input className="input-dark" type="password" placeholder="Leave empty to keep current" value={form.password} onChange={e => set('password', e.target.value)} />
      </FormField>
      <FormField label="Allocated Problem Statement">
        <select className="input-dark" value={form.problemStatementId} onChange={e => set('problemStatementId', e.target.value)}>
          <option value="">None (Let team select)</option>
          {problems.map(p => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Team Status">
        <select className="input-dark" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="problem_pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
        </select>
      </FormField>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Team Members ({members.length})</label>
          <button type="button" onClick={addMember} className="btn-secondary" style={{ padding: '2px 8px', fontSize: 12 }}>
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

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={async () => {
            try {
              const loader = toast.loading('Fetching team logs...');
              const lRes = await getTeamDailyLogs(team._id);
              toast.dismiss(loader);
              await exportTeamExcel(team, lRes.data.data || []);
            } catch (err) {
              toast.dismiss();
              await exportTeamExcel(team, []);
            }
          }}
        >
          <Download size={14} /> Export Team (Excel)
        </button>
        <button
          type="submit"
          className="btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={loading}
        >
          {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><Save size={14} /> Apply Override</>}
        </button>
      </div>
    </form>
  )
}

export default function ProjectDetailsPage() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [problems, setProblems] = useState([])
  const [teams, setTeams] = useState([])

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const [createModal, setCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [overrideModal, setOverrideModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [overriding, setOverriding] = useState(false)

  const [templateName, setTemplateName] = useState('')
  const [templateFile, setTemplateFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleUploadTemplate = async (e) => {
    e.preventDefault()
    if (!templateFile) return toast.error('Please select a file to upload')
    setUploading(true)
    const formData = new FormData()
    formData.append('name', templateName)
    formData.append('file', templateFile)

    try {
      const res = await uploadBatchTemplate(projectId, formData)
      setProject(res.data.data)
      setTemplateName('')
      setTemplateFile(null)
      if (document.getElementById('template-file')) {
        document.getElementById('template-file').value = ''
      }
      toast.success('Template uploaded successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return
    try {
      const res = await deleteBatchTemplate(projectId, templateId)
      setProject(res.data.data)
      toast.success('Template deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team entirely and all its associated data (submissions, evaluations, etc.)? This cannot be undone.')) return
    try {
      await deleteTeam(teamId)
      toast.success('Team deleted successfully!')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete team')
    }
  }

  const loadData = () => {
    setLoading(true)
    Promise.all([
      getBatch(projectId),
      getAllTeams({ batchId: projectId })
    ])
      .then(([pRes, tRes]) => {
        const proj = pRes.data.data
        setProject(proj)
        setTeams(tRes.data.data)

        if (proj.subjectId?._id) {
          getProblems({ subjectId: proj.subjectId._id })
            .then(probRes => setProblems(probRes.data.data))
            .catch(() => { })
        }
      })
      .catch(() => toast.error('Failed to load project details'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const handleCreateTeam = async (teamForm) => {
    setCreating(true)
    try {
      await createTeam({ ...teamForm, batchId: projectId })
      toast.success('Team created!')
      setCreateModal(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  const handleOverrideTeam = async (overrideForm) => {
    setOverriding(true)
    try {
      await adminOverrideTeam(selectedTeam._id, overrideForm)
      toast.success('Team overrides successfully saved!')
      setOverrideModal(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply overrides')
    } finally {
      setOverriding(false)
    }
  }

  const handleToggleLock = async () => {
    try {
      const updatedStatus = !project.isProblemSelectionLocked
      await updateBatch(project._id, { isProblemSelectionLocked: updatedStatus })
      toast.success(updatedStatus ? 'Problem selection locked!' : 'Problem selection unlocked!')
      loadData()
    } catch (err) {
      toast.error('Failed to update selection lock status')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!project) return <div style={{ color: '#ef4444' }}>Project not found</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => navigate('/trainer/projects')}>
          ← Back to Projects
        </button>
      </div>

      <SectionHeader
        title={project.name}
        subtitle={`Capstone Project Workspace`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => exportProjectExcel(project, teams)}>
              <Download size={16} /> Export Project (Excel)
            </button>
            <button className="btn-primary" onClick={() => setCreateModal(true)}>
              <Plus size={16} /> Create Team (TL Account)
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 24, paddingBottom: 1
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'teams', label: `Teams (${teams.length})`, icon: Users },
          { id: 'problems', label: `Problems Pool (${problems.length})`, icon: FileText },
          { id: 'templates', label: 'Templates', icon: UploadCloud }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Capstone Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><Building2 size={13} /> College</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 4 }}>{project.collegeId?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>{project.collegeId?.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={13} /> Course (Subject)</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 4 }}>{project.subjectId?.name || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> Project Timeline</div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-primary)', marginTop: 4 }}>
                    {new Date(project.startDate).toLocaleDateString()} – {new Date(project.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} /> Team Size Limits</div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-primary)', marginTop: 4 }}>
                    Min: <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{project.minMembers || 2}</span> | Max: <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{project.maxMembers || 6}</span> members
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <motion.div
            key="teams"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {teams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teams created yet"
                description="Click create team to set up a Team Lead account for this project."
                action={<button className="btn-primary" onClick={() => setCreateModal(true)}><Plus size={14} /> Create Team</button>}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
                {teams.map(team => {
                  const sizeInvalid = (team.members?.length || 0) + 1 < (project.minMembers || 2) || (team.members?.length || 0) + 1 > (project.maxMembers || 6)
                  return (
                    <div
                      key={team._id}
                      className="glass glass-hover"
                      style={{
                        borderRadius: 16, padding: 20, cursor: 'pointer',
                        borderLeft: sizeInvalid ? '3px solid var(--color-danger)' : '3px solid var(--color-accent)'
                      }}
                      onClick={() => {
                        setSelectedTeam(team)
                        setOverrideModal(true)
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{team.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>Username: {team.leadUsername}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <StatusBadge status={team.status} />
                          <button className="btn-secondary" style={{ padding: '4px', borderRadius: '5px' }} title="Admin Override">
                            <Edit size={12} />
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '4px', borderRadius: '5px' }}
                            title="Delete Team"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTeam(team._id)
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={14} /> {(team.members?.length || 0) + 1} members {sizeInvalid && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>(Invalid size!)</span>}
                      </div>

                      {team.problemStatementId ? (
                        <div style={{ background: 'var(--color-accent-dim)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--color-accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={12} /> {team.problemStatementId.title}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No problem selected yet</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Problems Tab */}
        {activeTab === 'problems' && (
          <motion.div
            key="problems"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Selection Locking Control Panel */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: project.isProblemSelectionLocked ? 'rgba(239,68,68,0.04)' : 'var(--color-accent-dim)',
              border: project.isProblemSelectionLocked ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--color-border)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: project.isProblemSelectionLocked ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)',
                  color: project.isProblemSelectionLocked ? '#ef4444' : '#2563eb',
                  width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {project.isProblemSelectionLocked ? <Lock size={18} /> : <Unlock size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>
                    {project.isProblemSelectionLocked ? 'Problem Selection Locked' : 'Problem Selection Open'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {project.isProblemSelectionLocked
                      ? 'Students cannot select or edit their projects. Only trainers can allocate.'
                      : 'Students can browse, select, and change their projects (up to 3 times).'}
                  </div>
                </div>
              </div>
              <button
                className={project.isProblemSelectionLocked ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}
                onClick={handleToggleLock}
              >
                {project.isProblemSelectionLocked ? 'Unlock Selection' : 'Lock Selection'}
              </button>
            </div>

            {problems.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No problems found"
                description="Make sure you have created problems matching the subject of this course."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {problems.map(p => (
                  <div key={p._id} className="glass" style={{ borderRadius: 12, padding: 16, borderLeft: '3px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{p.problemStatement}</div>
                      </div>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>{p.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid-2-responsive">
              {/* Existing Templates */}
              <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Project Templates</h3>
                {!project.templates || project.templates.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No templates uploaded"
                    description="Upload template documents (Requirements, Design, Schema, Submissions guides) for students in this batch to download and follow."
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {project.templates.map(t => (
                      <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12 }}>
                        <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            Uploaded: {new Date(t.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                            <Download size={13} /> Download
                          </a>
                          <button onClick={() => handleDeleteTemplate(t._id)} className="btn-danger" style={{ padding: '6px 10px', fontSize: 12 }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Form */}
              <div className="glass" style={{ borderRadius: 16, padding: 24, height: 'fit-content' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Upload Template File</h3>
                <form onSubmit={handleUploadTemplate}>
                  <FormField label="Template Display Name" id="template-name">
                    <input
                      id="template-name"
                      className="input-dark"
                      placeholder="e.g. SRS Template Document"
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="Select Document File" id="template-file">
                    <input
                      id="template-file"
                      type="file"
                      className="input-dark"
                      onChange={e => setTemplateFile(e.target.files[0])}
                      required
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                    />
                  </FormField>
                  <button type="submit" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }} disabled={uploading}>
                    {uploading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><UploadCloud size={14} /> Upload Template</>}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title={`Create Team / TL Account`}>
        <CreateTeamForm onSubmit={handleCreateTeam} loading={creating} />
      </Modal>

      {/* Override Modal */}
      <Modal isOpen={overrideModal} onClose={() => setOverrideModal(false)} title={`Admin Override: ${selectedTeam?.name}`} wide>
        {selectedTeam && (
          <OverrideTeamForm
            team={selectedTeam}
            problems={problems}
            onSubmit={handleOverrideTeam}
            loading={overriding}
          />
        )}
      </Modal>
    </div>
  )
}

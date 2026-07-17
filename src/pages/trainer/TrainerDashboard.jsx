import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Building2, Layers, Award, TrendingUp, AlertCircle, CheckCircle, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getDashboard, getTeamMilestones } from '../../services/api'
import { StatCard, StatusBadge, LoadingSpinner } from '../../components/ui'

function TeamDetailPanel({ team, onClose }) {
  const [milestones, setMilestones] = useState([])
  const STAGES = ['Idea Approved', 'Requirements & Schema', 'Development', 'Testing', 'Final Submission']

  useEffect(() => {
    if (team) {
      getTeamMilestones(team._id)
        .then(r => setMilestones(r.data.data))
        .catch(() => {})
    }
  }, [team])

  if (!team) return null

  const statusColor = {
    done: '#10b981', in_progress: '#f59e0b', pending: '#2a2a4a',
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 30 }}
      className="glass"
      style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, zIndex: 200,
        padding: 24, overflowY: 'auto', borderLeft: '1px solid #cbd5e1',
        background: '#ffffff',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {team.name}
        </h3>
        <button onClick={onClose} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 14 }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div className="glass" style={{ borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>College</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>{team.collegeId?.name}</div>
        </div>
        <div className="glass" style={{ borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Batch</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>{team.batchId?.name}</div>
        </div>
        <div className="glass" style={{ borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Lead</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>{team.leadUsername}</div>
        </div>
        <div className="glass" style={{ borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Team Size</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>{(team.members?.length || 0) + 1}</div>
        </div>
      </div>

      {team.problemStatementId && (
        <div className="glass" style={{ borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid rgba(37,99,235,0.15)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Problem Statement</div>
          <div style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 500 }}>{team.problemStatementId.title}</div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#5c5c7b', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Milestones
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STAGES.map((stage, i) => {
            const ms = milestones.find(m => m.stageName === stage)
            const status = ms?.status || 'pending'
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: statusColor[status], flexShrink: 0,
                  boxShadow: status !== 'pending' ? `0 0 8px ${statusColor[status]}` : 'none',
                }} />
                <span style={{ fontSize: 12, color: status === 'pending' ? 'var(--color-text-muted)' : 'var(--color-text-primary)', flex: 1 }}>{stage}</span>
                <StatusBadge status={status} />
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <StatusBadge status={team.isOverdue ? 'overdue' : team.status} />
      </div>
    </motion.div>
  )
}

export default function TrainerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [filter, setFilter] = useState({ college: 'all', batch: 'all', status: 'all' })

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return null

  const filteredTeams = data.teams.filter(t => {
    if (filter.college !== 'all' && t.collegeId?._id !== filter.college) return false
    if (filter.batch !== 'all' && t.batchId?._id !== filter.batch) return false
    if (filter.status !== 'all') {
      const key = t.isOverdue ? 'overdue' : t.status
      if (key !== filter.status) return false
    }
    return true
  })

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: -1 }}>
          Trainer Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 6 }}>
          Cross-college overview — {data.summary.totalColleges} colleges, {data.summary.totalBatches} batches
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Teams" value={data.summary.totalTeams} icon={Users} color="#3b82f6" />
        <StatCard label="Submitted" value={data.summary.submitted} icon={CheckCircle} color="#10b981" sub="Final submission done" />
        <StatCard label="In Progress" value={data.summary.inProgress} icon={TrendingUp} color="#f59e0b" />
        <StatCard label="Pending" value={data.summary.pending} icon={Clock} color="#8b5cf6" sub="Problem not selected" />
        <StatCard label="Overdue" value={data.summary.overdue} icon={AlertCircle} color="#ef4444" sub="Past batch deadline" />
      </div>



      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'college', options: [{ value: 'all', label: 'All Colleges' }, ...data.colleges.map(c => ({ value: c._id, label: c.name }))] },
          { key: 'batch', options: [{ value: 'all', label: 'All Batches' }, ...data.batches.map(b => ({ value: b._id, label: b.name }))] },
          { key: 'status', options: [{ value: 'all', label: 'All Status' }, { value: 'submitted', label: 'Submitted' }, { value: 'in_progress', label: 'In Progress' }, { value: 'problem_pending', label: 'Pending' }, { value: 'overdue', label: 'Overdue' }] },
        ].map(({ key, options }) => (
          <select key={key} className="input-dark" style={{ width: 'auto', flex: '0 0 auto' }} value={filter[key]} onChange={e => setFilter(f => ({ ...f, [key]: e.target.value }))}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {/* Teams table */}
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>All Teams</span>
          <span className="badge badge-blue">{filteredTeams.length} teams</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-dark w-full" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Team</th><th>College</th><th>Batch</th><th>Lead</th><th>Size</th><th>Problem</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map(team => (
                <tr
                  key={team._id}
                  onClick={() => setSelectedTeam(team)}
                  style={{ cursor: 'pointer' }}
                >
                  <td><span style={{ fontWeight: 600 }}>{team.name}</span></td>
                  <td style={{ color: '#a0a0c0' }}>{team.collegeId?.name}</td>
                  <td style={{ color: '#a0a0c0' }}>{team.batchId?.name}</td>
                  <td style={{ color: '#a0a0c0' }}>{team.leadUsername}</td>
                  <td>{(team.members?.length || 0) + 1}</td>
                  <td style={{ color: '#60a5fa', fontSize: 13 }}>
                    {team.problemStatementId?.title ? (
                      <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {team.problemStatementId.title}
                      </span>
                    ) : <span style={{ color: '#5c5c7b' }}>—</span>}
                  </td>
                  <td><StatusBadge status={team.isOverdue ? 'overdue' : team.status} /></td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#5c5c7b', padding: 32 }}>No teams found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Detail Side Panel */}
      <AnimatePresence>
        {selectedTeam && (
          <TeamDetailPanel team={selectedTeam} onClose={() => setSelectedTeam(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

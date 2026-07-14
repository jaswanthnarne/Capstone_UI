import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, Zap, AlertCircle, Lightbulb, FileText, Code2, Search, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyMilestones, updateMyMilestone } from '../../services/api'
import { LoadingSpinner } from '../../components/ui'
import MilestoneConstellation from '../../components/three/MilestoneConstellation'

const STAGES = [
  { name: 'Idea Approved', icon: Lightbulb, desc: 'Team concept and project idea approved by trainer' },
  { name: 'Requirements & Schema', icon: FileText, desc: 'Requirements documented, DB schema designed' },
  { name: 'Development', icon: Code2, desc: 'Core application development in progress' },
  { name: 'Testing', icon: Search, desc: 'Unit, integration, and UAT testing complete' },
  { name: 'Final Submission', icon: Send, desc: 'All deliverables submitted and ready for review' },
]

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'var(--color-text-secondary)', bg: 'rgba(100,116,139,0.08)', icon: Clock },
  in_progress: { label: 'In Progress', color: '#ea580c', bg: 'rgba(234,88,12,0.08)', icon: Zap },
  done: { label: 'Done', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: Check },
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [notes, setNotes] = useState({})
  const [activeStage, setActiveStage] = useState(null)

  const load = () => {
    setLoading(true)
    getMyMilestones()
      .then(r => {
        setMilestones(r.data.data)
        const n = {}
        r.data.data.forEach(m => { n[m.stageName] = m.notes || '' })
        setNotes(n)
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleUpdate = async (stageName, status) => {
    setUpdating(stageName)
    try {
      await updateMyMilestone({ stageName, status, notes: notes[stageName] || '' })
      toast.success(`${stageName}: ${status}`)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update') }
    finally { setUpdating(null) }
  }

  const getMs = (name) => milestones.find(m => m.stageName === name)

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: -1 }}>Milestones</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 6 }}>
          Track your project progress through 5 stages
        </p>
      </div>

      {/* 3D Milestone Constellation Visualizer */}
      <MilestoneConstellation
        stages={STAGES.map(stage => {
          const ms = getMs(stage.name)
          const status = ms?.status || 'pending'
          return {
            label: stage.name,
            status: status === 'done' ? 'done' : status === 'in_progress' ? 'current' : 'pending'
          }
        })}
        onStageClick={(stageName) => {
          const index = STAGES.findIndex(s => s.name === stageName)
          if (index !== -1) {
            setActiveStage(stageName)
            const el = document.getElementById(`milestone-${index}`)
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }}
      />

      {/* Stage cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {STAGES.map((stage, i) => {
          const ms = getMs(stage.name)
          const status = ms?.status || 'pending'
          const cfg = STATUS_CONFIG[status]
          const isActive = activeStage === stage.name
          const StageIcon = stage.icon

          return (
            <motion.div
              key={stage.name}
              id={`milestone-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass"
              style={{
                borderRadius: 14, padding: 20,
                border: isActive ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${status === 'pending' ? 'var(--color-surface-3)' : cfg.color}`,
                boxShadow: isActive ? '0 4px 20px rgba(37,99,235,0.08)' : 'none',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Stage number/status */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: status === 'pending' ? '#f1f5f9' : cfg.bg,
                  border: `2px solid ${status === 'pending' ? '#cbd5e1' : cfg.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: status === 'pending' ? 'var(--color-text-secondary)' : cfg.color
                }}>
                  {status === 'done' ? <Check size={18} /> : <StageIcon size={18} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Stage {i + 1}: {stage.name}
                    </div>
                    <span style={{ background: status === 'pending' ? '#e2e8f0' : cfg.bg, color: status === 'pending' ? 'var(--color-text-secondary)' : cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>{stage.desc}</div>

                  {ms?.updatedAt && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                      Last updated: {new Date(ms.updatedAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Notes */}
                  <div style={{ marginBottom: 12 }}>
                    <textarea
                      className="input-dark"
                      rows={2}
                      placeholder="Add notes for this stage..."
                      style={{ resize: 'vertical', fontSize: 12 }}
                      value={notes[stage.name] || ''}
                      onChange={e => setNotes(n => ({ ...n, [stage.name]: e.target.value }))}
                    />
                  </div>

                  {/* Status buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['pending', 'in_progress', 'done'].map(s => {
                      const BtnIcon = STATUS_CONFIG[s].icon
                      return (
                        <button
                          key={s}
                          id={`ms-${i}-${s}`}
                          onClick={() => handleUpdate(stage.name, s)}
                          disabled={updating === stage.name}
                          style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            background: status === s ? STATUS_CONFIG[s].bg : 'rgba(0,0,0,0.03)',
                            color: status === s ? STATUS_CONFIG[s].color : 'var(--color-text-secondary)',
                            outline: status === s ? `1px solid ${STATUS_CONFIG[s].color}40` : 'none',
                            transition: 'all 0.2s',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <BtnIcon size={12} />
                          <span>{updating === stage.name ? '...' : STATUS_CONFIG[s].label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

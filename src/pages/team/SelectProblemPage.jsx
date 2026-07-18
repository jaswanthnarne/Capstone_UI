import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle, AlertCircle, Edit3, HelpCircle, Award, Sparkles, Download, X, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAvailableProblems, selectProblem, getMyTeam } from '../../services/api'
import { LoadingSpinner, EmptyState, Modal } from '../../components/ui'
import { exportProblemExcel } from '../../utils/excelExport'

const DIFF_CONFIG = {
  beginner: { color: '#16a34a', label: 'Beginner', bg: 'rgba(22,163,74,0.08)' },
  intermediate: { color: '#ea580c', label: 'Intermediate', bg: 'rgba(234,88,12,0.08)' },
  advanced: { color: '#dc2626', label: 'Advanced', bg: 'rgba(220,38,38,0.08)' }
}

const downloadProblemTxt = (problem) => {
  const text = `==================================================
PROJECT TITLE: ${problem.title}
==================================================
Difficulty: ${problem.difficulty.toUpperCase()}
Subject: ${problem.subjectId?.name || 'Global'}

[PROBLEM STATEMENT]
${problem.problemStatement}

[DESCRIPTION]
${problem.description}

[EXPECTED OUTPUT]
${problem.expectedOutput}

[KEY OUTCOME]
${problem.outcome}

[SUGGESTED TECH STACK]
${(problem.suggestedTech || []).join(', ') || 'N/A'}

--------------------------------------------------
Generated from Ethnotech ProjectSpace on ${new Date().toLocaleString()}
==================================================`;

  const element = document.createElement("a");
  const file = new Blob([text], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `${problem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_details.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function ProblemCard({ problem, onClick, currentProblemId }) {
  const diff = DIFF_CONFIG[problem.difficulty] || { color: '#64748b', label: problem.difficulty, bg: 'rgba(100,116,139,0.08)' }
  const isLocked = problem.isLocked
  const isSelectedBySelf = currentProblemId && currentProblemId === problem._id
  const capacityReached = problem.selectedCount >= 3

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => onClick(problem)}
      className="glass card-lift"
      style={{
        borderRadius: 16,
        padding: '20px 24px',
        background: isSelectedBySelf 
          ? 'var(--color-accent-dim)' 
          : '#ffffff',
        border: isSelectedBySelf
          ? '1px solid rgba(37,99,235,0.4)'
          : '1px solid rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${isSelectedBySelf ? 'var(--color-accent)' : isLocked ? 'var(--color-surface-3)' : diff.color}`,
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.4 }}>
            {problem.title}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <span style={{ background: diff.bg, color: diff.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              {diff.label}
            </span>
            <span style={{ fontSize: 12, color: capacityReached ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: 500 }}>
              Allocated: {problem.selectedCount || 0}/3 teams
            </span>
          </div>
        </div>
        {isSelectedBySelf && (
          <span className="badge badge-blue" style={{ flexShrink: 0 }}>Active</span>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {problem.problemStatement}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 10, marginTop: 4 }}>
        <span>Click to view details & download</span>
        <span>{problem.subjectId?.name || 'Global'}</span>
      </div>
    </motion.div>
  )
}

function ProblemDetailsModal({ problem, onClose, onSelect, selecting, disabled, isSelectedBySelf }) {
  if (!problem) return null;
  const diff = DIFF_CONFIG[problem.difficulty] || { color: '#64748b', label: problem.difficulty, bg: 'rgba(100,116,139,0.08)' };
  const isLocked = problem.isLocked;

  return (
    <Modal isOpen={!!problem} onClose={onClose} title={problem.title} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Meta badges info bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 14 }}>
          <span style={{ background: diff.bg, color: diff.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {diff.label} Difficulty
          </span>
          <span className="badge badge-purple" style={{ fontSize: 11 }}>
            {problem.subjectId?.name || 'Global'}
          </span>
          <span style={{ fontSize: 13, color: 'var(--color-text-primary)', marginLeft: 'auto' }}>
            Allocated: <strong>{problem.selectedCount || 0}/3 teams</strong>
          </span>
        </div>

        {/* Problem specification details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Problem Statement</div>
            <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{problem.problemStatement}</p>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Detailed Description</div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{problem.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Expected Output / Deliverables</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{problem.expectedOutput}</p>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Learning Outcomes</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{problem.outcome}</p>
            </div>
          </div>

          {problem.suggestedTech?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Suggested Stack</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {problem.suggestedTech.map(t => <span key={t} className="badge badge-blue" style={{ fontSize: 11, padding: '4px 10px' }}>{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 18 }}>
          <button className="btn-secondary" onClick={() => downloadProblemTxt(problem)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Download size={16} /> Download Specs (.txt)
          </button>
          <button className="btn-secondary" onClick={() => exportProblemExcel(problem, [])} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Download size={16} /> Export Specs (Excel)
          </button>
          
          <div style={{ flex: 1 }} />
          
          {isSelectedBySelf ? (
            <span style={{ fontSize: 14, color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8 }}>
              <CheckCircle size={18} /> Active Selected Project
            </span>
          ) : isLocked ? (
            <span style={{ fontSize: 14, color: 'var(--color-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8 }}>
              <Lock size={18} /> Capacity Full (3/3 Teams)
            </span>
          ) : (
            !disabled && (
              <button
                className="btn-primary"
                style={{ padding: '10px 24px', fontWeight: 600 }}
                onClick={() => onSelect(problem)}
                disabled={selecting}
              >
                {selecting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Select This Project'}
              </button>
            )
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function SelectProblemPage() {
  const [problems, setProblems] = useState([])
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [confirmed, setConfirmed] = useState(null)
  const [viewingProblem, setViewingProblem] = useState(null)
  const [isBrowsing, setIsBrowsing] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([getAvailableProblems(), getMyTeam()])
      .then(([p, t]) => {
        setProblems(p.data.data)
        setTeam(t.data.data)
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to load project details');
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelect = (problem) => {
    setConfirmed(problem)
  }

  const confirmSelect = async () => {
    if (!confirmed) return
    setSelecting(true)
    try {
      await selectProblem(confirmed._id)
      toast.success(`Project "${confirmed.title}" successfully selected!`)
      setConfirmed(null)
      setViewingProblem(null)
      setIsBrowsing(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Selection failed')
    } finally {
      setSelecting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const activeProblem = team?.problemStatementId
  const changesUsed = team?.problemChangeCount || 0
  const isLockedByBatch = !!team?.batchId?.isProblemSelectionLocked
  const changesExceeded = changesUsed >= 3

  const canSelect = !isLockedByBatch && !changesExceeded
  const showList = !activeProblem || isBrowsing

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 10px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          <Award size={14} /> Capstone Project Allocation
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          Select Problem Statement
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, marginTop: 6, lineHeight: 1.5 }}>
          Browse available real-world projects and select a problem statement for your team. You can change your choice up to 3 times before lock.
        </p>
      </div>

      {/* 1. Selection Status Card */}
      {isLockedByBatch ? (
        <div className="glass" style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 16, padding: 20, marginBottom: 28, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--color-danger)', width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-danger)' }}>Problem Selection Locked by Admin</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3 }}>The trainer has locked problem allocations for this batch. To request modifications, please contact your trainer directly.</div>
          </div>
        </div>
      ) : changesExceeded ? (
        <div className="glass" style={{ background: 'rgba(234,88,12,0.04)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: 16, padding: 20, marginBottom: 28, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ background: 'rgba(234,88,12,0.1)', color: 'var(--color-warning)', width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-warning)' }}>Problem Selection Limit Reached</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3 }}>You have used all 3 of your allowed selection attempts. Only the trainer can manually override or change your problem statement now.</div>
          </div>
        </div>
      ) : null}

      {/* Active Selection Details Card */}
      {activeProblem && !isBrowsing && (
        <div className="glass card-lift" style={{ borderRadius: 18, border: '1px solid rgba(37,99,235,0.25)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.02) 100%)', padding: '20px 24px', borderBottom: '1px solid rgba(37,99,235,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected Capstone Project</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>{activeProblem.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginRight: 8 }}>Attempts used: <strong>{changesUsed}/3</strong></span>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => downloadProblemTxt(activeProblem)}>
                  <Download size={14} /> Specs
                </button>
                {canSelect && (
                  <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setIsBrowsing(true)}>
                    <Edit3 size={14} /> Change Project
                  </button>
                )}
              </div>
            </div>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Problem Description</div>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>{activeProblem.description}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Expected Deliverables</div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{activeProblem.expectedOutput}</p>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Outcome</div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{activeProblem.outcome}</p>
              </div>
            </div>

            {activeProblem.suggestedTech?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Suggested Stack</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {activeProblem.suggestedTech.map(t => <span key={t} className="badge badge-blue" style={{ fontSize: 11, padding: '4px 10px' }}>{t}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. List of Available Problems */}
      {showList && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {activeProblem ? 'Choose a New Problem Statement' : 'Available Problem Statements'}
            </h3>
            {activeProblem && (
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setIsBrowsing(false)}>
                ← Return to Choice
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: 20 }}>
            {problems.length === 0 ? (
              <EmptyState icon={AlertCircle} title="No problems available" description="No problem statements have been added for your batch's subject yet." />
            ) : (
              problems.map(p => (
                <ProblemCard
                  key={p._id}
                  problem={p}
                  onClick={setViewingProblem}
                  currentProblemId={activeProblem?._id}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Card Details Modal Overlay */}
      {viewingProblem && (
        <ProblemDetailsModal
          problem={viewingProblem}
          onClose={() => setViewingProblem(null)}
          onSelect={handleSelect}
          selecting={selecting}
          disabled={!canSelect}
          isSelectedBySelf={activeProblem?._id === viewingProblem._id}
        />
      )}

      {/* Confirm Selection Modal */}
      {confirmed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 501,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div className="glass" style={{ borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', border: '1px solid rgba(37,99,235,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-accent-dim)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 22 }}>
              <HelpCircle size={24} />
            </div>
            
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>Confirm Selection</div>
            
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>You are about to select the following project:</div>
            
            <div className="glass" style={{ borderRadius: 12, padding: 16, marginBottom: 20, borderLeft: '4px solid var(--color-accent)', background: 'var(--color-accent-dim)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{confirmed.title}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{confirmed.problemStatement}</div>
            </div>

            <div className="glass" style={{ background: 'rgba(234,88,12,0.04)', border: '1px solid rgba(234,88,12,0.15)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-warning)' }}>Allocation Attempts: Attempt {changesUsed + 1} of 3</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
                    {changesUsed + 1 === 3 
                      ? '⚠️ Warning: This is your final change attempt. After this, you cannot change your project again without trainer override.'
                      : 'You can change your problem statement up to 3 times before selection is finalized or locked.'
                    }
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={() => setConfirmed(null)}>
                Cancel
              </button>
              <button id="confirm-select-btn" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }} onClick={confirmSelect} disabled={selecting}>
                {selecting ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Confirm Choice'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

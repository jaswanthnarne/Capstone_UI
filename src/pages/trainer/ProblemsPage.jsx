import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, FileText, Tag, Download, X, AlertCircle, Sparkles, ChevronRight, CheckCircle, Code2, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProblems, getSubjects, createProblem, updateProblem, deleteProblem } from '../../services/api'
import { Modal, FormField, EmptyState, SectionHeader, LoadingSpinner } from '../../components/ui'
import { exportAllProblemsExcel, exportProblemExcel } from '../../utils/excelExport'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const DIFF_CONFIG = {
  beginner: { color: '#10B981', label: 'Beginner', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  intermediate: { color: '#F59E0B', label: 'Intermediate', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  advanced: { color: '#EF4444', label: 'Advanced', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
}

const downloadProblemTxt = (problem) => {
  const text = `==================================================
PROJECT TITLE: ${problem.title}
==================================================
Difficulty: ${problem.difficulty.toUpperCase()}
Subject: ${problem.subjectId?.name || 'Global'}
Is Global: ${problem.isGlobal ? 'Yes' : 'No'}

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

[TAGS]
${(problem.tags || []).join(', ') || 'N/A'}

--------------------------------------------------
Generated from Ethnotech ProjectSpace on ${new Date().toLocaleString()}
==================================================`;

  const element = document.createElement("a");
  const file = new Blob([text], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `${problem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_specs.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function ProblemForm({ initial, subjects, onSubmit, loading }) {
  const [form, setForm] = useState(initial
    ? { ...initial, subjectId: initial.subjectId?._id || initial.subjectId || '', suggestedTech: (initial.suggestedTech || []).join(', '), tags: (initial.tags || []).join(', ') }
    : { title: '', problemStatement: '', description: '', expectedOutput: '', outcome: '', suggestedTech: '', tags: '', subjectId: '', isGlobal: false, difficulty: 'intermediate' }
  )
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, suggestedTech: form.suggestedTech.split(',').map(s => s.trim()).filter(Boolean), tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) }) }}>
      <FormField label="Problem Title" id="prob-title">
        <input id="prob-title" className="input-dark" placeholder="e.g. AI-Powered Inventory Analytics Dashboard" value={form.title} onChange={e => set('title', e.target.value)} required />
      </FormField>
      <FormField label="Short Abstract / Problem Statement" id="prob-short">
        <textarea id="prob-short" className="input-dark" rows={2} placeholder="One-line executive summary of the problem..." value={form.problemStatement} onChange={e => set('problemStatement', e.target.value)} required style={{ resize: 'vertical' }} />
      </FormField>
      <FormField label="Detailed Description & Requirements" id="prob-desc">
        <textarea id="prob-desc" className="input-dark" rows={4} placeholder="Detailed problem specs, business context, and scope..." value={form.description} onChange={e => set('description', e.target.value)} required style={{ resize: 'vertical' }} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Expected Deliverables / Output" id="prob-output">
          <textarea id="prob-output" className="input-dark" rows={2} placeholder="e.g. Deployed Web App, REST API, Documentation" value={form.expectedOutput} onChange={e => set('expectedOutput', e.target.value)} required style={{ resize: 'vertical' }} />
        </FormField>
        <FormField label="Target Learning Outcome" id="prob-outcome">
          <textarea id="prob-outcome" className="input-dark" rows={2} placeholder="e.g. Full-stack development, ML model deployment" value={form.outcome} onChange={e => set('outcome', e.target.value)} required style={{ resize: 'vertical' }} />
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Associated Course / Subject" id="prob-subject">
          <select id="prob-subject" className="input-dark" value={form.subjectId} onChange={e => set('subjectId', e.target.value)}>
            <option value="">Global (usable across all subjects)</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Difficulty Rating" id="prob-difficulty">
          <select id="prob-difficulty" className="input-dark" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Suggested Tech Stack (comma-separated)" id="prob-tech">
        <input id="prob-tech" className="input-dark" placeholder="React, Node.js, MongoDB, Tailwind" value={form.suggestedTech} onChange={e => set('suggestedTech', e.target.value)} />
      </FormField>
      <FormField label="Topic Tags (comma-separated)" id="prob-tags">
        <input id="prob-tags" className="input-dark" placeholder="ai, analytics, web, cloud" value={form.tags} onChange={e => set('tags', e.target.value)} />
      </FormField>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <input id="prob-global" type="checkbox" style={{ width: 16, height: 16, accentColor: '#3b82f6' }} checked={form.isGlobal} onChange={e => set('isGlobal', e.target.checked)} />
        <label htmlFor="prob-global" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Global Pool (usable across all colleges & courses)</label>
      </div>
      <button type="submit" id="save-problem-btn" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Problem Statement'}
      </button>
    </form>
  )
}

// Expandable Impact-Style Problem Card Component
function ExpandableProblemCard({ problem, onClick, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const diff = DIFF_CONFIG[problem.difficulty] || { color: '#64748b', label: problem.difficulty, bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass"
      style={{
        borderRadius: 18,
        padding: '20px 24px',
        borderLeft: `5px solid ${diff.color}`,
        background: 'var(--color-surface-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}
    >
      {/* Top Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              {problem.title}
            </span>
            <span style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}`, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {diff.label}
            </span>
            {problem.isGlobal ? (
              <span className="badge badge-purple" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Globe size={10} /> Global Pool
              </span>
            ) : (
              problem.subjectId && (
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 6 }}>
                  {problem.subjectId.name}
                </span>
              )
            )}
          </div>
          
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '8px 0 0', display: isExpanded ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {problem.problemStatement}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onEdit(problem)} title="Edit Problem">
            <Edit size={13} />
          </button>
          <button className="btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onDelete(problem._id)} title="Delete Problem">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Detailed Overview</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {problem.description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Expected Output</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{problem.expectedOutput}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Learning Outcome</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{problem.outcome}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tech Stack Chips & Footer Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {problem.suggestedTech?.length > 0 && problem.suggestedTech.map(t => (
            <span key={t} className="badge badge-blue" style={{ fontSize: 10, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Code2 size={10} /> {t}
            </span>
          ))}
          {problem.tags?.length > 0 && problem.tags.map(t => (
            <span key={t} style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
              #{t}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => onClick(problem)}
          >
            <Sparkles size={12} /> Full Specs & Export
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => downloadProblemTxt(problem)}
            title="Download TXT Specs"
          >
            <Download size={12} /> TXT
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ProblemDetailsModal({ problem, onClose }) {
  if (!problem) return null;
  const diff = DIFF_CONFIG[problem.difficulty] || { color: '#64748b', label: problem.difficulty, bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)' };

  return (
    <Modal isOpen={!!problem} onClose={onClose} title={`Problem Specification: ${problem.title}`} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Meta badges bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 }}>
          <span style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}`, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {diff.label} Difficulty
          </span>
          <span className="badge badge-purple" style={{ fontSize: 12 }}>
            Course: {problem.subjectId?.name || 'Global Pool'}
          </span>
          {problem.isGlobal && (
            <span className="badge badge-purple" style={{ fontSize: 12 }}>Global Pool Available</span>
          )}
        </div>

        {/* Detailed Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Problem Abstract</div>
            <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{problem.problemStatement}</p>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>Detailed Specifications</div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{problem.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Expected Output & Deliverables</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{problem.expectedOutput}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Target Learning Outcomes</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{problem.outcome}</p>
            </div>
          </div>

          {problem.suggestedTech?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Suggested Technology Stack</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {problem.suggestedTech.map(t => <span key={t} className="badge badge-blue" style={{ fontSize: 11, padding: '4px 10px' }}>{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
          <button className="btn-secondary" onClick={() => downloadProblemTxt(problem)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Download size={16} /> Download Specs (.txt)
          </button>
          <button className="btn-secondary" onClick={() => exportProblemExcel(problem, [])} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Download size={16} /> Export Specs (Excel)
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-primary" onClick={onClose} style={{ padding: '10px 24px' }}>
            Close View
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: null, data: null })
  const [filter, setFilter] = useState({ subjectId: '', difficulty: '' })
  const [viewingProblem, setViewingProblem] = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (filter.subjectId) params.subjectId = filter.subjectId
    if (filter.difficulty) params.difficulty = filter.difficulty
    Promise.all([getProblems(params), getSubjects()])
      .then(([p, s]) => { setProblems(p.data.data); setSubjects(s.data.data) })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to load problem pool');
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      modal.mode === 'create' ? await createProblem(form) : await updateProblem(modal.data._id, form)
      toast.success(modal.mode === 'create' ? 'Problem statement created!' : 'Problem statement updated!')
      setModal({ open: false }); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save problem statement') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem statement from the global pool?')) return
    try { await deleteProblem(id); toast.success('Problem deleted!'); load() } catch { toast.error('Failed to delete problem') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <SectionHeader
        title="Problem Statement Pool"
        subtitle={`${problems.length} capstone problem statement${problems.length !== 1 ? 's' : ''} available for allocation`}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => exportAllProblemsExcel(problems)}>
              <Download size={16} /> Export Problems (Excel)
            </button>
            <button id="add-problem-btn" className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}>
              <Plus size={16} /> Add Problem Statement
            </button>
          </div>
        }
      />

      {/* Filter Selector Bar */}
      <div className="glass" style={{ borderRadius: 16, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', background: 'var(--color-surface-2)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag size={14} style={{ color: 'var(--color-accent)' }} /> Filter Pool:
        </div>
        <select className="input-dark" style={{ width: 'auto' }} value={filter.subjectId} onChange={e => setFilter(f => ({ ...f, subjectId: e.target.value }))}>
          <option value="">All Courses & Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="input-dark" style={{ width: 'auto' }} value={filter.difficulty} onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Problem Cards List */}
      {problems.length === 0 ? (
        <EmptyState icon={FileText} title="No problems found" description="Create problem statements for capstone teams to select from." action={<button className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}><Plus size={14}/> Add Problem</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          <AnimatePresence>
            {problems.map(p => (
              <ExpandableProblemCard
                key={p._id}
                problem={p}
                onClick={setViewingProblem}
                onEdit={d => setModal({ open: true, mode: 'edit', data: d })}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Viewing & Editing Modals */}
      {viewingProblem && (
        <ProblemDetailsModal
          problem={viewingProblem}
          onClose={() => setViewingProblem(null)}
        />
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Add Problem Statement' : 'Edit Problem Statement'} wide>
        <ProblemForm initial={modal.data} subjects={subjects} onSubmit={handleSave} loading={saving} />
      </Modal>
    </div>
  )
}

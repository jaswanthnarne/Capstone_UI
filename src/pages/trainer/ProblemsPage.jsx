import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, FileText, Tag, Download, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProblems, getSubjects, createProblem, updateProblem, deleteProblem } from '../../services/api'
import { Modal, FormField, EmptyState, SectionHeader, LoadingSpinner } from '../../components/ui'
import { exportAllProblemsExcel, exportProblemExcel } from '../../utils/excelExport'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
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
Generated from CapstoneHub on ${new Date().toLocaleString()}
==================================================`;

  const element = document.createElement("a");
  const file = new Blob([text], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `${problem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_details.txt`;
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
      <FormField label="Title" id="prob-title"><input id="prob-title" className="input-dark" placeholder="Problem title" value={form.title} onChange={e => set('title', e.target.value)} required /></FormField>
      <FormField label="Short Problem Statement" id="prob-short"><textarea id="prob-short" className="input-dark" rows={2} placeholder="One-liner problem description..." value={form.problemStatement} onChange={e => set('problemStatement', e.target.value)} required style={{ resize: 'vertical' }} /></FormField>
      <FormField label="Detailed Description" id="prob-desc"><textarea id="prob-desc" className="input-dark" rows={4} placeholder="Detailed requirements..." value={form.description} onChange={e => set('description', e.target.value)} required style={{ resize: 'vertical' }} /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Expected Output" id="prob-output"><textarea id="prob-output" className="input-dark" rows={2} placeholder="What should it produce?" value={form.expectedOutput} onChange={e => set('expectedOutput', e.target.value)} required style={{ resize: 'vertical' }} /></FormField>
        <FormField label="Learning Outcome" id="prob-outcome"><textarea id="prob-outcome" className="input-dark" rows={2} placeholder="What will students learn?" value={form.outcome} onChange={e => set('outcome', e.target.value)} required style={{ resize: 'vertical' }} /></FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Subject" id="prob-subject">
          <select id="prob-subject" className="input-dark" value={form.subjectId} onChange={e => set('subjectId', e.target.value)}>
            <option value="">None (global)</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Difficulty" id="prob-difficulty">
          <select id="prob-difficulty" className="input-dark" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Suggested Tech (comma-separated)" id="prob-tech"><input id="prob-tech" className="input-dark" placeholder="React, Node.js, MongoDB" value={form.suggestedTech} onChange={e => set('suggestedTech', e.target.value)} /></FormField>
      <FormField label="Tags (comma-separated)" id="prob-tags"><input id="prob-tags" className="input-dark" placeholder="e-commerce, fullstack, api" value={form.tags} onChange={e => set('tags', e.target.value)} /></FormField>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <input id="prob-global" type="checkbox" style={{ width: 16, height: 16, accentColor: '#3b82f6' }} checked={form.isGlobal} onChange={e => set('isGlobal', e.target.checked)} />
        <label htmlFor="prob-global" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Global (usable across all subjects)</label>
      </div>
      <button type="submit" id="save-problem-btn" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Problem Statement'}
      </button>
    </form>
  )
}

function ProblemCard({ problem, onClick, onEdit, onDelete }) {
  const diff = DIFF_CONFIG[problem.difficulty] || { color: '#64748b', label: problem.difficulty, bg: 'rgba(100,116,139,0.08)' }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="glass card-lift"
      style={{
        borderRadius: 16,
        padding: '18px 22px',
        borderLeft: `4px solid ${diff.color}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative'
      }}
      onClick={() => onClick(problem)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{problem.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <span style={{ background: diff.bg, color: diff.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{diff.label}</span>
            {problem.isGlobal && <span className="badge badge-purple" style={{ fontSize: 10 }}>Global</span>}
            {problem.subjectId && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{problem.subjectId.name}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button id={`edit-prob-${problem._id}`} className="btn-secondary" style={{ padding: '5px 10px' }} onClick={() => onEdit(problem)}><Edit size={12} /></button>
          <button id={`del-prob-${problem._id}`} className="btn-danger" style={{ padding: '5px 10px' }} onClick={() => onDelete(problem._id)}><Trash2 size={12} /></button>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {problem.problemStatement}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 10 }}>
        <span>Click card to view details & download TXT</span>
        {problem.suggestedTech?.length > 0 && (
          <span style={{ display: 'flex', gap: 4 }}>
            {problem.suggestedTech.slice(0, 3).map(t => <span key={t} className="badge badge-blue" style={{ fontSize: 9, padding: '2px 6px' }}>{t}</span>)}
            {problem.suggestedTech.length > 3 && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{problem.suggestedTech.length - 3}</span>}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function ProblemDetailsModal({ problem, onClose }) {
  if (!problem) return null;
  const diff = DIFF_CONFIG[problem.difficulty] || { color: '#64748b', label: problem.difficulty, bg: 'rgba(100,116,139,0.08)' };

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
          {problem.isGlobal && (
            <span className="badge badge-purple" style={{ fontSize: 11 }}>Global Pool</span>
          )}
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

          {problem.tags?.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Tags</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {problem.tags.map(t => <span key={t} className="badge badge-secondary" style={{ fontSize: 11, padding: '3px 8px' }}>#{t}</span>)}
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
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      modal.mode === 'create' ? await createProblem(form) : await updateProblem(modal.data._id, form)
      toast.success(modal.mode === 'create' ? 'Problem created!' : 'Problem updated!')
      setModal({ open: false }); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this problem statement?')) return
    try { await deleteProblem(id); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <SectionHeader
        title="Problem Statement Pool"
        subtitle={`${problems.length} problem${problems.length !== 1 ? 's' : ''} available`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => exportAllProblemsExcel(problems)}>
              <Download size={16} /> Export Problems (Excel)
            </button>
            <button id="add-problem-btn" className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}>
              <Plus size={16} /> Add Problem
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="input-dark" style={{ width: 'auto' }} value={filter.subjectId} onChange={e => setFilter(f => ({ ...f, subjectId: e.target.value }))}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="input-dark" style={{ width: 'auto' }} value={filter.difficulty} onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))}>
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {problems.length === 0 ? (
        <EmptyState icon={FileText} title="No problems yet" description="Create problem statements for teams to select from." action={<button className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}><Plus size={14}/> Add Problem</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <AnimatePresence>
            {problems.map(p => (
              <ProblemCard
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

      {/* Modal for viewing detailed specs and downloading */}
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

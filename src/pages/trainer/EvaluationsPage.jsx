import { useState, useEffect } from 'react'
import { Award, Star, Filter, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAllEvaluations, getAllSubmissions, upsertEvaluation, getColleges, getSubjects, getBatches } from '../../services/api'
import { Modal, FormField, EmptyState, SectionHeader, LoadingSpinner } from '../../components/ui'

function EvalForm({ submission, existing, onSubmit, loading }) {
  const [form, setForm] = useState({
    submissionId: submission._id,
    score: existing?.score || 0,
    feedback: existing?.feedback || '',
    criteria: existing?.criteria || { codeQuality: 0, functionality: 0, documentation: 0, presentation: 0 },
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setCriteria = (k, v) => setForm(f => ({ ...f, criteria: { ...f.criteria, [k]: Number(v) } }))

  const totalFromCriteria = Object.values(form.criteria).reduce((a, b) => a + b, 0)

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <div className="glass" style={{ borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{submission.teamId?.name}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{submission.teamId?.leadUsername}</div>
        {submission.githubUrl && <a href={submission.githubUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-accent)', display: 'block', marginTop: 6 }}>🔗 Frontend GitHub Repo</a>}
        {submission.backendGithubUrl && <a href={submission.backendGithubUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-accent)', display: 'block', marginTop: 2 }}>🔗 Backend GitHub Repo</a>}
        {submission.deployedUrl && <a href={submission.deployedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#16a34a', display: 'block', marginTop: 2 }}>🌐 Deployed App</a>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>Criteria Scores (25 pts each)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.keys(form.criteria).map(k => (
            <div key={k}>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>{k.replace(/([A-Z])/g, ' $1')}</span>
                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{form.criteria[k]}/25</span>
              </label>
              <input type="range" min={0} max={25} step={1} value={form.criteria[k]} onChange={e => setCriteria(k, e.target.value)} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'right', marginTop: 8, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Total: <span className="gradient-text">{totalFromCriteria}/100</span>
        </div>
      </div>

      <FormField label="Overall Score (0–100)" id="eval-score">
        <input id="eval-score" className="input-dark" type="number" min={0} max={100} value={form.score} onChange={e => set('score', Number(e.target.value))} required />
      </FormField>
      <FormField label="Feedback" id="eval-feedback">
        <textarea id="eval-feedback" className="input-dark" rows={4} placeholder="Write your evaluation feedback..." value={form.feedback} onChange={e => set('feedback', e.target.value)} style={{ resize: 'vertical' }} />
      </FormField>

      <button type="submit" id="save-eval-btn" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Evaluation'}
      </button>
    </form>
  )
}

export default function EvaluationsPage() {
  const [colleges, setColleges] = useState([])
  const [subjects, setSubjects] = useState([])
  const [batches, setBatches] = useState([])

  const [selectedCollegeId, setSelectedCollegeId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')

  const [submissions, setSubmissions] = useState([])
  const [evals, setEvals] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, submission: null })

  const loadMetadata = () => {
    setLoading(true)
    Promise.all([getColleges(), getSubjects(), getBatches()])
      .then(([c, s, b]) => {
        setColleges(c.data.data)
        setSubjects(s.data.data)
        setBatches(b.data.data)
      })
      .catch(() => toast.error('Failed to load project details'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadMetadata() }, [])

  const loadSubmissions = () => {
    if (selectedBatchId) {
      setDataLoading(true)
      Promise.all([
        getAllSubmissions({ batchId: selectedBatchId }),
        getAllEvaluations({ batchId: selectedBatchId })
      ])
        .then(([s, e]) => {
          setSubmissions(s.data.data)
          setEvals(e.data.data)
        })
        .catch(() => toast.error('Failed to load submissions and evaluations'))
        .finally(() => setDataLoading(false))
    } else {
      setSubmissions([])
      setEvals([])
    }
  }

  useEffect(() => { loadSubmissions() }, [selectedBatchId])

  const getEval = (subId) => evals.find(e => e.submissionId?._id === subId || e.submissionId === subId)

  const handleSave = async (form) => {
    setSaving(true)
    try {
      await upsertEvaluation(form)
      toast.success('Evaluation saved!')
      setModal({ open: false })
      loadSubmissions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Filter available batches dropdown based on selected college & subject
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

  return (
    <div>
      <SectionHeader title="Evaluations" subtitle="Evaluate capstone deliverables by selecting project details" />

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

      {/* Main content body */}
      {!selectedBatchId ? (
        <div className="glass" style={{ borderRadius: 16, padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <AlertCircle size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>No batch selected</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Select a college, course, and batch using the filters above to load project submissions.</div>
        </div>
      ) : dataLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><LoadingSpinner /></div>
      ) : submissions.length === 0 ? (
        <EmptyState icon={Award} title="No submissions yet" description="Teams in this batch will appear here once they submit their projects." />
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-dark w-full" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>Team</th><th>Batch</th><th>Links</th><th>Submitted</th><th>Score</th><th>Action</th></tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  const ev = getEval(sub._id)
                  return (
                    <tr key={sub._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sub.teamId?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub.teamId?.leadUsername}</div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{sub.batchId?.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {sub.githubUrl && (
                            <a href={sub.githubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontSize: 12 }}>
                              Frontend Repo →
                            </a>
                          )}
                          {sub.backendGithubUrl && (
                            <a href={sub.backendGithubUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontSize: 12 }}>
                              Backend Repo →
                            </a>
                          )}
                          {sub.deployedUrl && (
                            <a href={sub.deployedUrl} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontSize: 12 }}>
                              Deployed →
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {new Date(sub.submittedAt).toLocaleDateString()}
                        {sub.isLate && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>Late</span>}
                      </td>
                      <td>
                        {ev ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Star size={14} style={{ color: '#ea580c' }} />
                            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 16 }}>{ev.score}</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>/100</span>
                          </div>
                        ) : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Not evaluated</span>}
                      </td>
                      <td>
                        <button
                          id={`eval-btn-${sub._id}`}
                          className={ev ? 'btn-secondary' : 'btn-primary'}
                          style={{ padding: '6px 14px', fontSize: 12 }}
                          onClick={() => setModal({ open: true, submission: sub })}
                        >
                          {ev ? 'Edit Score' : '+ Evaluate'}
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

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title="Evaluate Submission" wide>
        {modal.submission && (
          <EvalForm submission={modal.submission} existing={getEval(modal.submission._id)} onSubmit={handleSave} loading={saving} />
        )}
      </Modal>
    </div>
  )
}

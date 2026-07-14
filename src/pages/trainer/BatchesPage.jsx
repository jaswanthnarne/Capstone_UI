import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Layers, Copy, Check, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBatches, getColleges, getSubjects, createBatch, updateBatch, deleteBatch, getBatchInviteCode } from '../../services/api'
import { Modal, FormField, EmptyState, SectionHeader, StatusBadge, LoadingSpinner } from '../../components/ui'

function BatchForm({ initial, colleges, subjects, onSubmit, loading }) {
  const [form, setForm] = useState(initial
    ? {
        ...initial,
        collegeId: initial.collegeId?._id || initial.collegeId,
        subjectId: initial.subjectId?._id || initial.subjectId,
        startDate: initial.startDate?.slice(0,10),
        endDate: initial.endDate?.slice(0,10),
        minMembers: initial.minMembers || 2,
        maxMembers: initial.maxMembers || 6,
        departments: Array.isArray(initial.departments) ? initial.departments.join(', ') : '',
        divisions: Array.isArray(initial.divisions) ? initial.divisions.join(', ') : '',
        rooms: Array.isArray(initial.rooms) ? initial.rooms.join(', ') : '',
        courses: Array.isArray(initial.courses) ? initial.courses.join(', ') : '',
        isProblemSelectionLocked: !!initial.isProblemSelectionLocked,
      }
    : { name: '', collegeId: '', subjectId: '', startDate: '', endDate: '', status: 'upcoming', minMembers: 2, maxMembers: 6, departments: '', divisions: '', rooms: '', courses: '', isProblemSelectionLocked: false }
  )
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <FormField label="Batch Name" id="batch-name">
        <input id="batch-name" className="input-dark" placeholder="e.g. 2026-MERN-A" value={form.name} onChange={e => set('name', e.target.value)} required />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="College" id="batch-college">
          <select id="batch-college" className="input-dark" value={form.collegeId} onChange={e => set('collegeId', e.target.value)} required>
            <option value="">Select college</option>
            {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Subject" id="batch-subject">
          <select id="batch-subject" className="input-dark" value={form.subjectId} onChange={e => set('subjectId', e.target.value)} required>
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </FormField>
        <FormField label="Start Date" id="batch-start">
          <input id="batch-start" className="input-dark" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
        </FormField>
        <FormField label="End Date" id="batch-end">
          <input id="batch-end" className="input-dark" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} required />
        </FormField>
        <FormField label="Min Members per Team" id="batch-min-members">
          <input id="batch-min-members" type="number" className="input-dark" min={1} value={form.minMembers} onChange={e => set('minMembers', Number(e.target.value))} required />
        </FormField>
        <FormField label="Max Members per Team" id="batch-max-members">
          <input id="batch-max-members" type="number" className="input-dark" min={1} value={form.maxMembers} onChange={e => set('maxMembers', Number(e.target.value))} required />
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <FormField label="Departments (comma-separated)" id="batch-departments">
          <input id="batch-departments" className="input-dark" placeholder="e.g. CSE, ECE, ME" value={form.departments} onChange={e => set('departments', e.target.value)} />
        </FormField>
        <FormField label="Divisions (comma-separated)" id="batch-divisions">
          <input id="batch-divisions" className="input-dark" placeholder="e.g. A, B, C" value={form.divisions} onChange={e => set('divisions', e.target.value)} />
        </FormField>
        <FormField label="Training Rooms (comma-separated)" id="batch-rooms">
          <input id="batch-rooms" className="input-dark" placeholder="e.g. Room 101, Lab 2" value={form.rooms} onChange={e => set('rooms', e.target.value)} />
        </FormField>
        <FormField label="Courses (comma-separated)" id="batch-courses">
          <input id="batch-courses" className="input-dark" placeholder="e.g. Java FSD, Python FSD" value={form.courses} onChange={e => set('courses', e.target.value)} />
        </FormField>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', padding: '10px 14px', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10 }}>
        <input
          id="batch-lock-selection"
          type="checkbox"
          style={{ width: 18, height: 18, cursor: 'pointer' }}
          checked={form.isProblemSelectionLocked}
          onChange={e => set('isProblemSelectionLocked', e.target.checked)}
        />
        <label htmlFor="batch-lock-selection" style={{ fontSize: 13, color: 'var(--color-text-primary)', cursor: 'pointer', fontWeight: 500 }}>
          Lock Problem Selection for Students (Only Trainer can assign)
        </label>
      </div>
      <FormField label="Status" id="batch-status">
        <select id="batch-status" className="input-dark" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </FormField>
      <button type="submit" id="save-batch-btn" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Batch'}
      </button>
    </form>
  )
}

function InviteCodeModal({ batchId, onClose }) {
  const [code, setCode] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getBatchInviteCode(batchId).then(r => setCode(r.data.data.inviteCode))
  }, [batchId])

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="text-center">
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Share this code with team leads to join this batch:</div>
      {code ? (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <div className="gradient-border" style={{ padding: 2, borderRadius: 12 }}>
            <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10, padding: '14px 24px', fontSize: 28, fontWeight: 800, letterSpacing: 6, color: 'var(--color-text-primary)' }}>
              {code}
            </div>
          </div>
          <button className="btn-primary" style={{ padding: '14px 16px' }} onClick={copy}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      ) : <div className="spinner mx-auto" />}
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 16 }}>Team leads use this code during registration to join the batch.</div>
    </div>
  )
}

export default function BatchesPage() {
  const [batches, setBatches] = useState([])
  const [colleges, setColleges] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: null, data: null })
  const [inviteModal, setInviteModal] = useState({ open: false, batchId: null })
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    Promise.all([getBatches(), getColleges(), getSubjects()])
      .then(([b, c, s]) => { setBatches(b.data.data); setColleges(c.data.data); setSubjects(s.data.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    setSaving(true)
    const formattedForm = {
      ...form,
      departments: typeof form.departments === 'string' ? form.departments.split(',').map(s => s.trim()).filter(Boolean) : form.departments || [],
      divisions: typeof form.divisions === 'string' ? form.divisions.split(',').map(s => s.trim()).filter(Boolean) : form.divisions || [],
      rooms: typeof form.rooms === 'string' ? form.rooms.split(',').map(s => s.trim()).filter(Boolean) : form.rooms || [],
      courses: typeof form.courses === 'string' ? form.courses.split(',').map(s => s.trim()).filter(Boolean) : form.courses || [],
    }
    try {
      modal.mode === 'create' ? await createBatch(formattedForm) : await updateBatch(modal.data._id, formattedForm)
      toast.success(modal.mode === 'create' ? 'Project created!' : 'Project updated!')
      setModal({ open: false }); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <SectionHeader
        title="Capstone Projects"
        subtitle={`${batches.length} project${batches.length !== 1 ? 's' : ''} across all colleges`}
        action={
          <button id="add-batch-btn" className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}>
            <Plus size={16} /> New Capstone Project
          </button>
        }
      />

      {batches.length === 0 ? (
        <EmptyState icon={Layers} title="No projects yet" description="Create a project to start organizing teams." action={<button className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}><Plus size={14}/> Create Project</button>} />
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table className="table-dark w-full" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>Project Name</th><th>College</th><th>Subject</th><th>Period</th><th>Min/Max Team</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {batches.map((batch) => (
                  <motion.tr
                    key={batch._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                        navigate(`/trainer/projects/${batch._id}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{batch.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace', marginTop: 2 }}>Click row to open dashboard & manage →</div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{batch.collegeId?.name}</td>
                    <td>
                      {batch.subjectId && (
                        <span style={{ background: `${batch.subjectId.color}15`, color: batch.subjectId.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                          {batch.subjectId.name}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        <Calendar size={12} />
                        {new Date(batch.startDate).toLocaleDateString()} – {new Date(batch.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {batch.minMembers || 2} – {batch.maxMembers || 6} members
                    </td>
                    <td><StatusBadge status={batch.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button id={`invite-${batch._id}`} className="btn-secondary" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setInviteModal({ open: true, batchId: batch._id })}><Copy size={12} /> Code</button>
                        <button id={`edit-batch-${batch._id}`} className="btn-secondary" style={{ padding: '5px 10px' }} onClick={() => setModal({ open: true, mode: 'edit', data: batch })}><Edit size={12} /></button>
                        <button id={`del-batch-${batch._id}`} className="btn-danger" style={{ padding: '5px 10px' }} onClick={async () => { if (!confirm('Delete project?')) return; try { await deleteBatch(batch._id); toast.success('Deleted'); load() } catch { toast.error('Failed') } }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Create Batch' : 'Edit Batch'} wide>
        <BatchForm initial={modal.data} colleges={colleges} subjects={subjects} onSubmit={handleSave} loading={saving} />
      </Modal>

      <Modal isOpen={inviteModal.open} onClose={() => setInviteModal({ open: false })} title="Batch Invite Code">
        {inviteModal.batchId && <InviteCodeModal batchId={inviteModal.batchId} onClose={() => setInviteModal({ open: false })} />}
      </Modal>
    </div>
  )
}

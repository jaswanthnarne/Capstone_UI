import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../services/api'
import { Modal, FormField, EmptyState, SectionHeader, LoadingSpinner } from '../../components/ui'

const SUBJECT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899']

function SubjectForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', description: '', color: '#3b82f6' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <FormField label="Subject Name" id="subject-name">
        <input id="subject-name" className="input-dark" placeholder="e.g. MERN Stack" value={form.name} onChange={e => set('name', e.target.value)} required />
      </FormField>
      <FormField label="Description" id="subject-desc">
        <textarea id="subject-desc" className="input-dark" placeholder="Brief description..." rows={3} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
      </FormField>
      <FormField label="Accent Color">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SUBJECT_COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color', c)} style={{
              width: 28, height: 28, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
              outline: form.color === c ? `2px solid white` : 'none', outlineOffset: 2,
            }} />
          ))}
        </div>
      </FormField>
      <button type="submit" id="save-subject-btn" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Subject'}
      </button>
    </form>
  )
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: null, data: null })

  const load = () => { setLoading(true); getSubjects().then(r => setSubjects(r.data.data)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      modal.mode === 'create' ? await createSubject(form) : await updateSubject(modal.data._id, form)
      toast.success(modal.mode === 'create' ? 'Subject created!' : 'Subject updated!')
      setModal({ open: false }); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return
    try { await deleteSubject(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <SectionHeader
        title="Subjects"
        subtitle="Reusable subject pool across all colleges"
        action={
          <button id="add-subject-btn" className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}>
            <Plus size={16} /> Add Subject
          </button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" description="Create subjects like Java Full Stack, MERN, etc." action={<button className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}><Plus size={14}/> Add Subject</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          <AnimatePresence>
            {subjects.map((s, i) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass card-lift"
                style={{ borderRadius: 14, padding: 18, borderTop: `3px solid ${s.color}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={17} style={{ color: s.color }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button id={`edit-subject-${s._id}`} className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setModal({ open: true, mode: 'edit', data: s })}><Edit size={12} /></button>
                    <button id={`del-subject-${s._id}`} className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(s._id)}><Trash2 size={12} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{s.description || 'No description'}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Add Subject' : 'Edit Subject'}>
        <SubjectForm initial={modal.data} onSubmit={handleSave} loading={saving} />
      </Modal>
    </div>
  )
}

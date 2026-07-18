import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Building2, MapPin, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { getColleges, createCollege, updateCollege, deleteCollege } from '../../services/api'
import { Modal, FormField, EmptyState, SectionHeader, StatusBadge, LoadingSpinner } from '../../components/ui'

function CollegeForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', location: '', contactEmail: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <FormField label="College Name" id="college-name">
        <input id="college-name" className="input-dark" placeholder="e.g. JNTU Hyderabad" value={form.name} onChange={e => set('name', e.target.value)} required />
      </FormField>
      <FormField label="Location" id="college-location">
        <input id="college-location" className="input-dark" placeholder="City, State" value={form.location} onChange={e => set('location', e.target.value)} required />
      </FormField>
      <FormField label="Contact Email (optional)" id="college-email">
        <input id="college-email" className="input-dark" type="email" placeholder="principal@college.edu" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
      </FormField>
      <button type="submit" id="save-college-btn" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 8 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save College'}
      </button>
    </form>
  )
}

export default function CollegesPage() {
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: null, data: null })

  const load = () => {
    setLoading(true)
    getColleges().then(r => setColleges(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createCollege(form)
        toast.success('College created!')
      } else {
        await updateCollege(modal.data._id, form)
        toast.success('College updated!')
      }
      setModal({ open: false })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this college?')) return
    try {
      await deleteCollege(id)
      toast.success('College deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <SectionHeader
        title="Colleges"
        subtitle={`${colleges.length} college${colleges.length !== 1 ? 's' : ''} registered`}
        action={
          <button id="add-college-btn" className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}>
            <Plus size={16} /> Add College
          </button>
        }
      />

      {colleges.length === 0 ? (
        <EmptyState icon={Building2} title="No colleges yet" description="Add your first college to get started." action={<button className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}><Plus size={14}/> Add College</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          <AnimatePresence>
            {colleges.map(college => (
              <motion.div
                key={college._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass card-lift"
                style={{ borderRadius: 16, padding: 20 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button id={`edit-college-${college._id}`} className="btn-secondary" style={{ padding: '5px 10px' }} onClick={() => setModal({ open: true, mode: 'edit', data: college })}>
                      <Edit size={13} />
                    </button>
                    <button id={`del-college-${college._id}`} className="btn-danger" style={{ padding: '5px 10px' }} onClick={() => handleDelete(college._id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>{college.name}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 4 }}>
                  <MapPin size={13} /> {college.location}
                </div>
                {college.contactEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 12 }}>
                    <Mail size={12} /> {college.contactEmail}
                  </div>
                )}

                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Added {new Date(college.createdAt).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'create' ? 'Add College' : 'Edit College'}
      >
        <CollegeForm initial={modal.data} onSubmit={handleSave} loading={saving} />
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Building2, MapPin, Mail, Sparkles, Users, Award, ExternalLink, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { getColleges, createCollege, updateCollege, deleteCollege, getBatches } from '../../services/api'
import { Modal, FormField, EmptyState, SectionHeader, LoadingSpinner } from '../../components/ui'

function CollegeForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', location: '', contactEmail: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <FormField label="College / Institution Name" id="college-name">
        <input id="college-name" className="input-dark" placeholder="e.g. JNTU Hyderabad Institute of Technology" value={form.name} onChange={e => set('name', e.target.value)} required />
      </FormField>
      <FormField label="Campus Location / City" id="college-location">
        <input id="college-location" className="input-dark" placeholder="City, State (e.g. Hyderabad, TS)" value={form.location} onChange={e => set('location', e.target.value)} required />
      </FormField>
      <FormField label="Official Contact / Principal Email (optional)" id="college-email">
        <input id="college-email" className="input-dark" type="email" placeholder="principal@college.edu" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
      </FormField>
      <button type="submit" id="save-college-btn" className="btn-primary w-full" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 12 }} disabled={loading}>
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save College Institution'}
      </button>
    </form>
  )
}

export default function CollegesPage() {
  const [colleges, setColleges] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: null, data: null })

  const load = () => {
    setLoading(true)
    Promise.all([getColleges(), getBatches()])
      .then(([cRes, bRes]) => {
        setColleges(cRes.data.data || [])
        setBatches(bRes.data.data || [])
      })
      .catch(() => toast.error('Failed to load colleges'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        await createCollege(form)
        toast.success('College institution created!')
      } else {
        await updateCollege(modal.data._id, form)
        toast.success('College updated!')
      }
      setModal({ open: false })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save college')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this college institution?')) return
    try {
      await deleteCollege(id)
      toast.success('College deleted!')
      load()
    } catch { toast.error('Failed to delete college') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <SectionHeader
        title="College Institutions"
        subtitle={`${colleges.length} partner college${colleges.length !== 1 ? 's' : ''} registered`}
        action={
          <button id="add-college-btn" className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}>
            <Plus size={16} /> Add College Institution
          </button>
        }
      />

      {colleges.length === 0 ? (
        <EmptyState icon={Building2} title="No colleges yet" description="Add your first partner college institution." action={<button className="btn-primary" onClick={() => setModal({ open: true, mode: 'create', data: null })}><Plus size={14}/> Add College</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          <AnimatePresence>
            {colleges.map(college => {
              const collegeBatches = batches.filter(b => b.collegeId?._id === college._id || b.collegeId === college._id)
              return (
                <motion.div
                  key={college._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className="glass"
                  style={{
                    borderRadius: 18,
                    padding: 22,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={22} style={{ color: '#3b82f6' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                          {college.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)', fontSize: 12, marginTop: 2 }}>
                          <MapPin size={12} style={{ color: 'var(--color-accent)' }} /> {college.location}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setModal({ open: true, mode: 'edit', data: college })}>
                        <Edit size={13} />
                      </button>
                      <button className="btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => handleDelete(college._id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {college.contactEmail && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 12 }}>
                      <Mail size={13} style={{ color: '#64748b' }} /> {college.contactEmail}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <span className="badge badge-purple" style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Award size={12} /> {collegeBatches.length} Active Batches
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {new Date(college.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'create' ? 'Add Partner College' : 'Edit Partner College'}
      >
        <CollegeForm initial={modal.data} onSubmit={handleSave} loading={saving} />
      </Modal>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, GitBranch, Globe, Video, FileUp, CheckCircle, AlertCircle, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { createSubmission, getMySubmission, getMyTeam } from '../../services/api'
import { LoadingSpinner, FormField } from '../../components/ui'

function SubmittedView({ submission }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ borderRadius: 20, padding: 28, maxWidth: 600, margin: '0 auto', border: '1px solid rgba(22,163,74,0.3)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <CheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 8 }}>Submission Received!</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 4 }}>Your project has been submitted and is awaiting evaluation.</p>
        {submission.isLate && (
          <span className="badge badge-red" style={{ marginTop: 8 }}><AlertCircle size={12} style={{ marginRight: 4 }} /> Late Submission</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'GitHub', value: submission.githubUrl, icon: GitBranch, href: submission.githubUrl },
          { label: 'Deployed URL', value: submission.deployedUrl || '—', icon: Globe, href: submission.deployedUrl },
          { label: 'Demo Video', value: submission.demoVideoUrl || '—', icon: Video, href: submission.demoVideoUrl },
          { label: 'Submitted At', value: new Date(submission.submittedAt).toLocaleString(), icon: CheckCircle, href: null },
        ].map(({ label, value, icon: Icon, href }) => (
          <div key={label} className="glass" style={{ borderRadius: 10, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Icon size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#5c5c7b' }}>{label}</div>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{value}</a>
              ) : (
                <div style={{ fontSize: 13, color: '#a0a0c0' }}>{value}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function SubmitPage() {
  const [submission, setSubmission] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ githubUrl: '', deployedUrl: '', demoVideoUrl: '' })
  const [docFile, setDocFile] = useState(null)
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([getMySubmission().catch(() => ({ data: { data: null } })), getMyTeam()])
      .then(([s, t]) => { setSubmission(s.data.data); setTeam(t.data.data) })
      .finally(() => setLoading(false))
  }, [])

  const validate = () => {
    const e = {}
    if (!form.githubUrl) e.githubUrl = 'GitHub URL is required'
    else if (!/^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/.test(form.githubUrl)) e.githubUrl = 'Must be a valid GitHub repository URL (https://github.com/user/repo)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('githubUrl', form.githubUrl)
      formData.append('deployedUrl', form.deployedUrl)
      formData.append('demoVideoUrl', form.demoVideoUrl)
      if (docFile) formData.append('docFile', docFile)
      await createSubmission(formData)
      toast.success('Project submitted successfully!')
      const s = await getMySubmission()
      setSubmission(s.data.data)
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <LoadingSpinner />

  if (submission) return <div><div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Submission</h1></div><SubmittedView submission={submission} /></div>

  if (!team?.problemStatementId) {
    return (
      <div className="text-center py-20" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <FileUp size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Select a Problem First</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 8 }}>You need to select a problem statement before you can submit.</p>
        <a href="/team/problems" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20, padding: '10px 24px' }}>Browse Problems</a>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: -1 }}>Submit Project</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 6 }}>Final deliverables for: <span style={{ color: 'var(--color-accent)' }}>{team.problemStatementId?.title}</span></p>
      </div>

      <div className="layout-split-sidebar">
        {/* Form */}
        <motion.div className="glass" style={{ borderRadius: 20, padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit}>
            <FormField label="GitHub Repository URL *" id="github-url" error={errors.githubUrl}>
              <div style={{ position: 'relative' }}>
                <GitBranch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c7b' }} />
                <input id="github-url" className="input-dark" style={{ paddingLeft: 36 }} placeholder="https://github.com/username/repo" value={form.githubUrl} onChange={e => { set('githubUrl', e.target.value); setErrors(er => ({ ...er, githubUrl: '' })) }} />
              </div>
            </FormField>

            <FormField label="Deployed App URL (optional)" id="deployed-url">
              <div style={{ position: 'relative' }}>
                <Globe size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c7b' }} />
                <input id="deployed-url" className="input-dark" style={{ paddingLeft: 36 }} placeholder="https://myapp.vercel.app" value={form.deployedUrl} onChange={e => set('deployedUrl', e.target.value)} />
              </div>
            </FormField>

            <FormField label="Demo Video URL (optional)" id="demo-video">
              <div style={{ position: 'relative' }}>
                <Video size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5c5c7b' }} />
                <input id="demo-video" className="input-dark" style={{ paddingLeft: 36 }} placeholder="https://youtube.com/watch?v=..." value={form.demoVideoUrl} onChange={e => set('demoVideoUrl', e.target.value)} />
              </div>
            </FormField>

            <FormField label="Documentation File (PDF, DOC, PPT — max 50MB)" id="doc-file">
              <div
                style={{
                  border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer',
                  background: docFile ? 'rgba(59,130,246,0.08)' : 'transparent',
                  borderColor: docFile ? 'rgba(59,130,246,0.4)' : undefined,
                  transition: 'all 0.2s',
                }}
                onClick={() => document.getElementById('doc-file-input').click()}
              >
                <FileUp size={24} style={{ color: docFile ? '#3b82f6' : '#5c5c7b', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: docFile ? '#60a5fa' : '#5c5c7b' }}>
                  {docFile ? docFile.name : 'Click to upload documentation'}
                </div>
                <div style={{ fontSize: 11, color: '#5c5c7b', marginTop: 4 }}>PDF, DOCX, PPTX, ZIP up to 50MB</div>
                <input id="doc-file-input" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" style={{ display: 'none' }} onChange={e => setDocFile(e.target.files[0])} />
              </div>
            </FormField>

            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 14, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#fbbf24', lineHeight: 1.5 }}>
                This is your final submission. You can only submit once. Make sure all links are working and your documentation is complete.
              </div>
            </div>

            <button id="submit-project-btn" type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }} disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: 20, height: 20 }} /> : <><Send size={16} /> Submit Project</>}
            </button>
          </form>
        </motion.div>

        {/* Checklist */}
        <div>
          <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>Submission Checklist</div>
            {[
              { check: !!form.githubUrl && /^https?:\/\/(www\.)?github\.com\//.test(form.githubUrl), label: 'Valid GitHub repo URL' },
              { check: !!form.deployedUrl, label: 'Deployed app link (recommended)' },
              { check: !!form.demoVideoUrl, label: 'Demo video link (recommended)' },
              { check: !!docFile, label: 'Documentation uploaded (recommended)' },
              { check: team?.status === 'in_progress', label: 'Problem statement selected' },
            ].map(({ check, label }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: check ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${check ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {check && <Check size={12} style={{ color: '#10b981' }} />}
                </div>
                <span style={{ fontSize: 13, color: check ? '#a0a0c0' : '#5c5c7b' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

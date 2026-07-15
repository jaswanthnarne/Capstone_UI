import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Eye, Download, FileText, X, AlertCircle, FileSpreadsheet, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  getTrainerDocRequests, 
  createDocRequest, 
  deleteDocRequest, 
  getRequestSubmissions,
  getBatches,
  getAllTeams
} from '../../services/api'

export default function DocRequestsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [batches, setBatches] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedTeams, setSelectedTeams] = useState([]) // Array of teamIds
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
  const [activeRequest, setActiveRequest] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    fileType: 'any',
    maxSize: 10,
    batchId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [reqRes, batchRes] = await Promise.all([
        getTrainerDocRequests(),
        getBatches()
      ])
      setRequests(reqRes.data.data)
      setBatches(batchRes.data.data)
    } catch (err) {
      toast.error('Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  // Load teams whenever batch is selected in Create Request form
  useEffect(() => {
    if (form.batchId) {
      loadBatchTeams(form.batchId)
    } else {
      setTeams([])
    }
  }, [form.batchId])

  const loadBatchTeams = async (batchId) => {
    try {
      const res = await getAllTeams({ batchId })
      setTeams(res.data.data)
      setSelectedTeams([]) // reset selected teams
    } catch (err) {
      toast.error('Failed to load teams for selected batch')
    }
  }

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    if (!form.title || !form.batchId) {
      return toast.error('Title and Batch are required')
    }

    setSubmitting(true)
    try {
      const res = await createDocRequest({
        ...form,
        targetTeams: selectedTeams
      })
      setRequests([res.data.data, ...requests])
      toast.success('Document request created successfully!')
      setShowCreateModal(false)
      // Reset form
      setForm({ title: '', description: '', fileType: 'any', maxSize: 10, batchId: '' })
      setSelectedTeams([])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document request? All uploaded documents will be unlinked.')) return

    try {
      await deleteDocRequest(id)
      setRequests(requests.filter(r => r._id !== id))
      toast.success('Document request deleted successfully')
    } catch (err) {
      toast.error('Failed to delete document request')
    }
  }

  const handleViewSubmissions = async (request) => {
    setActiveRequest(request)
    setShowSubmissionsModal(true)
    setSubmissionsLoading(true)
    try {
      const res = await getRequestSubmissions(request._id)
      setSubmissions(res.data.data)
    } catch (err) {
      toast.error('Failed to load submissions')
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const toggleTeamSelection = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId))
    } else {
      setSelectedTeams([...selectedTeams, teamId])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Upload className="text-blue-600" /> Document Collection Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Request project files (Synopsis, Reports, source code ZIP) from teams and view their uploads.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <Plus size={16} /> Create Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">No Document Requests</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            You haven't requested any documents yet. Create a request to collect files from batches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((reqItem) => (
            <div 
              key={reqItem._id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{reqItem.title}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {reqItem.batchId?.name || 'Batch'}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2">
                  {reqItem.description || 'No description provided.'}
                </p>

                <div className="bg-slate-50 rounded-xl p-3 mb-6 space-y-2 text-xs text-slate-600 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">File Constraint:</span>
                    <span className="font-semibold text-slate-700 uppercase">{reqItem.fileType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Max Size:</span>
                    <span className="font-semibold text-slate-700">{reqItem.maxSize} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Scope:</span>
                    <span className="font-semibold text-slate-700">
                      {reqItem.targetTeams?.length > 0 
                        ? `${reqItem.targetTeams.length} Selected Teams` 
                        : 'All Teams in Batch'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-auto">
                <button
                  onClick={() => handleViewSubmissions(reqItem)}
                  className="btn-secondary flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold"
                  style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Eye size={14} /> View Submissions
                </button>
                <button
                  onClick={() => handleDeleteRequest(reqItem._id)}
                  className="btn-danger p-2 rounded-lg text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE REQUEST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Create Document Request</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 display-block mb-1.5 uppercase">Request Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Synopsis Report, Project Phase-1 Report"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 display-block mb-1.5 uppercase">Instructions / Description</label>
                  <textarea
                    placeholder="Provide specific instructions regarding the report submission..."
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 display-block mb-1.5 uppercase">Required File Type</label>
                    <select
                      value={form.fileType}
                      onChange={e => setForm({ ...form, fileType: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="any">Any Extension</option>
                      <option value="pdf">PDF only (.pdf)</option>
                      <option value="zip">Archive only (.zip, .rar, .7z)</option>
                      <option value="doc">Word only (.doc, .docx)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 display-block mb-1.5 uppercase">Max Size (MB)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={form.maxSize}
                      onChange={e => setForm({ ...form, maxSize: parseInt(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 display-block mb-1.5 uppercase">Target Batch</label>
                  <select
                    required
                    value={form.batchId}
                    onChange={e => setForm({ ...form, batchId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a batch</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {form.batchId && teams.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 display-block mb-1.5 uppercase">Target Specific Teams (Optional)</label>
                    <p className="text-[10px] text-slate-400 mb-2">Leave unselected to target all teams in the batch.</p>
                    <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {teams.map(t => (
                        <label key={t._id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(t._id)}
                            onChange={() => toggleTeamSelection(t._id)}
                            className="rounded text-blue-600"
                          />
                          <span>{t.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary px-5 py-2 flex items-center gap-2"
                  >
                    {submitting && <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />}
                    Save Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUBMISSIONS MODAL */}
      <AnimatePresence>
        {showSubmissionsModal && activeRequest && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{activeRequest.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Submissions collected under {activeRequest.batchId?.name}</p>
                </div>
                <button onClick={() => setShowSubmissionsModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {submissionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto text-slate-300 mb-2" size={36} />
                    <p className="text-slate-500 text-sm font-medium">No teams have submitted documents yet.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                          <th className="p-3">Team Name</th>
                          <th className="p-3">File Name</th>
                          <th className="p-3">Size</th>
                          <th className="p-3">Date Uploaded</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {submissions.map((sub) => (
                          <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-semibold text-slate-700">{sub.teamId?.name || 'Unknown'}</td>
                            <td className="p-3 truncate max-w-xs text-slate-600" title={sub.fileName}>
                              {sub.fileName}
                            </td>
                            <td className="p-3 text-slate-500 text-xs">{sub.fileSize} MB</td>
                            <td className="p-3 text-slate-500 text-xs">
                              {new Date(sub.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3 text-right">
                              <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                <Download size={13} /> Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

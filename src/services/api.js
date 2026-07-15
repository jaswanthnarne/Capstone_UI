import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — logout and redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const trainerLogin = (data) => api.post('/auth/trainer/login', data)
export const trainerBootstrap = (data) => api.post('/auth/trainer/bootstrap', data)
export const teamRegister = (data) => api.post('/auth/team/register', data)
export const teamLogin = (data) => api.post('/auth/team/login', data)
export const unifiedLogin = (data) => api.post('/auth/login', data)

// ─── Trainer Dashboard ────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/trainer/dashboard')
export const getTrainerProfile = () => api.get('/trainer/profile')

// ─── Colleges ─────────────────────────────────────────────────────────────────
export const getColleges = () => api.get('/colleges')
export const getCollegesSummary = () => api.get('/colleges/summary')
export const getCollege = (id) => api.get(`/colleges/${id}`)
export const createCollege = (data) => api.post('/colleges', data)
export const updateCollege = (id, data) => api.put(`/colleges/${id}`, data)
export const deleteCollege = (id) => api.delete(`/colleges/${id}`)

// ─── Subjects ─────────────────────────────────────────────────────────────────
export const getSubjects = () => api.get('/subjects')
export const createSubject = (data) => api.post('/subjects', data)
export const updateSubject = (id, data) => api.put(`/subjects/${id}`, data)
export const deleteSubject = (id) => api.delete(`/subjects/${id}`)

// ─── Batches ──────────────────────────────────────────────────────────────────
export const getBatches = (params) => api.get('/batches', { params })
export const getBatch = (id) => api.get(`/batches/${id}`)
export const createBatch = (data) => api.post('/batches', data)
export const updateBatch = (id, data) => api.put(`/batches/${id}`, data)
export const deleteBatch = (id) => api.delete(`/batches/${id}`)
export const getBatchInviteCode = (id) => api.get(`/batches/${id}/invite-code`)

// ─── Problems ─────────────────────────────────────────────────────────────────
export const getProblems = (params) => api.get('/problems', { params })
export const getProblem = (id) => api.get(`/problems/${id}`)
export const createProblem = (data) => api.post('/problems', data)
export const updateProblem = (id, data) => api.put(`/problems/${id}`, data)
export const deleteProblem = (id) => api.delete(`/problems/${id}`)
export const getAvailableProblems = () => api.get('/problems/teamlead/available')
export const selectProblem = (problemStatementId) =>
  api.post('/problems/teamlead/select', { problemStatementId })

// ─── Teams ────────────────────────────────────────────────────────────────────
export const getAllTeams = (params) => api.get('/teams', { params })
export const getTeamById = (id) => api.get(`/teams/${id}`)
export const createTeam = (data) => api.post('/teams', data)
export const getMyTeam = () => api.get('/teams/me/profile')
export const updateMyTeam = (data) => api.put('/teams/me/profile', data)
export const inviteMember = (data) => api.post('/teams/invite-member', data)
export const getMyInvitations = () => api.get('/teams/my-invitations')
export const acceptInvitation = (token) => api.post('/auth/accept-invitation', { token })
export const adminOverrideTeam = (id, data) => api.put(`/teams/override/${id}`, data)
export const deleteTeam = (id) => api.delete(`/teams/${id}`)
export const resendInvitation = (id) => api.post(`/teams/invitations/${id}/resend`)
export const cancelInvitation = (id) => api.delete(`/teams/invitations/${id}`)

// ─── Milestones ───────────────────────────────────────────────────────────────
export const getMyMilestones = () => api.get('/milestones/me')
export const updateMyMilestone = (data) => api.put('/milestones/me', data)
export const getTeamMilestones = (teamId) => api.get(`/milestones/team/${teamId}`)
export const updateTeamMilestone = (data) => api.put('/milestones/team', data)

// ─── Submissions ──────────────────────────────────────────────────────────────
export const createSubmission = (formData) =>
  api.post('/submissions/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getMySubmission = () => api.get('/submissions/me')
export const getAllSubmissions = (params) => api.get('/submissions', { params })

// ─── Evaluations ──────────────────────────────────────────────────────────────
export const getAllEvaluations = (params) => api.get('/evaluations', { params })
export const upsertEvaluation = (data) => api.post('/evaluations', data)
export const getMyEvaluation = () => api.get('/evaluations/me')

// ─── Reports ──────────────────────────────────────────────────────────────────
export const getBatchReport = (id) => api.get(`/reports/batch/${id}`)
export const getCollegeReport = (id) => api.get(`/reports/college/${id}`)
export const getTeamReport = (id) => api.get(`/reports/team/${id}`)
export const getPortfolioReport = () => api.get('/reports/portfolio')
export const exportBatchPDF = (id) => api.get(`/reports/batch/${id}/pdf`, { responseType: 'blob' })
export const exportStudentsExcel = (params) =>
  api.get('/reports/students/export', { params, responseType: 'blob' })

export const uploadBatchTemplate = (batchId, formData) =>
  api.post(`/batches/${batchId}/templates`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteBatchTemplate = (batchId, templateId) =>
  api.delete(`/batches/${batchId}/templates/${templateId}`)

// ─── Daily Logs ────────────────────────────────────────────────────────────────
export const saveDailyLog = (data) => api.post('/daily-logs', data)
export const getMyDailyLogs = () => api.get('/daily-logs/me')
export const getTeamDailyLogs = (teamId) => api.get(`/daily-logs/team/${teamId}`)

// ─── Document Requests ─────────────────────────────────────────────────────────
export const createDocRequest = (data) => api.post('/doc-requests/trainer', data)
export const getTrainerDocRequests = () => api.get('/doc-requests/trainer')
export const deleteDocRequest = (id) => api.delete(`/doc-requests/trainer/${id}`)
export const getRequestSubmissions = (requestId) => api.get(`/doc-requests/trainer/submissions/${requestId}`)
export const getTeamDocRequests = () => api.get('/doc-requests/team')
export const submitDocRequest = (formData) =>
  api.post('/doc-requests/team/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export default api

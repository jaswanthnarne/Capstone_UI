import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import { PageLoader } from './components/ui'

// Safe lazy loader that automatically reloads the page if chunk hash changed after deployment
const safeLazy = (importFn) =>
  lazy(() =>
    importFn().catch((err) => {
      console.warn('Chunk load error (new deployment detected), reloading page...', err)
      window.location.reload()
      return new Promise(() => {})
    })
  )

// Pages
import LoginPage from './pages/LoginPage'
const AcceptInvitationPage = safeLazy(() => import('./pages/AcceptInvitationPage'))
const ResetPasswordPage = safeLazy(() => import('./pages/ResetPasswordPage'))

// Trainer pages
const TrainerDashboard = safeLazy(() => import('./pages/trainer/TrainerDashboard'))
const CollegesPage = safeLazy(() => import('./pages/trainer/CollegesPage'))
const SubjectsPage = safeLazy(() => import('./pages/trainer/SubjectsPage'))
const BatchesPage = safeLazy(() => import('./pages/trainer/BatchesPage'))
const ProjectDetailsPage = safeLazy(() => import('./pages/trainer/ProjectDetailsPage'))
const ProblemsPage = safeLazy(() => import('./pages/trainer/ProblemsPage'))
const TeamsPage = safeLazy(() => import('./pages/trainer/TeamsPage'))
const EvaluationsPage = safeLazy(() => import('./pages/trainer/EvaluationsPage'))
const ReportsPage = safeLazy(() => import('./pages/trainer/ReportsPage'))
const DocRequestsPage = safeLazy(() => import('./pages/trainer/DocRequestsPage'))

// Team pages
const TeamHomePage = safeLazy(() => import('./pages/team/TeamHomePage'))
const InvitationsPage = safeLazy(() => import('./pages/team/InvitationsPage'))
const SelectProblemPage = safeLazy(() => import('./pages/team/SelectProblemPage'))
const MilestonesPage = safeLazy(() => import('./pages/team/MilestonesPage'))
const SubmitPage = safeLazy(() => import('./pages/team/SubmitPage'))
const EvaluationPage = safeLazy(() => import('./pages/team/EvaluationPage'))
const ProfilePage = safeLazy(() => import('./pages/team/ProfilePage'))
const CalendarPage = safeLazy(() => import('./pages/team/CalendarPage'))
const DailyLogsPage = safeLazy(() => import('./pages/team/DailyLogsPage'))
const DocSubmissionsPage = safeLazy(() => import('./pages/team/DocSubmissionsPage'))

// Route guards
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireTrainer({ children }) {
  const { isTrainer, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isTrainer()) return <Navigate to="/team/home" replace />
  return children
}

function RequireTeamLead({ children }) {
  const { isTeamLead, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isTeamLead()) return <Navigate to="/trainer/dashboard" replace />
  return children
}

function AuthRedirect() {
  const { isAuthenticated, isTrainer } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={isTrainer() ? '/trainer/dashboard' : '/team/home'} replace />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Trainer routes */}
        <Route path="/trainer" element={<RequireTrainer><Layout /></RequireTrainer>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TrainerDashboard />} />
          <Route path="colleges" element={<CollegesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="projects" element={<BatchesPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="problems" element={<ProblemsPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="doc-requests" element={<DocRequestsPage />} />
        </Route>

        {/* Team Lead routes */}
        <Route path="/team" element={<RequireTeamLead><Layout /></RequireTeamLead>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<TeamHomePage />} />
          <Route path="invitations" element={<InvitationsPage />} />
          <Route path="problems" element={<SelectProblemPage />} />
          <Route path="milestones" element={<MilestonesPage />} />
          <Route path="submit" element={<SubmitPage />} />
          <Route path="evaluation" element={<EvaluationPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="daily-logs" element={<DailyLogsPage />} />
          <Route path="doc-submissions" element={<DocSubmissionsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

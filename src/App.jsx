import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import { PageLoader } from './components/ui'

// Pages
import LoginPage from './pages/LoginPage'
const AcceptInvitationPage = lazy(() => import('./pages/AcceptInvitationPage'))

// Trainer pages
const TrainerDashboard = lazy(() => import('./pages/trainer/TrainerDashboard'))
const CollegesPage = lazy(() => import('./pages/trainer/CollegesPage'))
const SubjectsPage = lazy(() => import('./pages/trainer/SubjectsPage'))
const BatchesPage = lazy(() => import('./pages/trainer/BatchesPage'))
const ProjectDetailsPage = lazy(() => import('./pages/trainer/ProjectDetailsPage'))
const ProblemsPage = lazy(() => import('./pages/trainer/ProblemsPage'))
const TeamsPage = lazy(() => import('./pages/trainer/TeamsPage'))
const EvaluationsPage = lazy(() => import('./pages/trainer/EvaluationsPage'))
const ReportsPage = lazy(() => import('./pages/trainer/ReportsPage'))

// Team pages
const TeamHomePage = lazy(() => import('./pages/team/TeamHomePage'))
const InvitationsPage = lazy(() => import('./pages/team/InvitationsPage'))
const SelectProblemPage = lazy(() => import('./pages/team/SelectProblemPage'))
const MilestonesPage = lazy(() => import('./pages/team/MilestonesPage'))
const SubmitPage = lazy(() => import('./pages/team/SubmitPage'))
const EvaluationPage = lazy(() => import('./pages/team/EvaluationPage'))
const ProfilePage = lazy(() => import('./pages/team/ProfilePage'))
const CalendarPage = lazy(() => import('./pages/team/CalendarPage'))

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
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

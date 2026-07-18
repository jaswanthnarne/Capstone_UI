import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, BookOpen, Users, Layers, FileText,
  Award, BarChart3, LogOut, ChevronRight, Menu, X, GraduationCap,
  GitBranch, Send, Star, Mail, User, Calendar, Upload, ClipboardList, UploadCloud
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const trainerNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/trainer/dashboard' },
  { label: 'Colleges', icon: Building2, to: '/trainer/colleges' },
  { label: 'Subjects', icon: BookOpen, to: '/trainer/subjects' },
  { label: 'Capstone Projects', icon: Layers, to: '/trainer/projects' },
  { label: 'Problems', icon: FileText, to: '/trainer/problems' },
  { label: 'Teams', icon: Users, to: '/trainer/teams' },
  { label: 'Evaluations', icon: Award, to: '/trainer/evaluations' },
  { label: 'Reports', icon: BarChart3, to: '/trainer/reports' },
  { label: 'Doc Requests', icon: Upload, to: '/trainer/doc-requests' },
]

const teamNav = [
  { label: 'My Team', icon: Users, to: '/team/home' },
  { label: 'Invitations', icon: Mail, to: '/team/invitations' },
  { label: 'Select Problem', icon: FileText, to: '/team/problems' },
  { label: 'Milestones', icon: GitBranch, to: '/team/milestones' },
  { label: 'Todo Calendar', icon: Calendar, to: '/team/calendar' },
  { label: 'Daily Logs', icon: ClipboardList, to: '/team/daily-logs' },
  { label: 'Doc Submissions', icon: UploadCloud, to: '/team/doc-submissions' },
  { label: 'Submit', icon: Send, to: '/team/submit' },
  { label: 'Evaluation', icon: Star, to: '/team/evaluation' },
  { label: 'Profile', icon: User, to: '/team/profile' },
]

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200
        ${isActive
          ? 'bg-blue-50 text-blue-600 border border-blue-200/60'
          : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/40'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <item.icon size={16} />
          <span>{item.label}</span>
          {isActive && <ChevronRight size={12} className="ml-auto opacity-60" />}
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { user, logout, isTrainer } = useAuthStore()
  const navigate = useNavigate()

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nav = isTrainer() ? trainerNav : teamNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--color-base)' }}>
      
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 499
          }}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              width: 260,
              flexShrink: 0,
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 14px',
              background: '#ffffff',
              position: isMobile ? 'fixed' : 'sticky',
              left: 0,
              top: 0,
              bottom: 0,
              height: '100vh',
              zIndex: 500,
              boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {/* Logo */}
            <div style={{ marginBottom: 28, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img 
                src="https://res.cloudinary.com/ddwxonjbd/image/upload/w_120,c_scale/v1784274129/ethnotech/ethnotech_logo_full.jpg" 
                alt="Ethnotech Logo" 
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} 
              />
              <div>
                <div className="gradient-text" style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                  Ethnotech
                </div>
                <div style={{ color: '#475569', fontSize: 11, fontWeight: 600 }}>
                  {isTrainer() ? 'Trainer Portal' : 'Team Portal'}
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nav.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  onClick={() => { if (isMobile) setSidebarOpen(false) }}
                />
              ))}
            </nav>

            {/* User info + logout */}
            <div
              className="glass"
              style={{ borderRadius: 12, padding: '12px 14px', marginTop: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {(user?.name || user?.leadUsername || '?')[0]?.toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || user?.leadUsername}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{user?.role}</div>
                </div>
              </div>
              <button className="btn-secondary w-full" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleLogout}>
                <LogOut size={13} /> Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 56, borderBottom: '1px solid #cbd5e1',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
          background: '#ffffff',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8,
              color: '#475569', cursor: 'pointer', padding: '6px 8px', display: 'flex',
            }}
          >
            {sidebarOpen && !isMobile ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1" />
          <div style={{ fontSize: 13, color: '#475569' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 24px', overflowY: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}

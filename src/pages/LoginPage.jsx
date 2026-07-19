import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, Sparkles, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { unifiedLogin, forgotPassword } from '../services/api'
import useAuthStore from '../store/authStore'
import IconCloud from '../components/ui/interactive-icon-cloud'

const slugs = [
  // Languages & Core Web
  "typescript", "javascript", "openjdk", "python", "go", "rust", "cplusplus",
  "ruby", "php", "swift", "kotlin", "dart", "scala", "r", "perl",
  // Frontend Frameworks
  "react", "angular", "vuedotjs", "svelte", "nextdotjs", "nuxt", "html5", "css3",
  "bootstrap", "tailwindcss", "redux", "flutter", "sass", "webpack",
  // Backend & API
  "nodedotjs", "express", "spring", "springboot", "django", "flask", "fastapi",
  "graphql", "dotnet", "rubyonrails", "laravel", "nestjs",
  // Databases
  "mongodb", "postgresql", "mysql", "sqlite", "redis", "prisma", "sequelize",
  "neo4j", "apachecassandra", "elasticsearch",
  // Cloud & Hosting
  "amazonwebservices", "googlecloud", "digitalocean", "vercel", "netlify",
  "heroku", "cloudinary", "firebase", "render", "railway",
  // DevOps & CI/CD
  "docker", "kubernetes", "jenkins", "terraform", "ansible", "nginx",
  "githubactions", "gitlab", "circleci", "prometheus", "grafana",
  // Developer Tools
  "postman", "git", "github", "androidstudio", "intellijidea", "figma",
  "jira", "confluence", "notion", "slack",
  // AI / ML / Data Science
  "tensorflow", "pytorch", "scikitlearn", "pandas", "numpy", "jupyter",
  "keras", "anaconda", "opencv", "openai", "huggingface",
  // Cyber Security
  "splunk", "wireshark", "kalilinux", "owasp", "fortinet",
  "paloaltonetworks", "gnubash", "linux", "ubuntu",
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return toast.error('Please enter your email')
    
    setForgotLoading(true)
    try {
      const res = await forgotPassword({ email: forgotEmail })
      toast.success(res.data?.message || 'Password reset link sent to your email!')
      setShowForgotModal(false)
      setForgotEmail('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send password reset link')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.usernameOrEmail || !form.password) {
      return toast.error('Please fill in all fields')
    }

    setLoading(true)
    try {
      const res = await unifiedLogin(form)
      login(res.data.token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name || res.data.user.leadUsername}!`)
      if (res.data.user.role === 'trainer') {
        navigate('/trainer/dashboard')
      } else {
        navigate('/team/home')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const memoizedCloud = useMemo(() => (
    <IconCloud iconSlugs={slugs} />
  ), [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
      padding: '40px 24px',
      fontFamily: "'Space Grotesk', sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Subtle Radial Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.35,
        backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Grid Wrapper */}
      <div className="grid-2-responsive" style={{
        width: '100%',
        maxWidth: '1150px',
        alignItems: 'center',
        gap: '48px',
        zIndex: 10
      }}>
        {/* Left Column: Dense Animated Technology Icon Cloud */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div style={{ width: '100%', maxWidth: '500px', filter: 'drop-shadow(0 20px 30px rgba(37, 99, 235, 0.05))' }}>
            {memoizedCloud}
          </div>
        </motion.div>

        {/* Right Column: Sleek Floating Centered Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(255, 255, 255, 0.96)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            margin: '0 auto'
          }}
        >
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img 
              src="https://res.cloudinary.com/ddwxonjbd/image/upload/w_120,c_scale/v1784274129/ethnotech/ethnotech_logo_full.jpg"
              alt="Ethnotech Academic Solutions"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: '16px',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.15)',
                border: '2px solid rgba(37, 99, 235, 0.1)'
              }}
            />
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px', 
              background: 'rgba(37, 99, 235, 0.08)',
              padding: '6px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(37, 99, 235, 0.1)',
              marginBottom: '14px'
            }}>
              <Sparkles size={14} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2563eb' }}>
                Ethnotech ProjectSpace
              </span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
              Access your training workspace, trace project milestones, and submit deliverables.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
                Username or Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="login-username"
                  type="text"
                  placeholder="name@example.com or leadalpha"
                  value={form.usernameOrEmail}
                  onChange={e => setForm(f => ({ ...f, usernameOrEmail: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
               <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', margin: 0 }}>
                 Password
               </label>
               <button
                 type="button"
                 onClick={() => setShowForgotModal(true)}
                 style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
               >
                 Forgot Password?
               </button>
             </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 42px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                fontFamily: 'inherit'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#1d4ed8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
              }}
            >
              {loading ? (
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', marginTop: '28px' }}>
            Ethnotech ProjectSpace — Secure Unified Workspace Entrance.
          </p>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '400px',
              padding: '36px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Forgot Password?</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Enter your registered email address and we'll send you a password reset link.
            </p>

            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    flex: 1,
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    flex: 1,
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)',
                    fontFamily: 'inherit'
                  }}
                >
                  {forgotLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, Sparkles, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { unifiedLogin } from '../services/api'
import useAuthStore from '../store/authStore'
import IconCloud from '../components/ui/interactive-icon-cloud'

const slugs = [
  // Languages & Core Web
  "typescript", "javascript", "java", "spring", "springboot", "python", "django", "flask",
  "react", "angular", "vue", "svelte", "nextdotjs", "nuxtdotjs", "html5", "css3", "nodedotjs",
  "express", "graphql", "bootstrap", "tailwindcss", "redux", "dart", "flutter",
  // Databases
  "mongodb", "postgresql", "mysql", "sqlite", "prisma", "sequelize",
  // Cloud & Media Hosting
  "amazonaws", "microsoftazure", "googlecloud", "digitalocean", "vercel", "netlify", "heroku", "cloudinary", "firebase",
  // Developer Tools & Testing
  "postman", "git", "github", "gitlab", "docker", "kubernetes", "jenkins", "terraform", "ansible",
  // AI / ML / Data Science
  "tensorflow", "pytorch", "scikitlearn", "pandas", "numpy", "jupyter", "keras", "anaconda",
  // Cyber Security & Splunk
  "splunk", "wireshark", "kali", "owasp", "fortinet", "paloaltonetworks", "metasploit"
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

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
            <IconCloud iconSlugs={slugs} />
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
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              background: 'rgba(37, 99, 235, 0.08)',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(37, 99, 235, 0.1)',
              marginBottom: '16px'
            }}>
              <Sparkles size={18} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#2563eb' }}>
                CapstoneHub
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
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
                Password
              </label>
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
            CapstoneHub — Secure Unified Workspace Entrance.
          </p>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      </div>
    </div>
  )
}

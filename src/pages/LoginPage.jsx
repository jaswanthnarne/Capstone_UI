import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, Sparkles, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { unifiedLogin } from '../services/api'
import useAuthStore from '../store/authStore'
import IconCloud from '../components/ui/interactive-icon-cloud'

const slugs = [
  "typescript",
  "javascript",
  "java",
  "spring",
  "springboot",
  "python",
  "django",
  "flask",
  "react",
  "html5",
  "css3",
  "nodedotjs",
  "express",
  "mongodb",
  "postgresql",
  "mysql",
  "docker",
  "git",
  "github",
  "vercel",
  "amazonaws",
  "redux",
  "tailwindcss"
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '24px',
      fontFamily: "'Space Grotesk', sans-serif"
    }}>
      {/* Background Subtle Wave Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.4,
        backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '1000px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          zIndex: 10
        }}
      >
        {/* Left Side: Brand & High-Tech Animation */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          color: '#ffffff',
          overflow: 'hidden'
        }}>
          {/* Background Animated Shapes */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.25,
            pointerEvents: 'none'
          }}>
            <div style={{ width: '100%', maxWidth: '340px' }}>
              <IconCloud iconSlugs={slugs} />
            </div>
          </div>

          <div style={{ zIndex: 2 }}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
            >
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '6px',
                borderRadius: '8px',
                backdropFilter: 'blur(4px)'
              }}>
                <Sparkles size={18} className="text-white" />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>
                CapstoneHub Portal
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.15, margin: '16px 0 12px 0', letterSpacing: '-0.03em' }}
            >
              Accelerating Academic Project Excellence
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{ fontSize: '15px', lineHeight: 1.6, opacity: 0.8, maxWidth: '400px' }}
            >
              Access your training dashboard, trace project milestones, submit deliverables, and communicate metrics in real-time.
            </motion.p>
          </div>

          <div style={{ zIndex: 2, marginTop: '40px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 700 }}>20+</span>
                <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modules Available</span>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 700 }}>100%</span>
                <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Real-time Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Login Card */}
        <div style={{
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
              Enter your credentials to access your workspace
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

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </motion.div>
    </div>
  )
}

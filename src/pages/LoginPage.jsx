import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { unifiedLogin } from '../services/api'
import useAuthStore from '../store/authStore'
import TrainingJourneyHero from '../components/three/TrainingJourneyHero'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' })
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.usernameOrEmail || !form.password) {
      return toast.error('Both fields are required')
    }

    setLoading(true)
    try {
      const res = await unifiedLogin(form)
      login(res.data.token, res.data.user)
      toast.success(`Signed in successfully!`)
      if (res.data.user.role === 'trainer') {
        navigate('/trainer/dashboard')
      } else {
        navigate('/team/home')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowX: 'hidden',
      overflowY: 'auto',
      padding: '40px 20px',
      background: '#0B0E1A'
    }}>
      {/* Background visual connections grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, pointerEvents: 'none' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="grid-2-responsive" style={{ width: '100%', maxWidth: 1000, zIndex: 10, alignItems: 'center', gap: 40 }}>
        {/* Left Column: Public Constellation Galaxy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <h1 className="gradient-text" style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, margin: 0, lineHeight: 1.1 }}>
              CapstoneHub
            </h1>
            <p style={{ color: '#8B92A8', fontSize: 15, marginTop: 10, lineHeight: 1.5 }}>
              Connecting colleges, projects, and trainers in one unified training constellation. Browse ongoing work, milestones, and reports in real-time.
            </p>
          </div>
          <TrainingJourneyHero />
        </motion.div>

        {/* Right Column: Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}
        >
          <div className="glass gradient-border" style={{ borderRadius: 20, padding: 28, background: 'rgba(11, 14, 26, 0.4)' }}>
            <div className="text-center mb-6">
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#EDEFF5', margin: 0 }}>Portal Access</h2>
              <p style={{ fontSize: 13, color: '#8B92A8', marginTop: 4 }}>Sign in to enter your portal workspace</p>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 14px', background: 'rgba(59,130,246,0.08)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.15)' }}>
                <Users size={16} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>Trainer Email or Team Lead Account</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#8B92A8', display: 'block', marginBottom: 6, fontWeight: 500 }}>Username or Email</label>
                <input
                  id="login-username"
                  className="input-dark"
                  type="text"
                  placeholder="trainer@example.com or leadalpha"
                  value={form.usernameOrEmail}
                  onChange={e => setForm(f => ({ ...f, usernameOrEmail: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#8B92A8', display: 'block', marginBottom: 6, fontWeight: 500 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    className="input-dark"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    style={{ paddingRight: 40 }}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8B92A8', cursor: 'pointer' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-btn"
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Sign In'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', color: '#8B92A8', fontSize: 12, marginTop: 16 }}>
            CapstoneHub — Sign in to access your custom workspace.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

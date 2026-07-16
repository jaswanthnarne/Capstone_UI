import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Sparkles, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../services/api'
import IconCloud from '../components/ui/interactive-icon-cloud'

const slugs = [
  // Languages & Core Web
  "typescript", "javascript", "openjdk", "spring", "springboot", "python", "django", "flask",
  "react", "angular", "vuedotjs", "svelte", "nextdotjs", "nuxt", "html5", "css3", "nodedotjs",
  "express", "graphql", "bootstrap", "tailwindcss", "redux", "dart", "flutter",
  // Databases
  "mongodb", "postgresql", "mysql", "sqlite", "prisma", "sequelize",
  // Cloud & Media Hosting
  "amazonwebservices", "googlecloud", "digitalocean", "vercel", "netlify", "heroku", "cloudinary", "firebase",
  // Developer Tools & Testing
  "postman", "git", "github", "gitlab", "docker", "kubernetes", "jenkins", "terraform", "ansible",
  // AI / ML / Data Science
  "tensorflow", "pytorch", "scikitlearn", "pandas", "numpy", "jupyter", "keras", "anaconda",
  // Cyber Security & Splunk
  "splunk", "wireshark", "kalilinux", "owasp", "fortinet", "paloaltonetworks", "metasploit"
];

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [success, setSuccess] = useState(false)

  const memoizedCloud = useMemo(() => (
    <IconCloud iconSlugs={slugs} />
  ), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.newPassword || !form.confirmPassword) {
      return toast.error('Please fill in all fields')
    }

    if (form.newPassword !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }

    if (form.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long')
    }

    setLoading(true)
    try {
      await resetPassword({ token, newPassword: form.newPassword })
      toast.success('Password reset successful!')
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Link may be expired.')
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
      {/* Background Radial Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.35,
        backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Grid Layout matching LoginPage */}
      <div className="grid-2-responsive" style={{
        width: '100%',
        maxWidth: '1150px',
        alignItems: 'center',
        gap: '48px',
        zIndex: 10
      }}>
        {/* Left Side: Dense Cloud */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '500px' }}>
            {memoizedCloud}
          </div>
        </div>

        {/* Right Side: Reset Password Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
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
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'rgba(16, 185, 129, 0.1)', 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%',
                marginBottom: '24px'
              }}>
                <CheckCircle2 size={36} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
                Password Updated!
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Your password has been reset successfully. Redirecting you to the sign-in screen...
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
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
                    Ethnotech ProjectSpace
                  </span>
                </div>

                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  Set New Password
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', lineHeight: 1.5 }}>
                  Please choose a strong, secure password for your account access.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.newPassword}
                      onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
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
                        cursor: 'pointer'
                      }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
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

                <button
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
                >
                  {loading ? 'Resetting Password...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

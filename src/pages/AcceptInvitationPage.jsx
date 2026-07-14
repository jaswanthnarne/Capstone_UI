import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { acceptInvitation } from '../services/api'
import { motion } from 'framer-motion'

export default function AcceptInvitationPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No token provided in invitation link.')
      return
    }

    acceptInvitation(token)
      .then(() => {
        setStatus('success')
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.response?.data?.message || 'Failed to accept invitation. The invitation may have expired or been already accepted.')
      })
  }, [token])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-base)',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '40px 30px',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid #cbd5e1'
        }}
      >
        {status === 'processing' && (
          <div>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-accent)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-text-primary)' }}>Accepting Invitation</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '10px' }}>Verifying your credentials with the Capstone Project registry...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} style={{ color: 'var(--color-success)' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success)' }}>Successfully Joined!</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '10px', lineHeight: '1.6' }}>
              You have successfully accepted the invitation and joined your project team.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
            >
              Go to Portal
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={36} style={{ color: 'var(--color-danger)' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-danger)' }}>Invitation Expired</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '10px', lineHeight: '1.6' }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary"
              style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
            >
              Back to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

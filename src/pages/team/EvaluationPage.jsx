import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Award, MessageSquare, TrendingUp, Clock } from 'lucide-react'
import { getMyEvaluation } from '../../services/api'
import { LoadingSpinner } from '../../components/ui'

function ScoreGauge({ score }) {
  const pct = (score / 100) * 100
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#ea580c' : '#dc2626'

  return (
    <div style={{ position: 'relative', width: 140, height: 70, margin: '0 auto' }}>
      <svg width="140" height="70" viewBox="0 0 140 70">
        <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M 10 70 A 60 60 0 0 1 130 70"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 188} 188`}
        />
      </svg>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>out of 100</div>
      </div>
    </div>
  )
}

export default function EvaluationPage() {
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getMyEvaluation()
      .then(r => setEvaluation(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  if (notFound || !evaluation) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Evaluation</h1></div>
        <div className="glass" style={{ borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Clock size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>Awaiting Evaluation</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Your trainer hasn't evaluated your project yet. Check back after your submission has been reviewed.
          </p>
        </div>
      </div>
    )
  }

  const score = evaluation.score
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D'
  const gradeColor = score >= 75 ? '#16a34a' : score >= 50 ? '#ea580c' : '#dc2626'

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: -1 }}>Your Evaluation</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 6 }}>Evaluated by: {evaluation.trainerId?.name || 'Trainer'}</p>
      </div>

      <div className="grid-2-responsive" style={{ marginBottom: 20 }}>

        {/* Score card */}
        <motion.div className="glass" style={{ borderRadius: 20, padding: 28, textAlign: 'center', border: `1px solid ${gradeColor}20` }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Overall Score</div>
          <ScoreGauge score={score} />
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: gradeColor }}>{grade}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {new Date(evaluation.evaluatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>

        {/* Criteria breakdown */}
        <motion.div className="glass" style={{ borderRadius: 20, padding: 22 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>Score Breakdown</div>
          {evaluation.criteria && Object.entries(evaluation.criteria).map(([key, val]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{val}/25</span>
              </div>
              <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(val / 25) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #2563eb, #3b82f6)', borderRadius: 3 }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Feedback */}
      {evaluation.feedback && (
        <motion.div className="glass" style={{ borderRadius: 16, padding: 22, border: '1px solid rgba(37,99,235,0.15)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <MessageSquare size={16} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Trainer Feedback</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {evaluation.feedback}
          </div>
        </motion.div>
      )}
    </div>
  )
}

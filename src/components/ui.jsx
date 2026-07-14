import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 size={size} className="animate-spin text-blue-500" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p style={{ color: '#5c5c7b', fontSize: 14 }}>Loading CapstoneHub...</p>
      </div>
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color = '#3b82f6', sub }) {
  return (
    <motion.div
      className="glass card-lift rounded-2xl p-6"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: -1 }}>
        {value}
      </div>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 2 }}>{sub}</div>}
    </motion.div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    submitted: { label: 'Submitted', cls: 'badge-green' },
    in_progress: { label: 'In Progress', cls: 'badge-amber' },
    problem_pending: { label: 'Pending', cls: 'badge-gray' },
    overdue: { label: 'Overdue', cls: 'badge-red' },
    done: { label: 'Done', cls: 'badge-green' },
    pending: { label: 'Pending', cls: 'badge-gray' },
    active: { label: 'Active', cls: 'badge-blue' },
    upcoming: { label: 'Upcoming', cls: 'badge-purple' },
    completed: { label: 'Completed', cls: 'badge-green' },
  }
  const cfg = map[status] || { label: status, cls: 'badge-gray' }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

export function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="glass"
        style={{
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: wide ? 720 : 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #cbd5e1',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8,
              color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px 10px', fontSize: 16,
            }}
          >✕</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

export function FormField({ label, id, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
          {label}
        </label>
      )}
      {children}
      {error && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      <div
        style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--color-accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}
      >
        <Icon size={28} style={{ color: 'var(--color-accent)' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: action ? 20 : 0 }}>{description}</p>
      {action}
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

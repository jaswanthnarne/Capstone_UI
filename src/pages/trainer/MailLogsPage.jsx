import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Search, RefreshCw, CheckCircle, AlertCircle, Send, Inbox, ShieldCheck, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMailLogs } from '../../services/api'
import { SectionHeader, LoadingSpinner, EmptyState } from '../../components/ui'

export default function MailLogsPage() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = async () => {
    try {
      const res = await getMailLogs({ search, status: statusFilter, type: typeFilter })
      setLogs(res.data.data || [])
      if (res.data.stats) setStats(res.data.stats)
    } catch (err) {
      toast.error('Failed to load email logs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [statusFilter, typeFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    fetchLogs()
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchLogs()
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'tl_credentials':
        return <span className="badge badge-blue">TL Credentials</span>
      case 'member_invitation':
        return <span className="badge badge-purple">Member Invite</span>
      case 'password_reset':
        return <span className="badge badge-orange">Password Reset</span>
      case 'test_mail':
        return <span className="badge badge-gray">Test Email</span>
      default:
        return <span className="badge badge-gray">General Mail</span>
    }
  }

  const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 100

  return (
    <div>
      <SectionHeader
        title="Email Audit Logs"
        subtitle="Track real-time SMTP delivery logs, credentials mail status, and dispatch history"
        action={
          <button
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            Refresh Logs
          </button>
        }
      />

      {/* Summary Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass" style={{ borderRadius: 16, padding: 20, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
            <Send size={16} style={{ color: '#3b82f6' }} /> Total Dispatches
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{stats.total}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Recorded SMTP transactions</div>
        </div>

        <div className="glass" style={{ borderRadius: 16, padding: 20, borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
            <CheckCircle size={16} style={{ color: '#10b981' }} /> Delivered Successfully
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981', marginTop: 8 }}>{stats.sent}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Accepted by relay server</div>
        </div>

        <div className="glass" style={{ borderRadius: 16, padding: 20, borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
            <AlertCircle size={16} style={{ color: '#ef4444' }} /> Failed Delivery
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: stats.failed > 0 ? '#ef4444' : '#0f172a', marginTop: 8 }}>{stats.failed}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Rejected or SMTP offline</div>
        </div>

        <div className="glass" style={{ borderRadius: 16, padding: 20, borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
            <ShieldCheck size={16} style={{ color: '#8b5cf6' }} /> Success Rate
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#8b5cf6', marginTop: 8 }}>{successRate}%</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Overall delivery reliability</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass" style={{ borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 280px', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="input-dark"
              style={{ paddingLeft: 36, fontSize: 13 }}
              placeholder="Search recipient email or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <select
              className="input-dark"
              style={{ padding: '8px 12px', fontSize: 13 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent (Success)</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <select
              className="input-dark"
              style={{ padding: '8px 12px', fontSize: 13 }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All Email Types</option>
              <option value="tl_credentials">TL Credentials</option>
              <option value="member_invitation">Member Invitation</option>
              <option value="password_reset">Password Reset</option>
              <option value="test_mail">Test Mail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No Email Logs Found"
          description="No outgoing email records match your filter criteria."
        />
      ) : (
        <motion.div
          className="glass"
          style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Recipient Email</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Subject</th>
                  <th style={{ padding: '12px 16px' }}>Dispatched At</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Details / Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} className="hover:bg-slate-50">
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {log.to}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {getTypeBadge(log.type)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.subject}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                      {new Date(log.sentAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {log.status === 'sent' ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> SENT
                        </span>
                      ) : (
                        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertCircle size={12} /> FAILED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: log.status === 'failed' ? '#ef4444' : '#64748b', fontSize: 12 }}>
                      {log.status === 'failed' ? (
                        <span style={{ fontWeight: 600 }}>{log.error || 'SMTP delivery rejected'}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', italic: true }}>Delivered via Brevo Relay</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, Users, Building2, Layers, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getPortfolioReport, getBatches, getColleges,
  getBatchReport, getCollegeReport,
  exportBatchPDF, exportStudentsExcel,
} from '../../services/api'
import { StatCard, SectionHeader, LoadingSpinner } from '../../components/ui'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [portfolio, setPortfolio] = useState(null)
  const [batches, setBatches] = useState([])
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedCollege, setSelectedCollege] = useState('')

  useEffect(() => {
    Promise.all([getPortfolioReport(), getBatches(), getColleges()])
      .then(([p, b, c]) => {
        setPortfolio(p.data.data)
        setBatches(b.data.data)
        setColleges(c.data.data)
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async (type, id) => {
    setExporting(type)
    try {
      let res, filename
      if (type === 'batch-pdf') {
        res = await exportBatchPDF(id)
        filename = `batch_${id}_report.pdf`
      } else if (type === 'students-excel') {
        res = await exportStudentsExcel(id ? { batchId: id } : {})
        filename = 'students_export.xlsx'
      }
      downloadBlob(res.data, filename)
      toast.success(`${filename} downloaded!`)
    } catch { toast.error('Export failed') }
    finally { setExporting('') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <SectionHeader title="Reports & Analytics" subtitle="Export batch reports, college summaries, and student-level data" />

      {/* Portfolio Stats */}
      {portfolio && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 14 }}>
            <span className="gradient-text">Trainer Portfolio</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <StatCard label="Colleges Trained" value={portfolio.totalColleges || 0} icon={Building2} color="#3b82f6" />
            <StatCard label="Total Batches" value={portfolio.totalBatches || 0} icon={Layers} color="#8b5cf6" />
            <StatCard label="Total Teams" value={portfolio.totalTeams || 0} icon={Users} color="#f59e0b" />
            <StatCard label="Students" value={portfolio.totalStudents || 0} icon={Users} color="#06b6d4" />
            <StatCard label="Capstones Done" value={portfolio.submittedCapstones || 0} icon={TrendingUp} color="#10b981" />
            <StatCard
              label="Completion Rate"
              value={`${(portfolio.completionRate || 0).toFixed(1)}%`}
              icon={BarChart3}
              color="#ef4444"
              sub={portfolio.avgScore ? `Avg score: ${portfolio.avgScore.toFixed(1)}/100` : undefined}
            />
          </div>
        </div>
      )}

      {/* Export actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>

        {/* Batch Progress Report */}
        <motion.div className="glass" style={{ borderRadius: 16, padding: 22 }} whileHover={{ y: -3 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(59,130,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Batch Progress Report</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>All teams in one batch: problem, milestone, score</div>
            </div>
          </div>
          <select id="report-batch-select" className="input-dark" style={{ marginBottom: 12 }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
            <option value="">Select a batch...</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name} — {b.collegeId?.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="export-batch-pdf"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              onClick={() => selectedBatch && handleExport('batch-pdf', selectedBatch)}
              disabled={!selectedBatch || exporting === 'batch-pdf'}
            >
              {exporting === 'batch-pdf' ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Download size={14} /> PDF</>}
            </button>
          </div>
        </motion.div>

        {/* Student Level Export */}
        <motion.div className="glass" style={{ borderRadius: 16, padding: 22 }} whileHover={{ y: -3 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(16,185,129,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Student-Level Export</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Flat list: name, roll no, team, GitHub, score</div>
            </div>
          </div>
          <select id="report-student-batch" className="input-dark" style={{ marginBottom: 12 }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
            <option value="">All batches (full export)</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <button
            id="export-students-excel"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
            onClick={() => handleExport('students-excel', selectedBatch)}
            disabled={exporting === 'students-excel'}
          >
            {exporting === 'students-excel' ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Download size={14} /> Excel (.xlsx)</>}
          </button>
        </motion.div>

        {/* College Summary */}
        <motion.div className="glass" style={{ borderRadius: 16, padding: 22 }} whileHover={{ y: -3 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(139,92,246,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>College Summary</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>All batches in a college: completion %, avg scores</div>
            </div>
          </div>
          <select id="report-college-select" className="input-dark" style={{ marginBottom: 12 }} value={selectedCollege} onChange={e => setSelectedCollege(e.target.value)}>
            <option value="">Select a college...</option>
            {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button
            id="view-college-report"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
            onClick={async () => {
              if (!selectedCollege) return
              try {
                const r = await getCollegeReport(selectedCollege)
                toast.success(`College report: ${r.data.data.batches.length} batches`)
              } catch { toast.error('Failed to load report') }
            }}
            disabled={!selectedCollege}
          >
            <BarChart3 size={14} /> View Report
          </button>
        </motion.div>

      </div>
    </div>
  )
}

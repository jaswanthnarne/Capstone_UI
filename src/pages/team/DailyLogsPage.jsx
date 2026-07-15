import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Save, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyTeam, saveDailyLog, getMyDailyLogs } from '../../services/api'

export default function DailyLogsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [team, setTeam] = useState(null)
  const [savedLogs, setSavedLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [logsForSelectedDate, setLogsForSelectedDate] = useState([])
  const [availableDates, setAvailableDates] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [teamRes, logsRes] = await Promise.all([getMyTeam(), getMyDailyLogs()])
      const teamData = teamRes.data.data
      setTeam(teamData)
      setSavedLogs(logsRes.data.data)

      // Generate list of dates from startDate to endDate
      const start = teamData.batchId?.startDate ? new Date(teamData.batchId.startDate) : new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      const end = teamData.batchId?.endDate ? new Date(teamData.batchId.endDate) : new Date()
      
      const dates = []
      let current = new Date(start)
      const today = new Date()
      
      // Limit end date to today if project end is in the future
      const actualEnd = end > today ? today : end

      while (current <= actualEnd) {
        dates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
      
      // Reverse so newest dates are first
      dates.reverse()
      setAvailableDates(dates)

      if (dates.length > 0) {
        setSelectedDate(dates[0])
        loadLogForDate(dates[0], teamData, logsRes.data.data)
      }
    } catch (err) {
      toast.error('Failed to load team data or logs')
    } finally {
      setLoading(false)
    }
  }

  const loadLogForDate = (date, teamData, allLogs) => {
    const existingLog = allLogs.find(l => l.date === date)
    
    // Build list of team members (Lead + Members)
    const membersList = []
    
    // Add Team Lead
    membersList.push({
      name: teamData.leadName || teamData.leadUsername,
      rollNumber: teamData.usnRollNumber || 'Team Lead',
      taskDone: ''
    })

    // Add other members
    if (teamData.members && teamData.members.length > 0) {
      teamData.members.forEach(m => {
        membersList.push({
          name: m.name,
          rollNumber: m.rollNumber,
          taskDone: ''
        })
      })
    }

    if (existingLog) {
      // Map existing entries, overlaying them on membersList
      const mapped = membersList.map(m => {
        const found = existingLog.logs.find(el => el.rollNumber === m.rollNumber || el.name === m.name)
        return {
          ...m,
          taskDone: found ? found.taskDone : ''
        }
      })
      setLogsForSelectedDate(mapped)
    } else {
      setLogsForSelectedDate(membersList)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    loadLogForDate(date, team, savedLogs)
  }

  const handleTaskChange = (index, value) => {
    const updated = [...logsForSelectedDate]
    updated[index].taskDone = value
    setLogsForSelectedDate(updated)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Validation
    const emptyLog = logsForSelectedDate.some(l => !l.taskDone.trim())
    if (emptyLog) {
      return toast.error('Please enter the work details for all team members')
    }

    setSaving(true)
    try {
      const res = await saveDailyLog({
        date: selectedDate,
        logs: logsForSelectedDate
      })
      
      // Update savedLogs list local state
      const updatedLogs = [...savedLogs]
      const idx = updatedLogs.findIndex(l => l.date === selectedDate)
      if (idx !== -1) {
        updatedLogs[idx] = res.data.data
      } else {
        updatedLogs.push(res.data.data)
      }
      setSavedLogs(updatedLogs)
      
      toast.success(`Daily log for ${selectedDate} saved successfully!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save daily log')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Daily Work Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Submit daily status report for each team member according to the project calendar.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-slate-500" />
          <select
            value={selectedDate}
            onChange={e => handleDateChange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {availableDates.map(date => {
              const isLogged = savedLogs.some(l => l.date === date)
              return (
                <option key={date} value={date}>
                  {date} {isLogged ? '✓ (Logged)' : '• (Pending)'}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {availableDates.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">No dates are active inside your batch calendar yet.</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Team Candidate Logs for {selectedDate}</span>
              {savedLogs.some(l => l.date === selectedDate) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle size={12} /> Log Submitted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock size={12} /> Pending Submission
                </span>
              )}
            </div>

            <div className="p-6 divide-y divide-slate-100 space-y-6">
              {logsForSelectedDate.map((member, index) => (
                <div key={index} className="pt-6 first:pt-0 flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-full md:w-1/4">
                    <h3 className="font-semibold text-slate-800 text-sm leading-5">{member.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{member.rollNumber}</p>
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder={`Enter the specific tasks completed by ${member.name} today...`}
                      value={member.taskDone}
                      onChange={e => handleTaskChange(index, e.target.value)}
                      required
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 justify-center px-6 py-2.5"
              style={{ padding: '10px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Save size={16} />
              )}
              <span>{savedLogs.some(l => l.date === selectedDate) ? 'Update Daily Log' : 'Submit Daily Log'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

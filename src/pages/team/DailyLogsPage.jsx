import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Save, CheckCircle, AlertCircle, Clock, FileText, ChevronRight, Lock, Unlock } from 'lucide-react'
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
  const [expandedLogId, setExpandedLogId] = useState(null) // ID of log to expand in the table

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

      // Generate list of dates from startDate to endDate (e.g. 2026-07-13 to 2026-07-19)
      const rawStart = teamData.batchId?.startDate ? teamData.batchId.startDate.split('T')[0] : '2026-07-13'
      const rawEnd = teamData.batchId?.endDate ? teamData.batchId.endDate.split('T')[0] : '2026-07-19'
      
      const start = new Date(rawStart + 'T00:00:00')
      const end = new Date(rawEnd + 'T00:00:00')
      
      const dates = []
      let current = new Date(start)

      while (current <= end) {
        const yyyy = current.getFullYear()
        const mm = String(current.getMonth() + 1).padStart(2, '0')
        const dd = String(current.getDate()).padStart(2, '0')
        dates.push(`${yyyy}-${mm}-${dd}`)
        current.setDate(current.getDate() + 1)
      }
      
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

  const currentLog = savedLogs.find(l => l.date === selectedDate)
  const currentChangeCount = currentLog ? currentLog.changeCount || 0 : 0
  const isLocked = currentChangeCount >= 3

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-2 space-y-10">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            {/* Warning if Locked */}
            {isLocked && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm font-medium">
                  <strong>Edit Limit Reached (3/3):</strong> You have hit the maximum limit of 3 edits/submissions for this log date. 
                  This log is now locked. Please contact the administrator/trainer to request an edit limit override.
                </div>
              </div>
            )}

            <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${isLocked ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'}`}>
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-700">Team Candidate Logs for {selectedDate}</span>
                  {currentLog && (
                    <span className="text-xs text-slate-500 ml-3">
                      (Edits: <span className={isLocked ? 'text-rose-600 font-bold' : 'font-medium'}>{currentChangeCount}/3</span>)
                    </span>
                  )}
                </div>
                
                {isLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <Lock size={12} /> Log Locked
                  </span>
                ) : currentLog ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle size={12} /> Log Submitted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
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
                        placeholder={isLocked ? "This log is locked and cannot be edited." : `Enter the specific tasks completed by ${member.name} today...`}
                        value={member.taskDone}
                        onChange={e => handleTaskChange(index, e.target.value)}
                        required
                        disabled={isLocked}
                        rows={3}
                        className={`w-full border rounded-lg p-3 text-sm outline-none transition-all placeholder-slate-400
                          ${isLocked 
                            ? 'bg-slate-100/50 border-slate-200 text-slate-500 cursor-not-allowed' 
                            : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white'
                          }
                        `}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || isLocked}
                className={`btn-primary flex items-center gap-2 justify-center px-6 py-2.5
                  ${isLocked ? 'bg-slate-300 border-slate-300 text-slate-500 cursor-not-allowed shadow-none' : ''}
                `}
                style={{ padding: '10px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : isLocked ? (
                  <Lock size={16} />
                ) : (
                  <Save size={16} />
                )}
                <span>
                  {isLocked 
                    ? 'Log Locked (3/3 Edits)' 
                    : savedLogs.some(l => l.date === selectedDate) 
                      ? 'Update Daily Log' 
                      : 'Submit Daily Log'
                  }
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* BOTTOM SECTION: HISTORICAL SUBMITTED LOGS TABLE */}
      <div className="border-t border-slate-200 pt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">Submitted Logs Archive</h2>
          <p className="text-slate-500 text-xs mt-1">Review all daily status logs previously submitted for your team.</p>
        </div>

        {savedLogs.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
            No daily logs have been submitted yet.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                  <th className="p-4 w-12"></th>
                  <th className="p-4">Log Date</th>
                  <th className="p-4">Edit Count</th>
                  <th className="p-4">Daily Score</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedLogs.map((log) => {
                  const logIsLocked = log.changeCount >= 3
                  const isExpanded = expandedLogId === log._id

                  return (
                    <>
                      <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <ChevronRight size={18} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{log.date}</td>
                        <td className="p-4 text-slate-600 text-xs">
                          <span className={logIsLocked ? 'text-rose-600 font-bold' : 'font-medium'}>
                            {log.changeCount || 0} / 3 edits
                          </span>
                        </td>
                        <td className="p-4 text-xs font-bold">
                          {log.score !== null && log.isScoreReleased ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              ⭐ {log.score} / 100
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 font-medium">
                              Awaiting Release
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          {logIsLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Lock size={10} /> Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Unlock size={10} /> Editable
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDateChange(log.date)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Load to Edit
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Member Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={6} className="p-6 border-b border-slate-200">
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Task Breakdown:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.logs.map((item, keyIdx) => (
                                  <div key={keyIdx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-semibold text-slate-700 text-sm">{item.name}</span>
                                      <span className="text-[10px] text-slate-400">{item.rollNumber}</span>
                                    </div>
                                    <p className="text-slate-600 text-xs leading-relaxed mt-2 whitespace-pre-wrap bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                      {item.taskDone || 'No task entered.'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

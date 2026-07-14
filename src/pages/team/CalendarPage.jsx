import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, 
  CheckCircle2, Circle, Tag, AlertTriangle, AlertCircle, FileText, CheckSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

const CATEGORIES = {
  Development: { color: '#9333ea', bg: 'rgba(147, 51, 234, 0.08)' },
  Documentation: { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.08)' },
  Meeting: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' },
  Testing: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)' },
  Other: { color: '#475569', bg: 'rgba(71, 85, 105, 0.08)' }
}

const PRIORITIES = {
  High: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)' },
  Medium: { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.08)' },
  Low: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' }
}

export default function CalendarPage() {
  const { user } = useAuthStore()
  const storageKey = `capstone_todo_${user?.teamId || 'guest'}`

  // Current calendar view month/year
  const [currentDate, setCurrentDate] = useState(new Date())
  // Selected day for TODO list
  const [selectedDate, setSelectedDate] = useState(new Date())
  // Task database dictionary: { 'YYYY-MM-DD': [ { id, text, completed, category, priority } ] }
  const [tasks, setTasks] = useState({})
  
  // Form input states
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('Development')
  const [newTodoPriority, setNewTodoPriority] = useState('Medium')

  // Load tasks from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setTasks(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load tasks', e)
    }
  }, [storageKey])

  // Save tasks to LocalStorage
  const saveTasks = (newTasks) => {
    setTasks(newTasks)
    localStorage.setItem(storageKey, JSON.stringify(newTasks))
  }

  // Calendar Helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getFormattedKey = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const selectedDayKey = getFormattedKey(selectedDate)
  const dayTodos = tasks[selectedDayKey] || []

  // Add a new task for the selected day
  const handleAddTodo = (e) => {
    e.preventDefault()
    if (!newTodoText.trim()) return

    const newTodo = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      category: newTodoCategory,
      priority: newTodoPriority
    }

    const updated = {
      ...tasks,
      [selectedDayKey]: [...dayTodos, newTodo]
    }

    saveTasks(updated)
    setNewTodoText('')
    toast.success('Task added successfully')
  }

  // Toggle todo task completion status
  const handleToggleTodo = (id) => {
    const updatedList = dayTodos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    const updated = {
      ...tasks,
      [selectedDayKey]: updatedList
    }
    saveTasks(updated)
  }

  // Delete a task
  const handleDeleteTodo = (id) => {
    const updatedList = dayTodos.filter(todo => todo.id !== id)
    const updated = { ...tasks }
    if (updatedList.length === 0) {
      delete updated[selectedDayKey]
    } else {
      updated[selectedDayKey] = updatedList
    }
    saveTasks(updated)
    toast.success('Task removed')
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Render Calendar Grid Days
  const calendarDays = []
  // Fill preceding blank days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }
  // Fill actual calendar days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d))
  }

  const completedCount = dayTodos.filter(t => t.completed).length
  const totalCount = dayTodos.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          <CalendarIcon size={14} /> Lead Task Board
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
          Todo Calendar
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 4 }}>
          Schedule and organize project deliverables, milestones, and daily tasks.
        </p>
      </div>

      <div className="layout-split-calendar">
        
        {/* Calendar Grid card */}
        <motion.div 
          className="glass" 
          style={{ borderRadius: 20, padding: 24 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {monthNames[month]} {year}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                onClick={handlePrevMonth}
                className="btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextMonth}
                className="btn-secondary"
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', marginBottom: 12 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} style={{ height: 56 }} />
              
              const dateKey = getFormattedKey(date)
              const hasTodos = !!tasks[dateKey]
              const isSelected = selectedDayKey === dateKey
              const isToday = getFormattedKey(new Date()) === dateKey

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    height: 56,
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    background: isSelected 
                      ? 'var(--color-accent)' 
                      : isToday 
                        ? 'var(--color-accent-dim)' 
                        : '#f8fafc',
                    border: isSelected 
                      ? '1px solid var(--color-accent)' 
                      : isToday 
                        ? '1px solid var(--color-accent-light)' 
                        : '1px solid #e2e8f0',
                    color: isSelected 
                      ? '#ffffff' 
                      : isToday 
                        ? 'var(--color-accent)' 
                        : 'var(--color-text-primary)',
                    transition: 'all 0.15s ease'
                  }}
                  className={isSelected ? '' : 'glass-hover'}
                >
                  <span style={{ fontSize: 14, fontWeight: isToday || isSelected ? 700 : 500 }}>
                    {date.getDate()}
                  </span>
                  
                  {/* Indicator Dot */}
                  {hasTodos && (
                    <div style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: isSelected ? '#ffffff' : 'var(--color-accent)',
                      position: 'absolute',
                      bottom: 6
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Selected Day Checklist Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <motion.div 
            className="glass" 
            style={{ borderRadius: 20, padding: 24 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {totalCount === 0 ? 'No tasks scheduled' : `${completedCount} of ${totalCount} completed`}
                </div>
              </div>
              
              {totalCount > 0 && (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>
                  {progressPercent}%
                </div>
              )}
            </div>

            {totalCount > 0 && (
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', background: 'var(--color-accent)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
              </div>
            )}

            {/* Todo Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
              <AnimatePresence initial={false}>
                {dayTodos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)' }}>
                    <CheckSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                    <div style={{ fontSize: 13 }}>No tasks for today. Add one below!</div>
                  </div>
                ) : (
                  dayTodos.map(todo => {
                    const catCfg = CATEGORIES[todo.category] || CATEGORIES.Other
                    const priCfg = PRIORITIES[todo.priority] || PRIORITIES.Medium

                    return (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          overflow: 'hidden'
                        }}
                      >
                        <button 
                          onClick={() => handleToggleTodo(todo.id)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: todo.completed ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                        >
                          {todo.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontSize: 13, 
                            color: todo.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {todo.text}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: catCfg.bg, color: catCfg.color, fontWeight: 600 }}>
                              {todo.category}
                            </span>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: priCfg.bg, color: priCfg.color, fontWeight: 600 }}>
                              {todo.priority}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteTodo(todo.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-muted)', display: 'flex', padding: 4
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddTodo} style={{ borderTop: '1px solid #cbd5e1', paddingTop: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <input
                  className="input-dark"
                  placeholder="Task description..."
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                <select 
                  className="input-dark" 
                  style={{ fontSize: 12, padding: '6px 8px' }}
                  value={newTodoCategory}
                  onChange={e => setNewTodoCategory(e.target.value)}
                >
                  {Object.keys(CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select 
                  className="input-dark" 
                  style={{ fontSize: 12, padding: '6px 8px' }}
                  value={newTodoPriority}
                  onChange={e => setNewTodoPriority(e.target.value)}
                >
                  {Object.keys(PRIORITIES).map(p => (
                    <option key={p} value={p}>{p} Priority</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary" style={{ padding: '6px 12px' }}>
                  <Plus size={16} />
                </button>
              </div>
            </form>
          </motion.div>
          
        </div>
      </div>
    </div>
  )
}

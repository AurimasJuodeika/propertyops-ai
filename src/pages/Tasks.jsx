import { useState } from 'react'
import { CheckSquare, AlertTriangle, Clock, CheckCircle, Plus, Zap, Filter, User, X, Save } from 'lucide-react'
import { TASKS, getPropertyById, getStaffById } from '../data/mockData'

const TYPE_CONFIG = {
  compliance: { label: 'Compliance', color: '#dc2626', bg: '#fef2f2' },
  arrears: { label: 'Arrears', color: '#d97706', bg: '#fffbeb' },
  maintenance: { label: 'Maintenance', color: '#6366f1', bg: '#eef2ff' },
  tenancy: { label: 'Tenancy', color: '#0284c7', bg: '#eff6ff' },
  legal: { label: 'Legal', color: '#7c3aed', bg: '#ede9fe' },
  inspection: { label: 'Inspection', color: '#059669', bg: '#f0fdf4' },
  letting: { label: 'Letting', color: '#64748b', bg: '#f8fafc' },
}
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_CONFIG = {
  overdue: { label: 'Overdue', class: 'badge-red' },
  pending: { label: 'Pending', class: 'badge-amber' },
  in_progress: { label: 'In Progress', class: 'badge-blue' },
  completed: { label: 'Completed', class: 'badge-green' },
}

export default function Tasks() {
  const [filter, setFilter]       = useState('All')
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask]     = useState({ title: '', type: 'compliance', priority: 'medium', dueDate: '', notes: '' })
  const [customTasks, setCustomTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('propertyops_custom_tasks') || '[]') } catch { return [] }
  })

  const allTasks = [...TASKS, ...customTasks]
  const enriched = allTasks
    .map(t => ({
      ...t,
      property: getPropertyById(t.propertyId),
      assignee: getStaffById(t.assignedTo),
    }))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  const filtered = filter === 'All' ? enriched : enriched.filter(t => t.status === filter)

  const saveNewTask = () => {
    if (!newTask.title.trim()) return
    const task = { ...newTask, id: 'ct_' + Date.now(), status: 'pending', automated: false, propertyId: null, assignedTo: null }
    const updated = [task, ...customTasks]
    setCustomTasks(updated)
    localStorage.setItem('propertyops_custom_tasks', JSON.stringify(updated))
    setNewTask({ title: '', type: 'compliance', priority: 'medium', dueDate: '', notes: '' })
    setShowNewTask(false)
  }

  const overdue = enriched.filter(t => t.status === 'overdue').length
  const pending = enriched.filter(t => t.status === 'pending').length
  const inProgress = enriched.filter(t => t.status === 'in_progress').length
  const automated = enriched.filter(t => t.automated).length

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tasks & Workflows</h1>
          <p className="page-subtitle">{TASKS.length} tasks · {overdue} overdue · {automated} auto-generated</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setFilter('overdue')}><Zap size={13} /> Show Overdue</button>
          <button className="btn-primary" onClick={() => setShowNewTask(v => !v)}><Plus size={13} /> New Task</button>
        </div>
      </div>

      {overdue > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="#dc2626" />
          <p style={{ fontSize: 13.5, fontWeight: 700, color: '#991b1b' }}>
            {overdue} overdue task{overdue !== 1 ? 's' : ''} — including {enriched.filter(t => t.status === 'overdue' && t.type === 'compliance').length} compliance tasks
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Overdue', value: overdue, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Pending', value: pending, color: '#d97706', bg: '#fffbeb' },
          { label: 'In Progress', value: inProgress, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Auto-generated', value: automated, color: '#10b981', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}20` }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11.5, color: s.color, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick task form */}
      {showNewTask && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>New Task</p>
            <button onClick={() => setShowNewTask(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={15} color="#94a3b8" /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
              placeholder="Task title *" autoFocus
              style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', width: '100%', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='#e2e8f0'} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <select value={newTask.type} onChange={e => setNewTask(t => ({ ...t, type: e.target.value }))}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask(t => ({ ...t, dueDate: e.target.value }))}
                style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }} onClick={() => setShowNewTask(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 13 }} onClick={saveNewTask} disabled={!newTask.title.trim()}>
                <Save size={13} /> Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['All','overdue','pending','in_progress','completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filter === f ? 'none' : '1px solid #e2e8f0',
              background: filter === f
                ? f === 'overdue' ? '#dc2626' : f === 'pending' ? '#d97706' : '#0f172a'
                : 'white',
              color: filter === f ? 'white' : '#374151',
              textTransform: 'capitalize'
            }}>{f === 'All' ? `All Tasks (${TASKS.length})` : f.replace('_', ' ')}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(task => {
          const tc = TYPE_CONFIG[task.type] || TYPE_CONFIG.compliance
          const sc = STATUS_CONFIG[task.status]
          return (
            <div key={task.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: task.priority === 'critical' ? '#dc2626' : task.priority === 'high' ? '#f59e0b' : task.priority === 'medium' ? '#6366f1' : '#94a3b8' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{task.title}</p>
                  {task.automated && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Zap size={8} />AI
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: tc.bg, color: tc.color }}>{tc.label}</span>
                  {task.property && <span style={{ fontSize: 11.5, color: '#94a3b8' }}>📍 {task.property.address}</span>}
                  {task.assignee && <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} />{task.assignee.name}</span>}
                  {task.dueDate && <span style={{ fontSize: 11.5, color: task.status === 'overdue' ? '#dc2626' : '#94a3b8', fontWeight: task.status === 'overdue' ? 700 : 400, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />Due {task.dueDate}</span>}
                </div>
              </div>
              <span className={`badge ${sc?.class || 'badge-slate'}`}>{sc?.label || task.status}</span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {task.status !== 'completed' && (
                  <button className="btn-secondary" style={{ fontSize: 11, padding: '4px 8px' }}>
                    <CheckCircle size={10} /> Done
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

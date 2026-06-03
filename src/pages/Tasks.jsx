import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckSquare, AlertTriangle, Clock, CheckCircle, Plus, Zap, User,
  X, Save, Edit2, Trash2, MessageSquare, ChevronDown, ChevronUp,
  RotateCcw, Building2, Calendar, Flag, Filter
} from 'lucide-react'
import { TASKS, PROPERTIES, STAFF, getLandlordById, getTenantById, LANDLORDS, TENANTS } from '../data/mockData'
import {
  getAllStoredTasks, createTask, updateTask, deleteTask, addTaskNote,
  runWorkflowScan, CATEGORIES, PRIORITIES, STATUSES,
  PRIORITY_CONFIG, STATUS_CONFIG,
} from '../lib/taskStore'
import { TENANCIES, MAINTENANCE_JOBS, INSPECTIONS } from '../data/mockData'
import { addActivityEntry } from '../lib/activityLog'
import { getNewProperties } from '../lib/propertyOverrides'

// ─── New / Edit Task Modal ────────────────────────────────────────────────────
function TaskModal({ initial, onSave, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    title:          initial?.title || '',
    propertyId:     initial?.propertyId || '',
    category:       initial?.category || 'General',
    priority:       initial?.priority || 'medium',
    assignedTo:     initial?.assignedTo || '',
    dueDate:        initial?.dueDate || '',
    notes:          initial?.notes || '',
    status:         initial?.status || 'open',
  })
  const [errors, setErrors] = useState({})

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: null })) }

  const allProperties = [...PROPERTIES, ...getNewProperties()]
  const selectedProp  = allProperties.find(p => p.id === form.propertyId)
  const landlord      = selectedProp ? getLandlordById(selectedProp.landlordId) : null
  const tenant        = selectedProp ? getTenantById(selectedProp.tenantId) : null

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title    = 'Title is required'
    if (!form.dueDate)       e.dueDate  = 'Due date is required'
    if (!form.priority)      e.priority = 'Priority is required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const assignedStaff = STAFF.find(s => s.id === form.assignedTo)
    onSave({
      ...form,
      propertyAddress: selectedProp ? `${selectedProp.address}, ${selectedProp.postcode}` : null,
      tenantId:        tenant?.id || null,
      tenantName:      tenant?.name || null,
      landlordId:      landlord?.id || null,
      landlordName:    landlord?.name || null,
      assignedName:    assignedStaff?.name || null,
    })
    onClose()
  }

  const inp = { border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '9px 12px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', color: '#0f172a', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 5 }
  const focus = e => e.target.style.borderColor = '#10b981'
  const blur  = k => e => e.target.style.borderColor = errors[k] ? '#dc2626' : '#e2e8f0'

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', padding: 24 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div>
            <label style={lbl}>Task Title *</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Book Gas Safety renewal for 42 Moseley Road"
              style={{ ...inp, borderColor: errors.title ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur('title')} autoFocus />
            {errors.title && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.title}</p>}
          </div>

          {/* Property */}
          <div>
            <label style={lbl}>Linked Property</label>
            <select value={form.propertyId} onChange={set('propertyId')} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">— None —</option>
              {allProperties.map(p => <option key={p.id} value={p.id}>{p.address}, {p.postcode}</option>)}
            </select>
            {selectedProp && (
              <div style={{ display: 'flex', gap: 10, marginTop: 7 }}>
                {tenant && <p style={{ fontSize: 11.5, color: '#64748b' }}>👤 {tenant.name}</p>}
                {landlord && <p style={{ fontSize: 11.5, color: '#64748b' }}>🏢 {landlord.name}</p>}
              </div>
            )}
          </div>

          {/* Category + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={set('category')} style={{ ...inp, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Priority *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                {PRIORITIES.map(p => {
                  const cfg = PRIORITY_CONFIG[p]
                  return (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                      style={{ padding: '7px 4px', borderRadius: 8, border: form.priority === p ? `2px solid ${cfg.color}` : '1.5px solid #e2e8f0', background: form.priority === p ? cfg.bg : 'white', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: form.priority === p ? cfg.color : '#64748b', fontFamily: 'inherit', textAlign: 'center', textTransform: 'capitalize' }}>
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Assigned + Due date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Assigned To</label>
              <select value={form.assignedTo} onChange={set('assignedTo')} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Unassigned —</option>
                {STAFF.filter(s => s.role !== 'Agency Owner').map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Due Date *</label>
              <input type="date" value={form.dueDate} onChange={set('dueDate')}
                style={{ ...inp, borderColor: errors.dueDate ? '#dc2626' : '#e2e8f0' }} onFocus={focus} onBlur={blur('dueDate')} />
              {errors.dueDate && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.dueDate}</p>}
            </div>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={set('status')} style={{ ...inp, cursor: 'pointer' }}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Additional context or instructions…"
              style={{ ...inp, resize: 'none' }} onFocus={focus} onBlur={blur('notes')} />
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave}>
              <Save size={14} /> {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Workflow Scan Result Panel ───────────────────────────────────────────────
function ScanPanel({ suggestions, onCreateTask, onCreateAll, onClose }) {
  const [selected, setSelected] = useState(new Set(suggestions.map((_, i) => i)))
  const toggle = i => setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })

  const typeColor = { critical: '#dc2626', warning: '#d97706', info: '#2563eb' }
  const typeBg    = { critical: '#fef2f2', warning: '#fffbeb', info: '#eff6ff' }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 69 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 70, background: 'white', borderRadius: 16, width: 600, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={17} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Workflow Scan Complete</h2>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Demo scan — based on current demo data</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'Critical', count: suggestions.filter(s => s.type === 'critical').length, color: '#dc2626' },
                  { label: 'Warnings', count: suggestions.filter(s => s.type === 'warning').length, color: '#d97706' },
                  { label: 'Info', count: suggestions.filter(s => s.type === 'info').length, color: '#2563eb' },
                ].map(({ label, count, color }) => count > 0 && (
                  <span key={label} style={{ fontSize: 12, fontWeight: 700, color, background: `${color}15`, padding: '3px 9px', borderRadius: 20 }}>
                    {count} {label}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>{suggestions.length} items found — select to create tasks</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelected(new Set(suggestions.map((_, i) => i)))}
                style={{ fontSize: 11.5, fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Select all
              </button>
              <button onClick={() => setSelected(new Set())}
                style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Clear
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {suggestions.map((s, i) => (
              <div key={i}
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 9, background: selected.has(i) ? typeBg[s.type] : '#f8fafc', border: `1px solid ${selected.has(i) ? typeColor[s.type] + '30' : '#f1f5f9'}`, cursor: 'pointer', transition: 'all 0.12s' }}
                onClick={() => toggle(i)}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected.has(i) ? typeColor[s.type] : '#e2e8f0'}`, background: selected.has(i) ? typeColor[s.type] : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {selected.has(i) && <CheckCircle size={11} color="white" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.title}</p>
                  <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{s.detail}</p>
                  <div style={{ display: 'flex', gap: 7, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 8, background: `${typeColor[s.type]}15`, color: typeColor[s.type] }}>
                      {s.type === 'critical' ? '⚠ Critical' : s.type === 'warning' ? '⚡ Warning' : 'ℹ Info'}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8' }}>{s.category}</span>
                    {s.propertyAddress && <span style={{ fontSize: 10.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>📍 {s.propertyAddress}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Dismiss</button>
          <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}
            disabled={selected.size === 0}
            onClick={() => { onCreateAll(suggestions.filter((_, i) => selected.has(i))); onClose() }}>
            <Plus size={14} /> Create {selected.size} Task{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Task Row ────────────────────────────────────────────────────────────────
function TaskRow({ task, onUpdate, onDelete, isMock }) {
  const [expanded, setExpanded]   = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [notes, setNotes]         = useState(task.activityNotes || [])
  const [confirmDelete, setConfirmDelete] = useState(false)

  const pc  = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const sc  = STATUS_CONFIG[task.status]     || STATUS_CONFIG.open
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'

  const handleAddNote = () => {
    if (!noteInput.trim()) return
    if (!isMock) {
      const note = addTaskNote(task.id, { text: noteInput.trim() })
      setNotes(n => [note, ...n])
    }
    setNoteInput('')
  }

  const handleStatusChange = (status) => {
    if (!isMock) onUpdate(task.id, { status })
  }

  return (
    <div style={{ background: 'white', borderRadius: 10, border: `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}>
        {/* Priority dot */}
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: pc.dot, flexShrink: 0, marginTop: 6 }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{task.title}</p>
            <span className={`badge ${sc.class}`}>{sc.label}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: pc.bg, color: pc.color, textTransform: 'capitalize' }}>{pc.label}</span>
            {task.category && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', background: '#f8fafc', padding: '2px 7px', borderRadius: 8 }}>{task.category}</span>}
            {isMock && <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>DEMO</span>}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {task.propertyAddress && <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><Building2 size={10} />{task.propertyAddress?.split(',')[0]}</span>}
            {task.assignedName && <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} />{task.assignedName}</span>}
            {task.dueDate && (
              <span style={{ fontSize: 11.5, color: isOverdue ? '#dc2626' : '#94a3b8', fontWeight: isOverdue ? 700 : 400, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={10} />{isOverdue ? 'Overdue — ' : ''}Due {new Date(task.dueDate).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Quick complete */}
          {task.status !== 'completed' && task.status !== 'cancelled' && !isMock && (
            <button onClick={e => { e.stopPropagation(); handleStatusChange('completed') }}
              title="Mark complete"
              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #bbf7d0', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <CheckCircle size={13} color="#10b981" />
            </button>
          )}
          {expanded ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 16px', background: '#fafafa' }}>
          {/* Notes */}
          {task.notes && (
            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.6, marginBottom: 12, padding: '8px 10px', background: 'white', borderRadius: 7, border: '1px solid #f1f5f9' }}>
              {task.notes}
            </p>
          )}

          {/* Linked info */}
          {(task.tenantName || task.landlordName) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12.5, color: '#64748b' }}>
              {task.tenantName && <span>👤 Tenant: {task.tenantName}</span>}
              {task.landlordName && <span>🏢 Landlord: {task.landlordName}</span>}
            </div>
          )}

          {/* Status buttons */}
          {!isMock && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 7 }}>Status</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    style={{ padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit', background: task.status === s ? '#0f172a' : '#f1f5f9', color: task.status === s ? 'white' : '#64748b', outline: task.status === s ? '2px solid #10b981' : 'none', textTransform: 'capitalize' }}>
                    {STATUS_CONFIG[s]?.label || s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activity notes */}
          {notes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 8 }}>Activity</p>
              {notes.slice(0, 3).map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <p style={{ fontSize: 12.5, color: '#334155' }}>{n.text}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{n.author} · {n.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add note */}
          {!isMock && (
            <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
              <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder="Add a note… (Enter)"
                style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 11px', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a' }} />
              <button className="btn-secondary" style={{ fontSize: 12, flexShrink: 0 }} onClick={handleAddNote}>
                <MessageSquare size={12} /> Note
              </button>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {!isMock && (
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => { setExpanded(false); onUpdate(task.id, null, 'edit') }}>
                <Edit2 size={12} /> Edit
              </button>
            )}
            {task.status !== 'completed' && !isMock && (
              <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => handleStatusChange('completed')}>
                <CheckCircle size={12} /> Mark Complete
              </button>
            )}
            {!isMock && !confirmDelete && (
              <button style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginLeft: 'auto' }}
                onClick={() => setConfirmDelete(true)}>
                <Trash2 size={12} /> Delete
              </button>
            )}
            {!isMock && confirmDelete && (
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Sure?</p>
                <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setConfirmDelete(false)}>No</button>
                <button style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }} onClick={() => onDelete(task.id)}>Yes, delete</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Tasks page ──────────────────────────────────────────────────────────
export default function Tasks() {
  const [storedTasks, setStoredTasks]   = useState(getAllStoredTasks)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCatFilter]  = useState('All')
  const [showNewTask, setShowNewTask]   = useState(false)
  const [editingTask, setEditingTask]   = useState(null)
  const [showScan, setShowScan]         = useState(false)
  const [scanResults, setScanResults]   = useState([])
  const [scanning, setScanning]         = useState(false)
  const [toast, setToast]               = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const refresh   = () => setStoredTasks(getAllStoredTasks())

  // Merge mock TASKS (read-only demo) + stored custom tasks
  const mockEnriched = TASKS.map(t => ({
    ...t,
    status:         t.status === 'overdue' ? 'open' : t.status === 'pending' ? 'open' : t.status === 'in_progress' ? 'in_progress' : t.status === 'completed' ? 'completed' : 'open',
    priority:       t.priority === 'critical' ? 'critical' : t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low',
    category:       t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : 'General',
    propertyAddress:t.propertyId ? (() => { const p = PROPERTIES.find(pr => pr.id === t.propertyId); return p ? `${p.address}, ${p.postcode}` : null })() : null,
    assignedName:   t.assignedTo ? STAFF.find(s => s.id === t.assignedTo)?.name : null,
    activityNotes:  [],
    dueDate:        t.dueDate || null,
    isMock:         true,
  }))

  const allTasks = [...storedTasks, ...mockEnriched]

  // Counts
  const openCount      = allTasks.filter(t => !['completed','cancelled'].includes(t.status)).length
  const overdueCount   = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !['completed','cancelled'].includes(t.status)).length
  const completedCount = allTasks.filter(t => t.status === 'completed').length

  // Filter
  const filtered = allTasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter ||
      (statusFilter === 'overdue' && t.dueDate && new Date(t.dueDate) < new Date() && !['completed','cancelled'].includes(t.status))
    const matchCat = categoryFilter === 'All' || t.category === categoryFilter
    return matchStatus && matchCat
  })

  const handleRunScan = async () => {
    setScanning(true)
    await new Promise(r => setTimeout(r, 800)) // simulate scan time
    const results = runWorkflowScan(PROPERTIES, TENANCIES, MAINTENANCE_JOBS, INSPECTIONS)
    setScanResults(results)
    setScanning(false)
    setShowScan(true)
  }

  const handleCreateFromScan = (suggestions) => {
    let count = 0
    suggestions.forEach(s => {
      createTask({
        title: s.title, propertyId: s.propertyId, propertyAddress: s.propertyAddress,
        category: s.category, priority: s.priority, dueDate: s.dueDate,
        notes: s.detail, source: 'workflow_scan',
      })
      if (s.propertyId) addActivityEntry(s.propertyId, { type: 'compliance', text: `Task created: ${s.title}` })
      count++
    })
    refresh()
    showToast(`${count} task${count !== 1 ? 's' : ''} created from workflow scan`)
  }

  const handleUpdate = (id, updates, action) => {
    if (action === 'edit') { setEditingTask(storedTasks.find(t => t.id === id)); return }
    updateTask(id, updates)
    refresh()
    if (updates?.status === 'completed') showToast('Task marked complete ✓')
  }

  const handleDelete = (id) => {
    deleteTask(id); refresh(); showToast('Task deleted')
  }

  const categories = ['All', ...new Set(allTasks.map(t => t.category).filter(Boolean))]

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Tasks & Workflows</h1>
          <p className="page-subtitle">{openCount} open · {overdueCount} overdue · {completedCount} completed</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={handleRunScan} disabled={scanning}>
            <Zap size={13} /> {scanning ? 'Scanning…' : 'Workflow Scan'}
          </button>
          <button className="btn-primary" onClick={() => setShowNewTask(true)}>
            <Plus size={13} /> New Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Open', value: openCount, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Overdue', value: overdueCount, color: '#dc2626', bg: '#fef2f2' },
          { label: 'From Scan', value: storedTasks.filter(t => t.source === 'workflow_scan').length, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Completed', value: completedCount, color: '#64748b', bg: '#f8fafc' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}20`, cursor: 'pointer' }}
            onClick={() => setStatusFilter(s.label === 'Open' ? 'open' : s.label === 'Overdue' ? 'overdue' : s.label === 'Completed' ? 'completed' : 'all')}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11.5, color: s.color, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All (${allTasks.length})` },
          { key: 'open', label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'waiting', label: 'Waiting' },
          { key: 'overdue', label: `Overdue (${overdueCount})` },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            style={{ padding: '6px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, background: statusFilter === f.key ? '#0f172a' : 'white', color: statusFilter === f.key ? 'white' : '#64748b', border: statusFilter === f.key ? 'none' : '1px solid #e2e8f0' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <Filter size={13} color="#94a3b8" style={{ alignSelf: 'center', flexShrink: 0 }} />
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            style={{ padding: '4px 11px', borderRadius: 20, border: categoryFilter === c ? 'none' : '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: categoryFilter === c ? '#10b981' : 'white', color: categoryFilter === c ? 'white' : '#64748b' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <CheckSquare size={40} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontWeight: 700, fontSize: 15, color: '#334155' }}>No tasks found</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            {statusFilter !== 'all' ? 'Try a different filter or ' : ''}
            <button onClick={() => setShowNewTask(true)} style={{ color: '#10b981', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>create a new task</button>
            {' '}or run the Workflow Scan to find issues automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {filtered.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              isMock={!!task.isMock}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: 'white', padding: '11px 22px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, zIndex: 80, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <CheckCircle size={15} color="#10b981" /> {toast}
        </div>
      )}

      {/* Modals */}
      {showNewTask && (
        <TaskModal
          onSave={(data) => {
            const task = createTask(data)
            refresh()
            if (task.propertyId) addActivityEntry(task.propertyId, { type: 'note', text: `Task created: ${task.title}` })
            showToast(`Task created: ${task.title}`)
            setShowNewTask(false)
          }}
          onClose={() => setShowNewTask(false)}
        />
      )}

      {editingTask && (
        <TaskModal
          initial={editingTask}
          onSave={(data) => {
            updateTask(editingTask.id, data)
            refresh()
            showToast('Task updated')
            setEditingTask(null)
          }}
          onClose={() => setEditingTask(null)}
        />
      )}

      {showScan && (
        <ScanPanel
          suggestions={scanResults}
          onCreateAll={handleCreateFromScan}
          onClose={() => setShowScan(false)}
        />
      )}
    </div>
  )
}

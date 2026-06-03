import { useState } from 'react'
import { Wrench, AlertTriangle, Clock, CheckCircle, Plus, Zap, Filter, ChevronRight, User, Calendar, PoundSterling } from 'lucide-react'
import { MAINTENANCE_JOBS, getPropertyById, getContractorById, MAINTENANCE_BY_MONTH } from '../data/mockData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const PRIORITY_CONFIG = {
  emergency: { label: 'Emergency', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  urgent: { label: 'Urgent', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  routine: { label: 'Routine', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  cosmetic: { label: 'Cosmetic', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
}
const STATUS_CONFIG = {
  new: { label: 'New', class: 'badge-blue' },
  triaged: { label: 'Triaged', class: 'badge-purple' },
  assigned: { label: 'Assigned', class: 'badge-amber' },
  in_progress: { label: 'In Progress', class: 'badge-blue' },
  completed: { label: 'Completed', class: 'badge-green' },
  on_hold: { label: 'On Hold', class: 'badge-slate' },
}

export default function Maintenance() {
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [expandedJob, setExpandedJob] = useState(null)

  const filtered = MAINTENANCE_JOBS.filter(j => {
    const matchPriority = priorityFilter === 'All' || j.priority === priorityFilter
    const matchStatus = statusFilter === 'All' || j.status === statusFilter
    return matchPriority && matchStatus
  })

  const openJobs = MAINTENANCE_JOBS.filter(j => j.status !== 'completed')
  const emergencyCount = openJobs.filter(j => j.priority === 'emergency').length
  const urgentCount = openJobs.filter(j => j.priority === 'urgent').length
  const totalEstimated = openJobs.reduce((s, j) => s + (j.estimatedCost || 0), 0)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Maintenance Management</h1>
          <p className="page-subtitle">{openJobs.length} open jobs · £{totalEstimated.toLocaleString()} estimated spend</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary"><Zap size={13} /> AI Triage All</button>
          <button className="btn-primary"><Plus size={13} /> Log Job</button>
        </div>
      </div>

      {/* Emergency alert */}
      {emergencyCount > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="#dc2626" />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', flex: 1 }}>
            {emergencyCount} emergency job{emergencyCount !== 1 ? 's' : ''} require immediate action
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid-cols-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Emergency', value: emergencyCount, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Urgent', value: urgentCount, color: '#d97706', bg: '#fffbeb' },
          { label: 'Routine', value: openJobs.filter(j => j.priority === 'routine').length, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Cosmetic', value: openJobs.filter(j => j.priority === 'cosmetic').length, color: '#64748b', bg: '#f8fafc' },
          { label: 'Est. Cost', value: `£${totalEstimated.toLocaleString()}`, color: '#6366f1', bg: '#eef2ff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${s.color}20` }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11.5, color: s.color, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="section-header">
          <p className="section-title">Maintenance Trend — Last 7 Months</p>
          <span className="badge badge-amber">Feb spike in emergency jobs</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={MAINTENANCE_BY_MONTH} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="emergency" name="Emergency" stackId="a" fill="#dc2626" />
            <Bar dataKey="urgent" name="Urgent" stackId="a" fill="#f59e0b" />
            <Bar dataKey="routine" name="Routine" stackId="a" fill="#10b981" />
            <Bar dataKey="cosmetic" name="Cosmetic" stackId="a" fill="#94a3b8" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['All','emergency','urgent','routine','cosmetic'].map(p => (
          <button key={p} onClick={() => setPriorityFilter(p)}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              border: priorityFilter === p ? 'none' : '1px solid #e2e8f0',
              background: priorityFilter === p ? (PRIORITY_CONFIG[p]?.color || '#0f172a') : 'white',
              color: priorityFilter === p ? 'white' : '#374151',
              textTransform: 'capitalize'
            }}>{p === 'All' ? 'All Jobs' : p}</button>
        ))}
        <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
        {['All','new','triaged','assigned','in_progress','completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              border: statusFilter === s ? 'none' : '1px solid #e2e8f0',
              background: statusFilter === s ? '#0f172a' : 'white',
              color: statusFilter === s ? 'white' : '#374151',
              textTransform: 'capitalize'
            }}>{s === 'All' ? 'All Statuses' : s.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Job list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(job => {
          const property = getPropertyById(job.propertyId)
          const contractor = getContractorById(job.assignedTo)
          const pc = PRIORITY_CONFIG[job.priority]
          const sc = STATUS_CONFIG[job.status]
          const isExpanded = expandedJob === job.id

          return (
            <div key={job.id} className="card" style={{ overflow: 'visible' }}>
              <div
                onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                style={{
                  padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
                  borderLeft: `4px solid ${pc.color}`
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: pc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Wrench size={15} color={pc.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{job.title}</p>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: pc.bg, color: pc.color, textTransform: 'capitalize' }}>{pc.label}</span>
                    <span className={`badge ${sc.class}`}>{sc.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={11} />{job.tenantName}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      📍 {property?.address}, {property?.postcode}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} />Reported {job.reportedDate}
                    </span>
                    {job.dueDate && <span style={{ fontSize: 11.5, color: job.status !== 'completed' ? '#dc2626' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />Due {job.dueDate}
                    </span>}
                    {job.estimatedCost && <span style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PoundSterling size={11} />Est. £{job.estimatedCost}
                    </span>}
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {contractor && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '3px 8px', borderRadius: 6 }}>
                      {contractor.name}
                    </span>
                  )}
                  {!contractor && job.status === 'new' && (
                    <button className="btn-primary" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={e => e.stopPropagation()}>
                      Assign
                    </button>
                  )}
                  <ChevronRight size={14} color="#cbd5e1" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 18px', background: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 6 }}>Description</p>
                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{job.description}</p>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Zap size={13} color="#10b981" />
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981' }}>AI Triage Assessment</p>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.6 }}>{job.aiTriage}</p>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ fontSize: 12 }}>View Property</button>
                    <button className="btn-secondary" style={{ fontSize: 12 }}>Contact Tenant</button>
                    {!contractor && <button className="btn-primary" style={{ fontSize: 12 }}><Plus size={12} /> Assign Contractor</button>}
                    {job.status !== 'completed' && <button className="btn-secondary" style={{ fontSize: 12, marginLeft: 'auto', color: '#10b981', borderColor: '#bbf7d0' }}>Mark Complete</button>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Wrench, AlertTriangle, CheckCircle, Clock, Plus, Zap, ChevronRight, User, Calendar, PoundSterling, Mail, Send } from 'lucide-react'
import { MAINTENANCE_JOBS, getPropertyById, getContractorById, getLandlordById, getTenantById, MAINTENANCE_BY_MONTH, getJobNotes, addJobNote } from '../data/mockData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { sendMaintenanceUpdate, sendContractorAssignment, sendJobCompletionToLandlord } from '../lib/email'
import { getEffectiveJobStatus, setJobStatus, getJobStatuses } from '../lib/propertyOverrides'
import { triageMaintenanceJob, isAIConfigured } from '../lib/ai'

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
  const [statusFilter, setStatusFilter]     = useState('All')
  const [expandedJob, setExpandedJob]       = useState(null)
  const [jobStatuses, setJobStatuses]       = useState(getJobStatuses())
  const [noteText, setNoteText]             = useState({})
  const [notesMap, setNotesMap]             = useState({})

  const ALL_JOBS = MAINTENANCE_JOBS

  const handleStatusChange = (jobId, status) => {
    setJobStatus(jobId, status)
    setJobStatuses(getJobStatuses())
  }

  const handleAddNote = (jobId) => {
    const text = noteText[jobId]?.trim()
    if (!text) return
    addJobNote(jobId, text)
    setNotesMap(m => ({ ...m, [jobId]: getJobNotes(jobId) }))
    setNoteText(t => ({ ...t, [jobId]: '' }))
  }

  const getStatus = (job) => jobStatuses[job.id]?.status ?? job.status
  const getNotes  = (job) => notesMap[job.id] ?? getJobNotes(job.id)
  const [aiTriageMap, setAiTriageMap]       = useState({})
  const [triagingId, setTriagingId]         = useState(null)

  const handleAITriage = async (job) => {
    const property = getPropertyById(job.propertyId)
    setTriagingId(job.id)
    try {
      const result = await triageMaintenanceJob({ job, property })
      setAiTriageMap(m => ({ ...m, [job.id]: result }))
    } catch (e) {
      setAiTriageMap(m => ({ ...m, [job.id]: 'Failed: ' + e.message }))
    }
    setTriagingId(null)
  }
  const [sending, setSending]               = useState(null) // jobId currently sending
  const [sentMap, setSentMap]               = useState({})   // { jobId_action: true }

  const markSent = (key) => {
    setSentMap(m => ({ ...m, [key]: true }))
    setTimeout(() => setSentMap(m => { const n = { ...m }; delete n[key]; return n }), 3000)
  }

  const handleNotifyTenant = async (job) => {
    const property = getPropertyById(job.propertyId)
    const tenant   = getTenantById(property?.tenantId)
    if (!tenant?.email) { alert('No email address for tenant.'); return }
    setSending(job.id + '_tenant')
    try {
      await sendMaintenanceUpdate({ tenant, job, property })
      markSent(job.id + '_tenant')
    } catch (e) { alert('Failed: ' + e.message) }
    setSending(null)
  }

  const handleNotifyContractor = async (job) => {
    const property   = getPropertyById(job.propertyId)
    const contractor = getContractorById(job.assignedTo)
    if (!contractor?.email) { alert('No email for contractor.'); return }
    setSending(job.id + '_contractor')
    try {
      await sendContractorAssignment({ contractor, job, property })
      markSent(job.id + '_contractor')
    } catch (e) { alert('Failed: ' + e.message) }
    setSending(null)
  }

  const handleNotifyLandlord = async (job) => {
    const property   = getPropertyById(job.propertyId)
    const landlord   = getLandlordById(property?.landlordId)
    const contractor = getContractorById(job.assignedTo)
    if (!landlord?.email) { alert('No email for landlord.'); return }
    setSending(job.id + '_landlord')
    try {
      await sendJobCompletionToLandlord({ landlord, job, property, contractor })
      markSent(job.id + '_landlord')
    } catch (e) { alert('Failed: ' + e.message) }
    setSending(null)
  }

  const filtered = ALL_JOBS.filter(j => {
    const status = getStatus(j)
    const matchPriority = priorityFilter === 'All' || j.priority === priorityFilter
    const matchStatus   = statusFilter === 'All' || status === statusFilter
    return matchPriority && matchStatus
  })

  const openJobs       = ALL_JOBS.filter(j => getStatus(j) !== 'completed')
  const emergencyCount = openJobs.filter(j => j.priority === 'emergency').length
  const urgentCount    = openJobs.filter(j => j.priority === 'urgent').length
  const totalEstimated = openJobs.reduce((s, j) => s + (j.estimatedCost || 0), 0)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Maintenance Management</h1>
          <p className="page-subtitle">{openJobs.length} open jobs · £{totalEstimated.toLocaleString()} estimated spend</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={async () => {
            const jobs = filtered.filter(j => j.status !== 'completed')
            for (const j of jobs) {
              await handleAITriage(j)
              await new Promise(r => setTimeout(r, 500)) // 500ms between calls
            }
          }}>
            <Zap size={13} /> {'Triage All'}
          </button>
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
          const property   = getPropertyById(job.propertyId)
          const contractor = getContractorById(job.assignedTo)
          const pc         = PRIORITY_CONFIG[job.priority]
          const currentStatus = getStatus(job)
          const sc         = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.new
          const isExpanded = expandedJob === job.id
          const jobNotes   = getNotes(job)

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
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981' }}>
                        AI Triage Assessment {isAIConfigured && <span style={{ color: '#059669' }}>· Live</span>}
                      </p>
                    </div>
                    {triagingId === job.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <p style={{ fontSize: 12, color: '#64748b' }}>Claude is triaging this job…</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.6 }}>
                        {aiTriageMap[job.id] || job.aiTriage}
                      </p>
                    )}
                    {isAIConfigured && !aiTriageMap[job.id] && triagingId !== job.id && (
                      <button onClick={() => handleAITriage(job)}
                        style={{ marginTop: 8, background: 'none', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '4px 10px', color: '#10b981', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Zap size={11} style={{ display: 'inline', marginRight: 4 }} /> Regenerate Live Triage
                      </button>
                    )}
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8 }}>
                    {/* Notify tenant */}
                    <button
                      className="btn-secondary"
                      style={{ fontSize: 12 }}
                      disabled={sending === job.id + '_tenant'}
                      onClick={() => handleNotifyTenant(job)}>
                      {sentMap[job.id + '_tenant']
                        ? <><CheckCircle size={12} color="#10b981" /> Tenant Notified</>
                        : sending === job.id + '_tenant'
                        ? 'Sending…'
                        : <><Mail size={12} /> Notify Tenant</>}
                    </button>

                    {/* Notify contractor */}
                    {contractor && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: 12 }}
                        disabled={sending === job.id + '_contractor'}
                        onClick={() => handleNotifyContractor(job)}>
                        {sentMap[job.id + '_contractor']
                          ? <><CheckCircle size={12} color="#10b981" /> Sent</>
                          : sending === job.id + '_contractor'
                          ? 'Sending…'
                          : <><Mail size={12} /> Email Contractor</>}
                      </button>
                    )}

                    {/* Notify landlord on completion */}
                    {job.status === 'completed' && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: 12 }}
                        disabled={sending === job.id + '_landlord'}
                        onClick={() => handleNotifyLandlord(job)}>
                        {sentMap[job.id + '_landlord']
                          ? <><CheckCircle size={12} color="#10b981" /> Landlord Notified</>
                          : sending === job.id + '_landlord'
                          ? 'Sending…'
                          : <><Mail size={12} /> Notify Landlord</>}
                      </button>
                    )}

                    {!contractor && <button className="btn-primary" style={{ fontSize: 12 }}><Plus size={12} /> Assign Contractor</button>}
                  </div>

                  {/* Status change */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 7 }}>Update Status</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                        <button key={s} onClick={() => handleStatusChange(job.id, s)}
                          style={{ padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit', background: currentStatus === s ? '#0f172a' : '#f1f5f9', color: currentStatus === s ? 'white' : '#64748b', outline: currentStatus === s ? '2px solid #10b981' : 'none' }}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  {(job.timeline?.length > 0 || jobNotes.length > 0) && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>Activity</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {jobNotes.map((note, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 5 }} />
                            <div>
                              <p style={{ fontSize: 12.5, color: '#334155' }}>{note.text}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{note.author} · {note.date} {note.time}</p>
                            </div>
                          </div>
                        ))}
                        {job.timeline?.map((entry, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', flexShrink: 0, marginTop: 5 }} />
                            <div>
                              <p style={{ fontSize: 12.5, color: '#334155' }}>{entry.text}</p>
                              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{entry.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add note */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <input
                      value={noteText[job.id] || ''}
                      onChange={e => setNoteText(t => ({ ...t, [job.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote(job.id)}
                      placeholder="Add a note… (press Enter)"
                      style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                    />
                    <button onClick={() => handleAddNote(job.id)} className="btn-secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                      <Send size={12} /> Add Note
                    </button>
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

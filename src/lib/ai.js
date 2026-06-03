// Use /api/ai proxy on deployed site, direct call on localhost
const PROXY_URL = '/api/ai'

async function claude(prompt, maxTokens = 800) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content[0].text
}

// ── Arrears letter ────────────────────────────────────────────────────────────
export async function generateArrearsLetter({ tenant, property, tenancy, stage = 'stage1' }) {
  const stageInstructions = {
    stage1: 'This is a first reminder — polite but firm. Offer to discuss a payment plan.',
    stage2: 'This is a formal notice — serious tone. Reference Section 8 Housing Act 1988.',
    stage3: 'This is a final warning before legal action. Formal legal language. State proceedings will commence within 7 days.',
  }

  const prompt = `You are a professional UK letting agent writing a formal rent arrears letter.

Tenant: ${tenant.name}
Property: ${property.address}, ${property.postcode}
Monthly Rent: £${tenancy.monthlyRent.toLocaleString()}
Total Arrears: £${tenancy.arrears.toLocaleString()}
Months Overdue: ${Math.round(tenancy.arrears / tenancy.monthlyRent)}
Last Payment: ${tenancy.lastPaymentDate ? new Date(tenancy.lastPaymentDate).toLocaleDateString('en-GB') : 'No record'}
Agency: Harrington & Co Property Management

${stageInstructions[stage]}

Write a formal UK letting agent arrears letter. Use proper letter format with date, reference, salutation and sign-off.
Do not use markdown. Plain text only. Keep under 300 words.`

  return claude(prompt, 600)
}

// ── Maintenance triage ────────────────────────────────────────────────────────
export async function triageMaintenanceJob({ job, property }) {
  const prompt = `You are an experienced UK property maintenance coordinator. Triage this maintenance report.

Property: ${property.address}, ${property.postcode} (${property.type}, ${property.bedrooms} bed)
Issue: ${job.title}
Description: ${job.description}
Reported by: ${job.reportedBy}

Provide a brief triage assessment (3-4 sentences max):
1. Likely cause
2. Recommended priority (Emergency/Urgent/Routine/Cosmetic) with reason
3. Suggested trade/contractor needed
4. Any immediate safety concerns

Plain text, no markdown, no bullet points.`

  return claude(prompt, 300)
}

// ── Landlord portfolio update ─────────────────────────────────────────────────
export async function generateLandlordUpdate({ landlord, properties, tenancies, jobs }) {
  const totalRent   = properties.reduce((s, p) => s + p.rent, 0)
  const arrears     = tenancies.filter(t => t.arrears > 0)
  const openJobs    = jobs.filter(j => j.status !== 'completed')
  const month       = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const prompt = `You are a professional UK letting agent writing a monthly portfolio update for a landlord.

Landlord: ${landlord.name}
Properties: ${properties.length} (${properties.map(p => p.address).join(', ')})
Monthly Rent Roll: £${totalRent.toLocaleString()}
Management Fee: ${landlord.managementFee}%
Account Balance: £${landlord.balance.toLocaleString()}
${arrears.length > 0 ? `Rent Arrears: ${arrears.length} tenancy with arrears` : 'Rent: All tenants paying on time'}
Open Maintenance Jobs: ${openJobs.length}
Month: ${month}

Write a professional, friendly monthly portfolio update email.
Formal but warm tone. Highlight any issues clearly.
No markdown. Plain text. Under 250 words.`

  return claude(prompt, 500)
}

// ── Weekly management summary ─────────────────────────────────────────────────
export async function generateWeeklySummary({ agencyName, properties, tenancies, jobs, inspections, tasks, branchPerformance }) {
  const totalArrears   = tenancies.reduce((s, t) => s + (t.arrears || 0), 0)
  const criticalTasks  = tasks.filter(t => t.status === 'overdue').length
  const overdueInsp    = inspections.filter(i => i.status === 'overdue').length
  const emergencyJobs  = jobs.filter(j => j.priority === 'emergency' && j.status !== 'completed').length
  const complianceIssues = properties.filter(p =>
    Object.values(p.compliance).some(c => ['expired', 'not_verified', 'overdue'].includes(c.status))
  ).length

  const prompt = `You are an AI property management assistant writing a weekly summary for a UK estate agency owner.

Agency: ${agencyName}
Portfolio: ${properties.length} properties
Total Rent Arrears: £${totalArrears.toLocaleString()}
Compliance Failures: ${complianceIssues}
Emergency Maintenance: ${emergencyJobs}
Overdue Inspections: ${overdueInsp}
Overdue Tasks: ${criticalTasks}
Branch Performance: ${branchPerformance.map(b => `${b.branch}: ${b.complianceScore}% compliance, ${b.rentCollected}% rent collected`).join(' | ')}

Write a concise weekly management summary for the agency owner.
Identify the top 3 risks this week. Recommend specific actions.
Professional tone. No markdown. Plain text. Under 300 words.`

  return claude(prompt, 600)
}

// ── Compliance risk assessment ────────────────────────────────────────────────
export async function generateComplianceRisk({ properties }) {
  const issues = properties.flatMap(p =>
    Object.entries(p.compliance)
      .filter(([, c]) => ['expired', 'not_verified', 'overdue', 'expiring_soon'].includes(c.status))
      .map(([key, c]) => `${p.address}: ${key} — ${c.status}`)
  )

  if (issues.length === 0) return 'No compliance issues detected. All certificates are valid and up to date.'

  const prompt = `You are a UK property compliance expert. Assess these compliance issues for a letting agency:

${issues.join('\n')}

Provide a brief risk assessment:
1. Most critical issues (legal/financial risk)
2. Immediate actions required
3. Timeline recommendations

Plain text, no markdown. Under 200 words.`

  return claude(prompt, 400)
}

// AI is always available — key is server-side only
export const isAIConfigured = true

import emailjs from '@emailjs/browser'

const SERVICE_ID  = 'service_4jr76ld'
const TEMPLATE_ID = 'template_ttzgn3n'
const PUBLIC_KEY  = 'XU1eX8NeRpX-UCnac'

emailjs.init(PUBLIC_KEY)

export async function sendEmail({ to, subject, message }) {
  if (!to) throw new Error('No recipient email address provided.')

  const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_email: to,
    subject,
    message,
  })

  return result
}

// ── Arrears letter ────────────────────────────────────────────────────────────
export async function sendArrearsLetter({ tenant, property, tenancy, agencyName = 'Harrington & Co' }) {
  const subject = `Outstanding Rent Arrears — ${property.address}, ${property.postcode}`
  const message = `Dear ${tenant.name},

Re: Outstanding Rent Arrears — ${property.address}, ${property.postcode}

I am writing to you regarding the outstanding rent balance on the above property, which currently stands at £${tenancy.arrears.toLocaleString()}.

Your rent of £${tenancy.monthlyRent.toLocaleString()} per month was last received on ${tenancy.lastPaymentDate ? new Date(tenancy.lastPaymentDate).toLocaleDateString('en-GB') : 'N/A'}. As of today's date, ${Math.round(tenancy.arrears / tenancy.monthlyRent)} month(s) of rent remains outstanding.

We would ask that you make payment of the outstanding balance in full within 7 days of this letter. If you are experiencing financial difficulties, we encourage you to contact us immediately to discuss a repayment plan.

Failure to clear this balance may result in formal proceedings being commenced under Section 8 of the Housing Act 1988.

Please contact our office on 020 7123 4567 or email us at arrears@harrington.co.uk.

Yours sincerely,
${agencyName}`

  return sendEmail({ to: tenant.email, subject, message })
}

// ── Landlord portfolio update ─────────────────────────────────────────────────
export async function sendLandlordUpdate({ landlord, properties, agencyName = 'Harrington & Co' }) {
  const totalRent = properties.reduce((s, p) => s + p.rent, 0)
  const month     = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const subject = `Your Property Portfolio Update — ${month}`
  const message = `Dear ${landlord.name},

Please find below your monthly portfolio update from ${agencyName}.

PORTFOLIO SUMMARY — ${month}

Properties Under Management: ${properties.length}
Monthly Rent Roll: £${totalRent.toLocaleString()}
Management Fee (${landlord.managementFee}%): -£${Math.round(totalRent * landlord.managementFee / 100).toLocaleString()}
Account Balance: £${landlord.balance.toLocaleString()}

PROPERTIES
${properties.map(p => `• ${p.address}, ${p.postcode} — £${p.rent.toLocaleString()}/mo — ${p.status === 'let' ? 'Let' : 'Void'}`).join('\n')}

All compliance certificates on your properties are being monitored and we will contact you in advance of any renewals required.

If you have any questions about your portfolio, please contact your dedicated property manager.

Kind regards,
${agencyName}
020 7123 4567`

  return sendEmail({ to: landlord.email, subject, message })
}

// ── Inspection link to tenant ─────────────────────────────────────────────────
export async function sendInspectionLink({ tenant, property, inspectionUrl, inspectorName, date, agencyName = 'Harrington & Co' }) {
  const subject = `Your Property Inspection Report — ${property.address}`
  const message = `Dear ${tenant.name},

Please find your property inspection report for ${property.address} at the link below.

You can view the report and confirm you have read it by signing digitally.

${inspectionUrl}

This inspection was carried out on ${date} by ${inspectorName}.

Kind regards,
${agencyName}
020 7123 4567`

  return sendEmail({ to: tenant.email, subject, message })
}

// ── Maintenance update to tenant ──────────────────────────────────────────────
export async function sendMaintenanceUpdate({ tenant, job, property, agencyName = 'Harrington & Co' }) {
  const statusLabels = {
    assigned:    'A contractor has been assigned and will be in touch to arrange access.',
    in_progress: 'Work is currently in progress at your property.',
    completed:   'The repair has been completed. Please let us know if you have any concerns.',
    on_hold:     'This job is currently on hold. We will update you shortly.',
  }

  const subject = `Maintenance Update — ${job.title} — ${property.address}`
  const message = `Dear ${tenant.name},

We are writing to update you on the maintenance job reported at ${property.address}.

Job: ${job.title}
Status: ${job.status.replace('_', ' ').toUpperCase()}

${statusLabels[job.status] || 'We will keep you updated on progress.'}

If you have any questions please contact us on 020 7123 4567.

Kind regards,
${agencyName}`

  return sendEmail({ to: tenant.email, subject, message })
}

// ── Contractor job assignment ─────────────────────────────────────────────────
export async function sendContractorAssignment({ contractor, job, property, agencyName = 'Harrington & Co' }) {
  const subject = `New Job Assignment — ${job.title} — ${property.address}`
  const message = `Dear ${contractor.contact},

You have been assigned a new maintenance job by ${agencyName}.

JOB DETAILS
Property: ${property.address}, ${property.postcode}
Job: ${job.title}
Priority: ${job.priority.toUpperCase()}
Description: ${job.description}
${job.dueDate ? `Due Date: ${job.dueDate}` : ''}
${job.estimatedCost ? `Estimated Cost: £${job.estimatedCost}` : ''}

Please contact the tenant to arrange access at your earliest convenience.

To confirm this job, reply to this email or call us on 020 7123 4567.

Kind regards,
${agencyName}`

  return sendEmail({ to: contractor.email, subject, message })
}

// ── Job completion notification to landlord ───────────────────────────────────
export async function sendJobCompletionToLandlord({ landlord, job, property, contractor, agencyName = 'Harrington & Co' }) {
  const subject = `Maintenance Completed — ${job.title} — ${property.address}`
  const message = `Dear ${landlord.name},

We are pleased to confirm that the following maintenance job at your property has been completed.

Property: ${property.address}, ${property.postcode}
Job: ${job.title}
Completed by: ${contractor?.name || 'Our contractor'}
${job.actualCost ? `Final Cost: £${job.actualCost}` : job.estimatedCost ? `Estimated Cost: £${job.estimatedCost}` : ''}

No further action is required from you at this time.

If you have any questions, please don't hesitate to contact us.

Kind regards,
${agencyName}
020 7123 4567`

  return sendEmail({ to: landlord.email, subject, message })
}

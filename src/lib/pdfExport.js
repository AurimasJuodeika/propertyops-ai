import jsPDF from 'jspdf'

const BRAND = {
  dark:    [15, 23, 42],       // #0f172a
  green:   [16, 185, 129],     // #10b981
  greenDk: [5, 150, 105],      // #059669
  slate:   [100, 116, 139],    // #64748b
  light:   [248, 250, 252],    // #f8fafc
  border:  [226, 232, 240],    // #e2e8f0
  text:    [30, 41, 59],       // #1e293b
  red:     [220, 38, 38],
  amber:   [217, 119, 6],
  white:   [255, 255, 255],
}

const AGENCY_NAME   = 'Harrington & Co'
const AGENCY_SUB    = 'Property Management Specialists'
const AGENCY_ADDR   = '45 Mayfair Lane, London W1K 3HB'
const AGENCY_PHONE  = '020 7123 4567'
const AGENCY_EMAIL  = 'info@harrington.co.uk'
const AGENCY_ARLA   = 'ARLA Propertymark M0089234'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function newDoc() {
  return new jsPDF({ unit: 'mm', format: 'a4' })
}

const PW   = 210   // page width mm
const PH   = 297   // page height mm
const ML   = 20    // margin left
const MR   = 20    // margin right
const CW   = PW - ML - MR  // content width

function checkPage(doc, y, needed = 20) {
  if (y + needed > PH - 20) {
    doc.addPage()
    return 28
  }
  return y
}

function drawHeader(doc, title, subtitle) {
  // Dark header bar
  doc.setFillColor(...BRAND.dark)
  doc.rect(0, 0, PW, 34, 'F')

  // Green accent strip
  doc.setFillColor(...BRAND.green)
  doc.rect(0, 0, 5, 34, 'F')

  // Brand name
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.white)
  doc.text('PropertyOps AI', ML, 14)

  // Agency name
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.green)
  doc.text(AGENCY_NAME, ML, 21)

  // Report title (right aligned)
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(title, PW - MR, 14, { align: 'right' })
  if (subtitle) {
    doc.setFontSize(8)
    doc.text(subtitle, PW - MR, 21, { align: 'right' })
  }

  return 44  // y after header
}

function drawSectionTitle(doc, y, text) {
  doc.setFillColor(...BRAND.light)
  doc.rect(ML, y, CW, 7, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.green)
  doc.text(text.toUpperCase(), ML + 3, y + 5)
  return y + 12
}

function drawKeyValue(doc, y, label, value, valueColor) {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.slate)
  doc.text(label, ML, y)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...(valueColor || BRAND.text))
  doc.text(String(value), ML + 50, y)
  return y + 6
}

function drawHRule(doc, y) {
  doc.setDrawColor(...BRAND.border)
  doc.setLineWidth(0.3)
  doc.line(ML, y, PW - MR, y)
  return y + 4
}

function drawFooter(doc, pageNum, totalPages) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.slate)
    doc.text(`${AGENCY_NAME} · ${AGENCY_ADDR} · ${AGENCY_PHONE}`, ML, PH - 10)
    doc.text(`${AGENCY_ARLA}`, ML, PH - 6)
    doc.text(`Page ${i} of ${pages}`, PW - MR, PH - 8, { align: 'right' })
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.3)
    doc.line(ML, PH - 14, PW - MR, PH - 14)
  }
}

function statusColor(status) {
  if (['expired','not_verified','overdue'].includes(status)) return BRAND.red
  if (status === 'expiring_soon') return BRAND.amber
  if (status === 'valid') return [22, 163, 74]
  return BRAND.slate
}

function statusLabel(status) {
  const map = { expired: 'EXPIRED', not_verified: 'NOT VERIFIED', overdue: 'OVERDUE', expiring_soon: 'EXPIRING SOON', valid: 'VALID', 'n/a': 'N/A' }
  return map[status] || status.toUpperCase()
}

// ─── 1. LANDLORD STATEMENT ────────────────────────────────────────────────────

export function generateLandlordStatement(landlord, properties, tenancies, transactions) {
  const doc = newDoc()
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  let y = drawHeader(doc, 'LANDLORD STATEMENT', monthLabel)

  // ── Landlord details box ──
  doc.setFillColor(...BRAND.light)
  doc.roundedRect(ML, y, CW, 26, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.dark)
  doc.text(landlord.name, ML + 4, y + 9)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.slate)
  doc.text(landlord.email, ML + 4, y + 16)
  doc.text(landlord.phone, ML + 4, y + 22)

  // Account balance badge
  const balColor = landlord.balance >= 0 ? [22, 163, 74] : BRAND.red
  doc.setFillColor(...balColor)
  doc.roundedRect(PW - MR - 44, y + 5, 44, 16, 2, 2, 'F')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.white)
  doc.text('ACCOUNT BALANCE', PW - MR - 22, y + 10, { align: 'center' })
  doc.setFontSize(12)
  doc.text(`£${Math.abs(landlord.balance).toLocaleString()}`, PW - MR - 22, y + 18, { align: 'center' })

  y += 34

  // ── Portfolio summary ──
  y = drawSectionTitle(doc, y, 'Portfolio Summary')

  const totalRent = properties.reduce((s, p) => s + p.rent, 0)
  const mgmtFee   = Math.round(totalRent * landlord.managementFee / 100)
  const netIncome = totalRent - mgmtFee

  const summaryRows = [
    ['Properties Managed', properties.length],
    ['Monthly Rent Roll', `£${totalRent.toLocaleString()}`],
    [`Management Fee (${landlord.managementFee}%)`, `-£${mgmtFee.toLocaleString()}`],
    ['Net Income This Month', `£${netIncome.toLocaleString()}`],
    ['Account Balance', `£${landlord.balance.toLocaleString()}`],
    ['Statement Period', monthLabel],
    ['Statement Date', date],
  ]

  summaryRows.forEach(([label, value]) => {
    const isNet = label.startsWith('Net')
    const isBal = label.startsWith('Account')
    y = drawKeyValue(doc, y, label, value,
      isNet ? [22, 163, 74] : isBal ? (landlord.balance >= 0 ? [22, 163, 74] : BRAND.red) : null)
  })

  y = drawHRule(doc, y + 2)

  // ── Properties ──
  y = drawSectionTitle(doc, y, 'Properties')

  properties.forEach(p => {
    y = checkPage(doc, y, 22)
    const tenancy = tenancies.find(t => t.propertyId === p.id)

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.dark)
    doc.text(`${p.address}, ${p.postcode}`, ML, y)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.slate)
    doc.text(`${p.bedrooms} bed ${p.type} · ${p.branch} · ${p.managementType === 'full' ? 'Full Management' : 'Rent Collection'}`, ML, y + 5)

    // Rent / arrears
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.green)
    doc.text(`£${p.rent.toLocaleString()}/mo`, PW - MR, y, { align: 'right' })

    if (tenancy?.arrears > 0) {
      doc.setTextColor(...BRAND.red)
      doc.setFontSize(8)
      doc.text(`Arrears: £${tenancy.arrears.toLocaleString()}`, PW - MR, y + 5, { align: 'right' })
    } else if (tenancy) {
      doc.setTextColor(22, 163, 74)
      doc.setFontSize(8)
      doc.text('Rent clear', PW - MR, y + 5, { align: 'right' })
    } else {
      doc.setTextColor(...BRAND.amber)
      doc.setFontSize(8)
      doc.text('VOID', PW - MR, y + 5, { align: 'right' })
    }

    y += 14
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.2)
    doc.line(ML, y - 2, PW - MR, y - 2)
  })

  y += 4

  // ── Transaction history ──
  y = checkPage(doc, y, 30)
  y = drawSectionTitle(doc, y, 'Recent Transactions')

  // Table header
  const cols = [ML, ML + 32, ML + 90, ML + 130, PW - MR]
  const headers = ['Date', 'Property', 'Description', 'Amount', 'Status']
  doc.setFillColor(226, 232, 240)
  doc.rect(ML, y, CW, 7, 'F')
  headers.forEach((h, i) => {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.slate)
    if (i === 4) doc.text(h, cols[i], y + 5, { align: 'right' })
    else doc.text(h, cols[i] + 1, y + 5)
  })
  y += 10

  transactions.slice(0, 12).forEach((tx, idx) => {
    y = checkPage(doc, y, 8)
    if (idx % 2 === 0) {
      doc.setFillColor(...BRAND.light)
      doc.rect(ML, y - 3, CW, 7, 'F')
    }
    const amtColor = tx.amount > 0 ? [22, 163, 74] : tx.amount === 0 ? BRAND.red : BRAND.dark
    const cells = [
      { text: tx.date, x: cols[0] + 1 },
      { text: (tx.property || '').slice(0, 22), x: cols[1] + 1 },
      { text: tx.desc, x: cols[2] + 1 },
    ]
    cells.forEach(c => {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BRAND.text)
      doc.text(c.text, c.x, y + 2)
    })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...amtColor)
    doc.text(tx.amount > 0 ? `+£${tx.amount.toLocaleString()}` : tx.amount === 0 ? '£0' : `-£${Math.abs(tx.amount).toLocaleString()}`, cols[4], y + 2, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...(tx.status === 'received' ? [22,163,74] : tx.status === 'missed' ? BRAND.red : BRAND.slate))
    doc.setFontSize(7)
    doc.text(tx.status.toUpperCase(), cols[4], y + 6, { align: 'right' })
    y += 9
  })

  y += 4
  // ── Closing note ──
  y = checkPage(doc, y, 24)
  doc.setFillColor(...BRAND.dark)
  doc.roundedRect(ML, y, CW, 18, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Thank you for trusting Harrington & Co with the management of your property portfolio.', ML + 4, y + 7)
  doc.text(`For questions about this statement, please contact your dedicated property manager or call ${AGENCY_PHONE}.`, ML + 4, y + 13)

  drawFooter(doc)

  const filename = `Statement_${landlord.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0,7)}.pdf`
  doc.save(filename)
}

// ─── 2. COMPLIANCE REPORT ─────────────────────────────────────────────────────

export function generateComplianceReport(properties) {
  const doc = newDoc()
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  let y = drawHeader(doc, 'COMPLIANCE REPORT', date)

  // Summary stats
  const expired  = properties.filter(p => Object.values(p.compliance).some(c => ['expired','not_verified','overdue'].includes(c.status))).length
  const warning  = properties.filter(p => !Object.values(p.compliance).some(c => ['expired','not_verified','overdue'].includes(c.status)) && Object.values(p.compliance).some(c => c.status === 'expiring_soon')).length
  const compliant = properties.length - expired - warning
  const score    = Math.round(((compliant * 100) + (warning * 60)) / properties.length)

  // Score boxes row
  const boxW = 42, boxH = 22, gap = 6
  const boxStart = ML
  ;[
    { label: 'CRITICAL', value: expired,   bg: [254,226,226], text: BRAND.red },
    { label: 'WARNING',  value: warning,   bg: [255,251,235], text: BRAND.amber },
    { label: 'COMPLIANT',value: compliant, bg: [240,253,244], text: [22,163,74] },
    { label: 'SCORE',    value: `${score}%`, bg: BRAND.dark,  text: BRAND.white },
  ].forEach(({ label, value, bg, text }, i) => {
    const bx = boxStart + i * (boxW + gap)
    doc.setFillColor(...bg)
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, 'F')
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...text)
    doc.text(String(value), bx + boxW / 2, y + 13, { align: 'center' })
    doc.setFontSize(7)
    doc.setTextColor(...text)
    doc.text(label, bx + boxW / 2, y + 19, { align: 'center' })
  })
  y += 30

  if (expired > 0) {
    doc.setFillColor(254, 226, 226)
    doc.roundedRect(ML, y, CW, 10, 2, 2, 'F')
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.red)
    doc.text(`⚠  ${expired} PROPERT${expired > 1 ? 'IES HAVE' : 'Y HAS'} CRITICAL COMPLIANCE FAILURES — IMMEDIATE ACTION REQUIRED`, ML + 4, y + 6.5)
    y += 16
  }

  // ── Per-property grid ──
  y = drawSectionTitle(doc, y, 'Property Compliance Matrix')

  const certKeys   = ['epc', 'gasSafety', 'eicr', 'smokeAlarm', 'depositProtection', 'rightToRent']
  const certLabels = ['EPC', 'Gas Safety', 'EICR', 'Smoke Alarm', 'Deposit', 'RTR']

  // Column widths
  const addrW = 52
  const certW = (CW - addrW) / certKeys.length

  // Table header
  doc.setFillColor(30, 41, 59)
  doc.rect(ML, y, CW, 8, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.white)
  doc.text('Property', ML + 2, y + 5.5)
  certLabels.forEach((lbl, i) => {
    const cx = ML + addrW + i * certW + certW / 2
    doc.text(lbl, cx, y + 5.5, { align: 'center' })
  })
  y += 10

  properties.forEach((p, idx) => {
    y = checkPage(doc, y, 12)
    const rowBg = idx % 2 === 0 ? BRAND.light : BRAND.white

    // Highlight critical rows
    const hasCritical = Object.values(p.compliance).some(c => ['expired','not_verified','overdue'].includes(c.status))
    doc.setFillColor(...(hasCritical ? [254, 242, 242] : rowBg))
    doc.rect(ML, y, CW, 10, 'F')

    // Address
    doc.setFontSize(7.5)
    doc.setFont('helvetica', hasCritical ? 'bold' : 'normal')
    doc.setTextColor(...BRAND.dark)
    const shortAddr = p.address.length > 26 ? p.address.slice(0, 24) + '…' : p.address
    doc.text(shortAddr, ML + 2, y + 4)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.slate)
    doc.text(p.postcode, ML + 2, y + 8)

    // Cert cells
    certKeys.forEach((key, i) => {
      const cert = p.compliance[key]
      const status = cert?.status || 'n/a'
      const cx = ML + addrW + i * certW + certW / 2
      const color = statusColor(status)

      // Pill background
      doc.setFillColor(...(status === 'valid' ? [240,253,244] : status === 'expired' || status === 'not_verified' || status === 'overdue' ? [254,226,226] : status === 'expiring_soon' ? [255,251,235] : [241,245,249]))
      doc.roundedRect(cx - certW/2 + 1, y + 1.5, certW - 2, 7, 1, 1, 'F')
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)

      const short = status === 'valid' ? '✓ OK' : status === 'expired' ? 'EXPIRED' : status === 'not_verified' ? 'NOT VER.' : status === 'expiring_soon' ? 'EXPIRING' : status === 'overdue' ? 'OVERDUE' : 'N/A'
      doc.text(short, cx, y + 6.5, { align: 'center' })
    })

    // Left border for critical rows
    if (hasCritical) {
      doc.setFillColor(...BRAND.red)
      doc.rect(ML, y, 2, 10, 'F')
    }

    y += 11
  })

  y += 6

  // ── Expiry calendar ──
  y = checkPage(doc, y, 40)
  y = drawSectionTitle(doc, y, 'Upcoming Certificate Renewals (Next 90 Days)')

  const now = new Date()
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const upcoming = []
  properties.forEach(p => {
    Object.entries(p.compliance).forEach(([key, cert]) => {
      if (!cert.expiry) return
      const exp = new Date(cert.expiry)
      if (exp >= now && exp <= in90) {
        const daysLeft = Math.round((exp - now) / (1000 * 60 * 60 * 24))
        upcoming.push({
          property: p.address,
          postcode: p.postcode,
          cert: key === 'gasSafety' ? 'Gas Safety' : key === 'eicr' ? 'EICR' : key === 'epc' ? 'EPC' : key === 'rightToRent' ? 'Right to Rent' : key,
          expiry: exp.toLocaleDateString('en-GB'),
          daysLeft,
        })
      }
    })
  })
  upcoming.sort((a, b) => a.daysLeft - b.daysLeft)

  if (upcoming.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...BRAND.slate)
    doc.text('No certificates expiring in the next 90 days.', ML, y)
    y += 10
  } else {
    upcoming.forEach((item, idx) => {
      y = checkPage(doc, y, 9)
      const urgentColor = item.daysLeft <= 30 ? BRAND.red : BRAND.amber
      if (idx % 2 === 0) { doc.setFillColor(...BRAND.light); doc.rect(ML, y - 2, CW, 8, 'F') }
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BRAND.dark)
      doc.text(`${item.property}, ${item.postcode}`, ML + 2, y + 3)
      doc.setTextColor(...BRAND.slate)
      doc.text(item.cert, ML + 90, y + 3)
      doc.text(item.expiry, ML + 120, y + 3)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...urgentColor)
      doc.text(`${item.daysLeft} days`, PW - MR, y + 3, { align: 'right' })
      y += 9
    })
  }

  y += 4

  // ── Recommendations ──
  y = checkPage(doc, y, 50)
  y = drawSectionTitle(doc, y, 'Recommendations')

  const recs = []
  if (expired > 0) recs.push({ severity: 'critical', text: `${expired} propert${expired > 1 ? 'ies require' : 'y requires'} immediate certificate renewal. These properties are at risk of financial penalties and cannot be legally re-let until resolved.` })
  if (warning > 0)  recs.push({ severity: 'warning',  text: `${warning} propert${warning > 1 ? 'ies have' : 'y has'} certificates expiring within 30 days. Book renewals now to avoid compliance failures.` })
  const noRTR = properties.filter(p => p.compliance.rightToRent?.status === 'not_verified').length
  if (noRTR > 0) recs.push({ severity: 'critical', text: `${noRTR} tenant${noRTR > 1 ? 's have' : ' has'} unverified Right to Rent. Civil penalties up to £10,000 per tenant apply. Verify immediately.` })
  if (score < 80) recs.push({ severity: 'warning', text: 'Overall compliance score is below 80%. A dedicated compliance audit is recommended across all branches.' })
  if (recs.length === 0) recs.push({ severity: 'info', text: 'Portfolio compliance is in good order. Continue monitoring certificate expiry dates to maintain current standards.' })

  recs.forEach(rec => {
    y = checkPage(doc, y, 14)
    const bg = rec.severity === 'critical' ? [254,226,226] : rec.severity === 'warning' ? [255,251,235] : [240,253,244]
    const col = rec.severity === 'critical' ? BRAND.red : rec.severity === 'warning' ? BRAND.amber : [22,163,74]
    doc.setFillColor(...bg)
    doc.roundedRect(ML, y, CW, 12, 2, 2, 'F')
    doc.setFillColor(...col)
    doc.rect(ML, y, 3, 12, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.dark)
    const lines = doc.splitTextToSize(rec.text, CW - 8)
    doc.text(lines, ML + 6, y + 5)
    y += 16
  })

  drawFooter(doc)

  doc.save(`ComplianceReport_${AGENCY_NAME.replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`)
}

// ─── 3. MANAGEMENT SUMMARY ────────────────────────────────────────────────────

export function generateManagementSummary({ properties, tenancies, maintenanceJobs, inspections, branchPerformance, rentChart }) {
  const doc = newDoc()
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  let y = drawHeader(doc, 'MANAGEMENT SUMMARY', month)

  // ── KPI boxes ──
  const totalRent = properties.reduce((s, p) => s + p.rent, 0)
  const totalArrears = tenancies.reduce((s, t) => s + (t.arrears || 0), 0)
  const openJobs = maintenanceJobs.filter(j => j.status !== 'completed').length
  const overdueInspections = inspections.filter(i => i.status === 'overdue').length
  const letProps = properties.filter(p => p.status === 'let').length
  const occupancy = Math.round((letProps / properties.length) * 100)
  const complianceIssues = properties.filter(p => Object.values(p.compliance).some(c => ['expired','not_verified','overdue'].includes(c.status))).length

  const kpis = [
    { label: 'Properties',  value: properties.length,         sub: `${letProps} let` },
    { label: 'Occupancy',   value: `${occupancy}%`,            sub: `${properties.filter(p => p.status === 'void').length} void` },
    { label: 'Rent Roll',   value: `£${(totalRent/1000).toFixed(1)}k`, sub: 'per month' },
    { label: 'Arrears',     value: `£${(totalArrears/1000).toFixed(1)}k`, sub: `${tenancies.filter(t => t.arrears > 0).length} tenants`, alert: totalArrears > 0 },
    { label: 'Open Jobs',   value: openJobs,                   sub: `${maintenanceJobs.filter(j=>j.priority==='emergency'&&j.status!=='completed').length} emergency`, alert: maintenanceJobs.filter(j=>j.priority==='emergency'&&j.status!=='completed').length > 0 },
    { label: 'Compliance',  value: complianceIssues,           sub: 'critical issues', alert: complianceIssues > 0 },
  ]

  const kpiW = CW / kpis.length
  kpis.forEach((kpi, i) => {
    const kx = ML + i * kpiW
    doc.setFillColor(...(kpi.alert ? [254,226,226] : BRAND.light))
    doc.roundedRect(kx, y, kpiW - 2, 22, 2, 2, 'F')
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(kpi.alert ? BRAND.red : BRAND.dark))
    doc.text(String(kpi.value), kx + (kpiW - 2) / 2, y + 12, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(kpi.alert ? BRAND.red : BRAND.slate))
    doc.text(kpi.label.toUpperCase(), kx + (kpiW - 2) / 2, y + 17.5, { align: 'center' })
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.sub, kx + (kpiW - 2) / 2, y + 21, { align: 'center' })
  })
  y += 30

  // ── Branch Performance ──
  y = drawSectionTitle(doc, y, 'Branch Performance')

  const bpHeaders = ['Branch', 'Properties', 'Occupancy', 'Rent Collected', 'Compliance', 'Maint. Open', 'Inspections Overdue']
  const bpWidths  = [44, 20, 22, 30, 26, 22, 26]
  let bx = ML
  doc.setFillColor(...BRAND.dark)
  doc.rect(ML, y, CW, 8, 'F')
  bpHeaders.forEach((h, i) => {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.white)
    doc.text(h, bx + 2, y + 5.5)
    bx += bpWidths[i]
  })
  y += 10

  branchPerformance.forEach((b, idx) => {
    y = checkPage(doc, y, 10)
    doc.setFillColor(...(idx % 2 === 0 ? BRAND.light : BRAND.white))
    doc.rect(ML, y, CW, 9, 'F')
    bx = ML
    const vals = [b.branch.replace('London ', ''), b.properties, `${b.occupancy}%`, `${b.rentCollected}%`, `${b.complianceScore}%`, b.maintenanceOpen, b.inspectionsOverdue]
    vals.forEach((v, i) => {
      const isAlert = (i === 3 && b.rentCollected < 93) || (i === 4 && b.complianceScore < 85) || (i === 6 && b.inspectionsOverdue > 0)
      doc.setFontSize(8)
      doc.setFont('helvetica', isAlert ? 'bold' : 'normal')
      doc.setTextColor(...(isAlert ? BRAND.red : BRAND.dark))
      doc.text(String(v), bx + 2, y + 6)
      bx += bpWidths[i]
    })
    y += 10
  })
  y += 4

  // ── Rent collection trend ──
  y = checkPage(doc, y, 46)
  y = drawSectionTitle(doc, y, 'Rent Collection Trend')

  const chartH = 32, chartY = y, chartX = ML, cw = CW
  doc.setFillColor(...BRAND.light)
  doc.rect(chartX, chartY, cw, chartH, 'F')

  const barW = Math.floor(cw / rentChart.length) - 3
  const maxVal = Math.max(...rentChart.map(d => d.expected))

  rentChart.forEach((d, i) => {
    const bxc = chartX + i * (barW + 3) + 2
    const expH = Math.round((d.expected / maxVal) * (chartH - 10))
    const colH = Math.round((d.collected / maxVal) * (chartH - 10))
    const baseY = chartY + chartH - 6

    // Expected bar (light)
    doc.setFillColor(203, 213, 225)
    doc.rect(bxc, baseY - expH, barW * 0.45, expH, 'F')
    // Collected bar
    doc.setFillColor(...BRAND.green)
    doc.rect(bxc + barW * 0.5, baseY - colH, barW * 0.45, colH, 'F')

    // Month label
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.slate)
    doc.text(d.month, bxc + barW * 0.45, baseY + 4, { align: 'center' })

    // % label
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(d.percentage < 95 ? BRAND.red[0] : BRAND.green[0], d.percentage < 95 ? BRAND.red[1] : BRAND.green[1], d.percentage < 95 ? BRAND.red[2] : BRAND.green[2])
    doc.text(`${d.percentage}%`, bxc + barW * 0.72, baseY - colH - 1, { align: 'center' })
  })
  y += chartH + 8

  // ── Arrears summary ──
  y = checkPage(doc, y, 30)
  y = drawSectionTitle(doc, y, `Rent Arrears — £${totalArrears.toLocaleString()} Outstanding`)

  const arrearsTenancies = tenancies.filter(t => t.arrears > 0)
  if (arrearsTenancies.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...BRAND.slate)
    doc.text('No rent arrears currently recorded.', ML, y)
    y += 10
  } else {
    arrearsTenancies.sort((a, b) => b.arrears - a.arrears).forEach((t, idx) => {
      y = checkPage(doc, y, 9)
      const months = Math.round(t.arrears / t.monthlyRent)
      const prop = properties.find(p => p.id === t.propertyId)
      if (idx % 2 === 0) { doc.setFillColor(...BRAND.light); doc.rect(ML, y - 2, CW, 8, 'F') }
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BRAND.dark)
      doc.text(prop?.address || '—', ML + 2, y + 3)
      doc.setTextColor(...BRAND.slate)
      doc.text(`£${t.monthlyRent.toLocaleString()}/mo`, ML + 90, y + 3)
      doc.text(`${months} month${months !== 1 ? 's' : ''} overdue`, ML + 115, y + 3)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.red)
      doc.text(`£${t.arrears.toLocaleString()}`, PW - MR, y + 3, { align: 'right' })
      y += 9
    })
  }

  drawFooter(doc)

  doc.save(`ManagementSummary_${new Date().toISOString().slice(0,7)}.pdf`)
}

// ─── 4. PROPERTY REPORT ───────────────────────────────────────────────────────

export function generatePropertyReport(property, landlord, tenant, tenancy, jobs, inspections) {
  const doc = newDoc()
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  let y = drawHeader(doc, 'PROPERTY REPORT', date)

  // Property hero
  doc.setFillColor(...BRAND.light)
  doc.roundedRect(ML, y, CW, 28, 2, 2, 'F')
  doc.setFillColor(...BRAND.green)
  doc.roundedRect(ML, y, 4, 28, 2, 0, 'F')
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.dark)
  doc.text(property.address, ML + 8, y + 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BRAND.slate)
  doc.text(`${property.postcode} · ${property.branch} · ${property.bedrooms} bed ${property.type}`, ML + 8, y + 17)
  doc.text(`£${property.rent.toLocaleString()}/month · ${property.managementType === 'full' ? 'Full Management' : 'Rent Collection'}`, ML + 8, y + 23)
  const propStatusText = property.status === 'let' ? 'LET' : property.status === 'void' ? 'VOID' : 'AVAILABLE'
  const statusBg = property.status === 'let' ? [16,185,129] : [217,119,6]
  doc.setFillColor(...statusBg)
  doc.roundedRect(PW - MR - 20, y + 7, 20, 9, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND.white)
  doc.text(propStatusText, PW - MR - 10, y + 13, { align: 'center' })
  y += 34

  // Landlord + Tenant
  const halfW = (CW - 4) / 2
  ;[
    { title: 'LANDLORD', data: landlord ? [landlord.name, landlord.email, landlord.phone] : ['No landlord on record'] },
    { title: 'TENANT', data: tenant ? [tenant.name, tenant.email, tenant.phone] : ['Vacant — no tenant'] },
  ].forEach((panel, i) => {
    const px = ML + i * (halfW + 4)
    doc.setFillColor(...BRAND.light)
    doc.roundedRect(px, y, halfW, 22, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.slate)
    doc.text(panel.title, px + 3, y + 6)
    panel.data.forEach((line, li) => {
      doc.setFontSize(8)
      doc.setFont('helvetica', li === 0 ? 'bold' : 'normal')
      doc.setTextColor(...BRAND.dark)
      doc.text(line, px + 3, y + 11 + li * 5)
    })
  })
  y += 28

  // Tenancy
  if (tenancy) {
    y = drawSectionTitle(doc, y, 'Current Tenancy')
    const rows = [
      ['Start Date', new Date(tenancy.startDate).toLocaleDateString('en-GB')],
      ['End Date', new Date(tenancy.endDate).toLocaleDateString('en-GB')],
      ['Monthly Rent', `£${tenancy.monthlyRent.toLocaleString()}`],
      ['Deposit', `£${tenancy.depositAmount.toLocaleString()} (${tenancy.depositScheme})`],
      ['Status', tenancy.status.replace('_', ' ').toUpperCase()],
      ['Arrears', tenancy.arrears > 0 ? `£${tenancy.arrears.toLocaleString()}` : 'None'],
    ]
    rows.forEach(([label, value]) => {
      y = drawKeyValue(doc, y, label, value, label === 'Arrears' && tenancy.arrears > 0 ? BRAND.red : null)
    })
    y += 2
  }

  // Compliance
  y = checkPage(doc, y, 60)
  y = drawSectionTitle(doc, y, 'Compliance Status')
  const certMap = { epc: 'EPC', gasSafety: 'Gas Safety', eicr: 'EICR', smokeAlarm: 'Smoke Alarm', depositProtection: 'Deposit Protection', rightToRent: 'Right to Rent' }
  Object.entries(property.compliance).forEach(([key, cert]) => {
    if (cert.status === 'n/a') return
    const color = statusColor(cert.status)
    y = checkPage(doc, y, 7)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.dark)
    doc.text(certMap[key] || key, ML, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...color)
    doc.text(statusLabel(cert.status), ML + 50, y)
    if (cert.expiry) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BRAND.slate)
      doc.text(`Expires: ${new Date(cert.expiry).toLocaleDateString('en-GB')}`, ML + 90, y)
    }
    y += 7
  })

  // Maintenance
  const openJobs = jobs.filter(j => j.status !== 'completed')
  if (openJobs.length > 0) {
    y = checkPage(doc, y, 20)
    y = drawSectionTitle(doc, y, `Open Maintenance (${openJobs.length})`)
    openJobs.forEach(job => {
      y = checkPage(doc, y, 10)
      const pc = { emergency: BRAND.red, urgent: BRAND.amber, routine: [22,163,74], cosmetic: BRAND.slate }
      doc.setFillColor(...(pc[job.priority] || BRAND.slate))
      doc.rect(ML, y - 1, 3, 8, 'F')
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.dark)
      doc.text(job.title, ML + 6, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BRAND.slate)
      doc.text(`${job.priority.toUpperCase()} · ${job.status.replace('_', ' ')} · Reported ${job.reportedDate}`, ML + 6, y + 9)
      y += 14
    })
  }

  drawFooter(doc)
  doc.save(`Property_${property.address.replace(/[^a-z0-9]/gi, '_').slice(0,30)}.pdf`)
}

import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'

// ─── constants ────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  draft: '#94a3b8', sent: '#3b82f6', partial: '#f59e0b',
  paid: '#22c55e', overdue: '#ef4444', cancelled: '#64748b',
}
const STATUS_LABEL = {
  draft: 'Draft', sent: 'Sent', partial: 'Partial',
  paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled',
}
const METHOD_LABEL = {
  cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer',
  cheque: 'Cheque', online: 'Online', other: 'Other',
}
const PLAN_RATES = {
  free: { monthly: 0, annual: 0 },
  starter: { monthly: 15, annual: 12.5 },
  pro: { monthly: 25, annual: 20.83 },
  premium: { monthly: 40, annual: 33.33 },
  enterprise: { monthly: 0, annual: 0 },
}

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const todayStr = () => new Date().toISOString().slice(0, 10)
const firstOfMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const calcPeriodTo = (from, cycle) => {
  if (!from) return ''
  const d = new Date(from + 'T00:00:00')
  if (cycle === 'annual') {
    const to = new Date(d)
    to.setFullYear(to.getFullYear() + 1)
    to.setDate(to.getDate() - 1)
    return to.toISOString().slice(0, 10)
  }
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return to.toISOString().slice(0, 10)
}

const addDays = (dateStr, n) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const yearRange = () => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => y - 1 + i)
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = {
  h1:      { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 },
  hRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  genBtn:  { padding: '9px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  kpiRow:  { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  kpiCard: (c) => ({ flex: 1, minWidth: 140, background: `${c}0d`, border: `1px solid ${c}33`, borderRadius: 10, padding: '14px 18px' }),
  kpiNum:  (c) => ({ fontSize: 20, fontWeight: 800, color: c, margin: '4px 0 0' }),
  kpiLbl:  { fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  filters: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  sel:     { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#fff' },
  inp:     { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 },
  table:   { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th:      { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td:      { padding: '11px 14px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  badge:   (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c + '22', color: c }),
  actBtn:  { padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: '#fff', marginRight: 4 },
  linkBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 },
  pager:   { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  pgBtn:   (d) => ({ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: d ? 'not-allowed' : 'pointer', background: '#fff', opacity: d ? 0.4 : 1, fontSize: 13 }),

  // Overlay + modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal:   { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28 },
  wideModal:{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', padding: 28 },
  modalH:  { fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' },
  modalSub:{ fontSize: 13, color: '#64748b', margin: '0 0 20px' },
  label:   { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, marginTop: 12 },
  field:   { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  selFull: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  mRow:    { display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  cancelB: { padding: '9px 18px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  saveB:   (c='#3b82f6') => ({ padding: '9px 20px', background: c, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }),
}

// ─── calc helper ──────────────────────────────────────────────────────────────
const calcInvoice = (plan, cycle, students) => {
  const rate     = (PLAN_RATES[plan] || {})[cycle] || 0
  const months   = cycle === 'annual' ? 12 : 1
  const subtotal = parseFloat((rate * (students || 0) * months).toFixed(2))
  const gst      = parseFloat((subtotal * 0.18).toFixed(2))
  const total    = subtotal + gst
  return { rate, months, subtotal, gst, total }
}

// ─── CalcCard (preview) ───────────────────────────────────────────────────────
function CalcCard({ plan, cycle, students }) {
  const c = calcInvoice(plan, cycle, students)
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Invoice Preview</div>
      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Plan</span><strong style={{ color: '#1e293b' }}>{plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : '—'}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Students</span><strong style={{ color: '#1e293b' }}>{students || 0}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rate</span><strong style={{ color: '#1e293b' }}>₹{c.rate}/student{cycle === 'annual' ? '/mo' : '/mo'}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Months</span><strong style={{ color: '#1e293b' }}>{c.months}</strong></div>
        <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{fmt(c.subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST (18%)</span><span>₹{fmt(c.gst)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', marginTop: 6, paddingTop: 6, fontWeight: 800, fontSize: 15, color: '#1e293b' }}>
          <span>Total</span><span>₹{fmt(c.total)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Invoice "printable" view ─────────────────────────────────────────────────
function InvoiceView({ inv }) {
  if (!inv) return null
  const school = inv.school || {}
  const paid   = inv.total_paid || 0
  const bal    = inv.balance    || 0
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 24, fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div><div style={{ fontWeight: 900, fontSize: 18, color: '#1e293b' }}>Vikashana</div><div style={{ fontSize: 11, color: '#64748b' }}>School Management System</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800, fontSize: 20, color: '#6366f1', letterSpacing: 2 }}>INVOICE</div><div style={{ fontSize: 12, color: '#64748b' }}>{inv.invoice_no}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 12 }}>
        <div><div style={{ color: '#94a3b8', marginBottom: 2 }}>BILL TO</div><div style={{ fontWeight: 700 }}>{school.name}</div><div>{school.phone}</div><div style={{ color: '#64748b' }}>{school.email}</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ color: '#94a3b8', marginBottom: 2 }}>INVOICE DETAILS</div><div>Date: {fmtDate(inv.created_at)}</div><div>Due: <span style={{ color: inv.isOverdue ? '#ef4444' : '#1e293b' }}>{fmtDate(inv.due_date)}</span></div><div>Period: {inv.period_label}</div></div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead><tr style={{ background: '#f8fafc' }}>
          {['Description', 'Students', 'Rate', 'Months', 'Amount'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Description' ? 'left' : 'right', fontSize: 11, color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>{h}</th>)}
        </tr></thead>
        <tbody><tr>
          <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{inv.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} Subscription ({inv.period_label})</td>
          <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{inv.student_count}</td>
          <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>₹{inv.rate_per_student}</td>
          <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{inv.billing_cycle === 'annual' ? 12 : 1}</td>
          <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>₹{fmt(inv.subtotal)}</td>
        </tr></tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: 220 }}>
          {[['Subtotal', inv.subtotal], ['GST (18%)', inv.gst_amount]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#475569' }}>
              <span>{l}</span><span>₹{fmt(v)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #1e293b', fontWeight: 800, fontSize: 15, color: '#1e293b' }}>
            <span>Total</span><span>₹{fmt(inv.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
            <span>Paid</span><span>₹{fmt(paid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: bal > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
            <span>Balance Due</span><span>₹{fmt(bal)}</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
        <span style={{ ...s.badge(STATUS_COLOR[inv.status] || '#94a3b8'), fontSize: 13, padding: '5px 18px' }}>
          {inv.status === 'paid' ? '✅ ' : inv.status === 'overdue' ? '⚠️ ' : ''}
          {STATUS_LABEL[inv.status] || inv.status}
        </span>
      </div>
      {inv.payments && inv.payments.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>PAYMENT HISTORY</div>
          {inv.payments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', padding: '4px 0', borderBottom: '1px solid #f8fafc' }}>
              <span>{fmtDate(p.payment_date)} · {METHOD_LABEL[p.method] || p.method}</span>
              <span style={{ fontWeight: 700, color: '#22c55e' }}>₹{fmt(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Invoices() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [invoices, setInvoices] = useState([])
  const [meta,     setMeta]     = useState({})
  const [summary,  setSummary]  = useState({})
  const [loading,  setLoading]  = useState(false)
  const [page,     setPage]     = useState(1)
  const [statusF,  setStatusF]  = useState('')
  const [schoolF,  setSchoolF]  = useState('')
  const [fromF,    setFromF]    = useState('')
  const [toF,      setToF]      = useState('')
  const [schools,  setSchools]  = useState([])

  // Generate modal
  const [genOpen,  setGenOpen]  = useState(false)
  const [genForm,  setGenForm]  = useState({ school_id: '', billing_cycle: 'monthly', period_from: firstOfMonth(), due_date: addDays(firstOfMonth(), 7), notes: '', send_now: true })
  const [genSub,   setGenSub]   = useState(null)  // subscription info for selected school
  const [genSaving,setGenSaving]= useState(false)

  // Success modal
  const [successData, setSuccessData] = useState(null)

  // Invoice detail modal
  const [viewInv,  setViewInv]  = useState(null)
  const [viewLoad, setViewLoad] = useState(false)

  // Payment modal
  const [payInv,   setPayInv]   = useState(null)  // invoice object
  const [payForm,  setPayForm]  = useState({ amount: '', payment_date: todayStr(), method: 'upi', reference_no: '', notes: '' })
  const [paySaving,setPaySaving]= useState(false)

  // Edit modal
  const [editInv,    setEditInv]    = useState(null)
  const [editForm,   setEditForm]   = useState({})

  // Password confirmation modal
  const [pwdConfirm, setPwdConfirm] = useState(null) // { title, msg, action, invoice? }
  const [pwdValue,   setPwdValue]   = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page }
    if (statusF) params.status    = statusF
    if (schoolF) params.school_id = schoolF
    if (fromF)   params.from      = fromF
    if (toF)     params.to        = toF
    api.get('invoices', { params })
      .then(r => { setInvoices(r.data.data); setMeta(r.data.meta); setSummary(r.data.summary || {}) })
      .finally(() => setLoading(false))
  }, [page, statusF, schoolF, fromF, toF])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('invoices/schools').then(r => {
      const list = r.data.data || []
      setSchools(list)
      // Handle ?generate=schoolId URL param
      const generateId = searchParams.get('generate')
      if (generateId) {
        setGenOpen(true)
        // Pre-select school after schools list is populated
        setTimeout(() => handleSchoolSelectById(generateId, list), 0)
        setSearchParams({}) // clear the param
      }
    })
  }, []) // eslint-disable-line

  // When school is selected in generate modal, fill subscription info + auto-populate period
  const handleSchoolSelect = (schoolId) => {
    setGenForm(f => ({ ...f, school_id: schoolId }))
    if (!schoolId) { setGenSub(null); return }
    const sch = schools.find(s => s.id == schoolId)
    const sub = sch?.subscription
    if (sub) {
      setGenSub(sub)
      const cycle = sub.billing_cycle || 'monthly'

      // Determine next billing period start
      let periodFrom = firstOfMonth()
      if (sub.status === 'trial' && sub.trial_ends_at) {
        // First invoice period starts the month after trial ends
        const d = new Date(sub.trial_ends_at)
        periodFrom = `${d.getFullYear()}-${String(d.getMonth() + 2 > 12 ? 1 : d.getMonth() + 2).padStart(2,'0')}-01`
        // handle year rollover
        if (d.getMonth() + 2 > 12) {
          periodFrom = `${d.getFullYear() + 1}-01-01`
        }
      } else if (sub.renewal_date) {
        const d = new Date(sub.renewal_date + 'T00:00:00')
        periodFrom = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-01`
      }

      setGenForm(f => ({
        ...f,
        billing_cycle: cycle,
        period_from:   periodFrom,
        due_date:      addDays(periodFrom, 7),
      }))
    } else {
      setGenSub(null)
    }
  }

  // Helper: pre-select a school by id using a provided schools list
  const handleSchoolSelectById = (schoolId, schoolList) => {
    const id = String(schoolId)
    const sch = (schoolList || schools).find(s => String(s.id) === id)
    const sub = sch?.subscription
    setGenForm(f => ({ ...f, school_id: id }))
    if (sub) {
      setGenSub(sub)
      const cycle = sub.billing_cycle || 'monthly'
      let periodFrom = firstOfMonth()
      if (sub.status === 'trial' && sub.trial_ends_at) {
        const d = new Date(sub.trial_ends_at)
        if (d.getMonth() + 2 > 12) {
          periodFrom = `${d.getFullYear() + 1}-01-01`
        } else {
          periodFrom = `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2,'0')}-01`
        }
      } else if (sub.renewal_date) {
        const d = new Date(sub.renewal_date + 'T00:00:00')
        periodFrom = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-01`
      }
      setGenForm(f => ({ ...f, billing_cycle: cycle, period_from: periodFrom, due_date: addDays(periodFrom, 7) }))
    } else {
      setGenSub(null)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!genForm.school_id) return
    setGenSaving(true)
    try {
      const res = await api.post('invoices/generate', genForm)
      const inv = res.data.data
      const wa  = res.data.whatsapp_message
      setGenOpen(false)
      setGenForm({ school_id: '', billing_cycle: 'monthly', period_from: firstOfMonth(), due_date: addDays(firstOfMonth(), 7), notes: '', send_now: true })
      setGenSub(null)
      setSuccessData({ invoice: inv, waMsg: wa })
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invoice')
    } finally { setGenSaving(false) }
  }

  const openView = async (invId) => {
    setViewLoad(true)
    setViewInv(null)
    try {
      const r = await api.get(`invoices/${invId}`)
      setViewInv(r.data.data)
    } finally { setViewLoad(false) }
  }

  const openPay = (inv) => {
    setPayInv(inv)
    setPayForm({ amount: String(inv.balance ?? inv.total), payment_date: todayStr(), method: 'upi', reference_no: '', notes: '' })
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    setPaySaving(true)
    try {
      const res = await api.post(`invoices/${payInv.id}/payments`, payForm)
      const d   = res.data.data
      let msg   = res.data.message || 'Payment recorded.'
      if (d?.activated) {
        msg += `\n\n✅ Subscription activated!\nNext renewal: ${d.renewal_date || '—'}`
      } else if (d?.balance > 0) {
        msg += `\n\nBalance remaining: ₹${Number(d.balance).toLocaleString('en-IN')}`
      }
      setPayInv(null)
      if (viewInv && viewInv.id === payInv.id) {
        openView(payInv.id)
      }
      load()
      alert(msg)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment')
    } finally { setPaySaving(false) }
  }

  const handleMarkSent = async (inv) => {
    await api.put(`invoices/${inv.id}/send`)
    load()
  }

  const handleCancel = async (inv) => {
    if (!confirm(`Cancel invoice ${inv.invoice_no}?`)) return
    await api.put(`invoices/${inv.id}/cancel`)
    load()
  }

  const openEdit = (inv) => {
    setEditInv(inv)
    setEditForm({
      period_label: inv.period_label || '',
      due_date:     inv.due_date ? inv.due_date.slice(0, 10) : '',
      status:       inv.status,
      notes:        inv.notes || '',
    })
  }

  const submitEdit = () => {
    setPwdValue('')
    setPwdConfirm({
      title:  'Confirm Edit',
      msg:    `Update invoice ${editInv.invoice_no}? Enter your password to save changes.`,
      action: 'edit',
    })
  }

  const openDeleteConfirm = (inv) => {
    setPwdValue('')
    setPwdConfirm({
      title:   'Delete Invoice',
      msg:     `Permanently delete invoice ${inv.invoice_no} and all its payment records? This cannot be undone.`,
      action:  'delete',
      invoice: inv,
    })
  }

  const handlePwdConfirm = async () => {
    if (!pwdValue) return
    setPwdLoading(true)
    try {
      if (pwdConfirm.action === 'edit') {
        await api.put(`invoices/${editInv.id}`, { ...editForm, password: pwdValue })
        setEditInv(null)
        setPwdConfirm(null)
        setPwdValue('')
        if (viewInv?.id === editInv.id) openView(editInv.id)
        load()
      } else if (pwdConfirm.action === 'delete') {
        await api.delete(`invoices/${pwdConfirm.invoice.id}`, { data: { password: pwdValue } })
        if (viewInv?.id === pwdConfirm.invoice.id) setViewInv(null)
        setPwdConfirm(null)
        setPwdValue('')
        load()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed. Check your password.')
    } finally {
      setPwdLoading(false)
    }
  }

  const buildWaLink = (phone, msg) => {
    const num = phone ? phone.replace(/\D/g, '') : ''
    const p   = num.startsWith('91') ? num : '91' + num
    return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div>
      <div style={s.hRow}>
        <h1 style={s.h1}>Invoices</h1>
        <button style={s.genBtn} onClick={() => setGenOpen(true)}>+ Generate Invoice</button>
      </div>

      {/* KPI */}
      <div style={s.kpiRow}>
        {[
          { label: 'Total Billed',   val: `₹${fmt(summary.total_billed)}`,     color: '#6366f1' },
          { label: 'Collected',      val: `₹${fmt(summary.total_collected)}`,   color: '#22c55e' },
          { label: 'Pending',        val: `₹${fmt(summary.total_pending)}`,     color: '#f59e0b' },
          { label: 'Overdue',        val: summary.overdue_count || 0,           color: '#ef4444' },
          { label: 'Total Invoices', val: summary.total_count || 0,             color: '#3b82f6' },
        ].map(({ label, val, color }) => (
          <div key={label} style={s.kpiCard(color)}>
            <div style={s.kpiLbl}>{label}</div>
            <div style={s.kpiNum(color)}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <select style={s.sel} value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select style={s.sel} value={schoolF} onChange={e => { setSchoolF(e.target.value); setPage(1) }}>
          <option value="">All Schools</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input style={s.inp} type="date" value={fromF} onChange={e => { setFromF(e.target.value); setPage(1) }} title="From" />
        <span style={{ fontSize: 13, color: '#94a3b8' }}>–</span>
        <input style={s.inp} type="date" value={toF} onChange={e => { setToF(e.target.value); setPage(1) }} title="To" />
        <button style={{ ...s.actBtn, borderColor: '#6366f1', color: '#6366f1' }}
          onClick={() => { setStatusF(''); setSchoolF(''); setFromF(''); setToF(''); setPage(1) }}>Reset</button>
      </div>

      {/* Table */}
      <table style={s.table}>
        <thead>
          <tr>
            {['Invoice No','School','Period','Students','Total','Paid','Balance','Status','Due Date','Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading…</td></tr>
          ) : invoices.length === 0 ? (
            <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', color: '#94a3b8', padding: 40 }}>No invoices found</td></tr>
          ) : invoices.map(inv => {
            const paid = parseFloat(inv.total_paid || 0)
            const bal  = Math.max(0, parseFloat(inv.total) - paid)
            const isDue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date()
            return (
              <tr key={inv.id} style={inv.status === 'overdue' ? { background: '#fef2f2' } : {}}>
                <td style={s.td}>
                  <button style={s.linkBtn} onClick={() => openView(inv.id)}>{inv.invoice_no}</button>
                </td>
                <td style={s.td}>
                  <button style={s.linkBtn} onClick={() => navigate(`/schools/${inv.school_id}`)}>
                    {inv.school?.name || '—'}
                  </button>
                </td>
                <td style={{ ...s.td, fontSize: 12 }}>{inv.period_label}</td>
                <td style={{ ...s.td, textAlign: 'center' }}>{inv.student_count}</td>
                <td style={{ ...s.td, fontWeight: 700 }}>₹{fmt(inv.total)}</td>
                <td style={{ ...s.td, color: '#22c55e', fontWeight: 600 }}>₹{fmt(paid)}</td>
                <td style={{ ...s.td, color: bal > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>₹{fmt(bal)}</td>
                <td style={s.td}><span style={s.badge(STATUS_COLOR[inv.status] || '#94a3b8')}>{STATUS_LABEL[inv.status] || inv.status}</span></td>
                <td style={{ ...s.td, fontSize: 12, color: isDue ? '#ef4444' : '#64748b', fontWeight: isDue ? 700 : 400 }}>{fmtDate(inv.due_date)}</td>
                <td style={s.td}>
                  <button style={s.actBtn} onClick={() => openView(inv.id)}>View</button>
                  {inv.status === 'draft' && (
                    <button style={{ ...s.actBtn, color: '#3b82f6', borderColor: '#93c5fd' }} onClick={() => handleMarkSent(inv)}>Send</button>
                  )}
                  {['sent','partial','overdue'].includes(inv.status) && (
                    <button style={{ ...s.actBtn, color: '#22c55e', borderColor: '#86efac' }} onClick={() => openPay(inv)}>Pay</button>
                  )}
                  {['draft','sent'].includes(inv.status) && (
                    <button style={{ ...s.actBtn, color: '#f59e0b', borderColor: '#fcd34d' }} onClick={() => handleCancel(inv)}>Cancel</button>
                  )}
                  <button style={{ ...s.actBtn, color: '#6366f1', borderColor: '#c7d2fe' }} onClick={() => openEdit(inv)}>Edit</button>
                  <button style={{ ...s.actBtn, color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => openDeleteConfirm(inv)}>Delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {meta.last_page > 1 && (
        <div style={s.pager}>
          <button style={s.pgBtn(page <= 1)} disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {meta.last_page}</span>
          <button style={s.pgBtn(page >= meta.last_page)} disabled={page >= meta.last_page} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      )}

      {/* ── Generate Invoice Modal ── */}
      {genOpen && (
        <div style={s.overlay} onClick={() => setGenOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>Generate Invoice</h2>
            <p style={s.modalSub}>Auto-calculates amount from plan and student count</p>
            <form onSubmit={handleGenerate}>
              <label style={s.label}>School *</label>
              <select style={s.selFull} value={genForm.school_id} required
                onChange={e => handleSchoolSelect(e.target.value)}>
                <option value="">— Select school —</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {genForm.school_id && !genSub && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', marginTop: 8, fontSize: 12, color: '#991b1b' }}>
                  ⚠️ No subscription found for this school. <strong>Set up a subscription first</strong> before generating an invoice.
                </div>
              )}
              {genSub && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 12px', marginTop: 8, fontSize: 12, color: '#0369a1' }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>Plan: <strong>{genSub.plan}</strong></span>
                    <span>Status: <strong>{genSub.status}</strong></span>
                    <span>Students: <strong>{genSub.student_count || 0}</strong></span>
                    <span>Cycle: <strong>{genSub.billing_cycle}</strong></span>
                    {genSub.status === 'trial' && genSub.trial_ends_at && (
                      <span>Trial ends: <strong>{new Date(genSub.trial_ends_at).toLocaleDateString('en-IN')}</strong></span>
                    )}
                    {genSub.renewal_date && genSub.status !== 'trial' && (
                      <span>Renewal: <strong>{new Date(genSub.renewal_date).toLocaleDateString('en-IN')}</strong></span>
                    )}
                  </div>
                  <div style={{ marginTop: 4, color: '#0369a1', opacity: 0.8 }}>
                    Subscription ID: #{genSub.id} · Invoice will be linked to this subscription
                  </div>
                </div>
              )}

              <label style={s.label}>Billing Cycle *</label>
              <select style={s.selFull} value={genForm.billing_cycle}
                onChange={e => setGenForm(f => ({ ...f, billing_cycle: e.target.value }))}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (20% off)</option>
              </select>

              <label style={s.label}>Billing Period *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {genForm.billing_cycle === 'monthly' && (
                  <select style={{ ...s.selFull, flex: 2 }}
                    value={new Date(genForm.period_from + 'T00:00:00').getMonth()}
                    onChange={e => {
                      const d = new Date(genForm.period_from + 'T00:00:00')
                      d.setMonth(parseInt(e.target.value)); d.setDate(1)
                      const from = d.toISOString().slice(0, 10)
                      setGenForm(f => ({ ...f, period_from: from, due_date: addDays(from, 7) }))
                    }}>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                )}
                <select style={{ ...s.selFull, flex: 1 }}
                  value={new Date(genForm.period_from + 'T00:00:00').getFullYear()}
                  onChange={e => {
                    const d = new Date(genForm.period_from + 'T00:00:00')
                    d.setFullYear(parseInt(e.target.value)); d.setDate(1)
                    const from = d.toISOString().slice(0, 10)
                    setGenForm(f => ({ ...f, period_from: from, due_date: addDays(from, 7) }))
                  }}>
                  {yearRange().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 10px' }}>
                <div>
                  <label style={s.label}>Period From</label>
                  <input style={{ ...s.field, background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                    type="date" value={genForm.period_from} readOnly />
                </div>
                <div>
                  <label style={s.label}>Period To</label>
                  <input style={{ ...s.field, background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                    type="date" value={calcPeriodTo(genForm.period_from, genForm.billing_cycle)} readOnly />
                </div>
                <div>
                  <label style={s.label}>Due Date</label>
                  <input style={s.field} type="date" value={genForm.due_date}
                    onChange={e => setGenForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>

              {genSub && (
                <CalcCard
                  plan={genSub.plan}
                  cycle={genForm.billing_cycle}
                  students={genSub.student_count || 0}
                />
              )}

              <label style={s.label}>Notes (optional)</label>
              <textarea style={{ ...s.field, minHeight: 56, resize: 'vertical' }} value={genForm.notes}
                onChange={e => setGenForm(f => ({ ...f, notes: e.target.value }))} />

              <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 14 }}>
                <input type="checkbox" checked={genForm.send_now}
                  onChange={e => setGenForm(f => ({ ...f, send_now: e.target.checked }))} />
                Mark as Sent immediately (enable WhatsApp sharing)
              </label>

              <div style={s.mRow}>
                <button type="button" style={s.cancelB} onClick={() => setGenOpen(false)}>Cancel</button>
                <button type="submit" style={s.saveB('#6366f1')} disabled={genSaving || !genForm.school_id || !genSub}>
                  {genSaving ? 'Generating…' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      {successData && (
        <div style={s.overlay} onClick={() => setSuccessData(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '8px 0 4px' }}>
                Invoice {successData.invoice.invoice_no} Generated!
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                {successData.invoice.school?.name} · {successData.invoice.period_label}
              </p>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, fontSize: 13, marginBottom: 20 }}>
              {[
                ['Invoice No', successData.invoice.invoice_no],
                ['School',     successData.invoice.school?.name],
                ['Period',     successData.invoice.period_label],
                ['Total',      `₹${fmt(successData.invoice.total)} (incl. GST)`],
                ['Due Date',   fmtDate(successData.invoice.due_date)],
                ['Status',     STATUS_LABEL[successData.invoice.status] || successData.invoice.status],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>{l}</span>
                  <strong style={{ color: '#1e293b' }}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={buildWaLink(successData.invoice.school?.phone, successData.waMsg)}
                target="_blank" rel="noopener noreferrer"
                style={{ ...s.saveB('#25d366'), textDecoration: 'none', display: 'inline-block' }}>
                📱 Send on WhatsApp
              </a>
              <button style={s.saveB('#3b82f6')} onClick={() => {
                navigator.clipboard?.writeText(successData.waMsg)
                alert('Invoice details copied!')
              }}>📋 Copy Details</button>
              <button style={s.saveB('#6366f1')} onClick={() => {
                openView(successData.invoice.id)
                setSuccessData(null)
              }}>View Invoice</button>
              <button style={s.cancelB} onClick={() => setSuccessData(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice Detail Modal ── */}
      {(viewInv || viewLoad) && (
        <div style={s.overlay} onClick={() => setViewInv(null)}>
          <div style={s.wideModal} onClick={e => e.stopPropagation()}>
            {viewLoad ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading…</p>
            ) : viewInv && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h2 style={s.modalH}>{viewInv.invoice_no}</h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{viewInv.school?.name}</p>
                  </div>
                  <span style={s.badge(STATUS_COLOR[viewInv.status] || '#94a3b8')}>{STATUS_LABEL[viewInv.status] || viewInv.status}</span>
                </div>

                <InvoiceView inv={viewInv} />

                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  {['sent','partial','overdue'].includes(viewInv.status) && (
                    <button style={s.saveB('#22c55e')} onClick={() => {
                      setViewInv(null)
                      openPay(viewInv)
                    }}>Record Payment</button>
                  )}
                  {viewInv.status !== 'cancelled' && viewInv.status !== 'paid' && viewInv.school?.phone && (
                    <a
                      href={buildWaLink(viewInv.school.phone, buildWaMsg(viewInv))}
                      target="_blank" rel="noopener noreferrer"
                      style={{ ...s.saveB('#25d366'), textDecoration: 'none', display: 'inline-block' }}>
                      📱 WhatsApp
                    </a>
                  )}
                  <button style={s.saveB('#6366f1')} onClick={() => { setViewInv(null); openEdit(viewInv) }}>✏️ Edit</button>
                  <button style={s.saveB('#ef4444')} onClick={() => { setViewInv(null); openDeleteConfirm(viewInv) }}>🗑️ Delete</button>
                  <button style={s.cancelB} onClick={() => setViewInv(null)}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Invoice Modal ── */}
      {editInv && (
        <div style={s.overlay} onClick={() => setEditInv(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>✏️ Edit Invoice</h2>
            <p style={s.modalSub}>{editInv.invoice_no} · {editInv.school?.name}</p>

            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e', marginBottom: 4 }}>
              ⚠️ Only metadata fields can be edited. Financial amounts (total, GST, rate) are locked after generation.
            </div>

            {/* Read-only period info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px', marginTop: 12 }}>
              <div>
                <label style={s.label}>Period From</label>
                <input style={{ ...s.field, background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                  type="date" value={editInv.period_start ? editInv.period_start.slice(0,10) : ''} readOnly />
              </div>
              <div>
                <label style={s.label}>Period To</label>
                <input style={{ ...s.field, background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                  type="date" value={editInv.period_end ? editInv.period_end.slice(0,10) : ''} readOnly />
              </div>
            </div>

            <label style={s.label}>Period Label</label>
            <input style={s.field} value={editForm.period_label}
              onChange={e => setEditForm(f => ({ ...f, period_label: e.target.value }))} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div>
                <label style={s.label}>Due Date</label>
                <input style={s.field} type="date" value={editForm.due_date}
                  onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select style={s.selFull} value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <label style={s.label}>Notes</label>
            <textarea style={{ ...s.field, minHeight: 64, resize: 'vertical' }} value={editForm.notes}
              onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />

            <div style={s.mRow}>
              <button style={s.cancelB} onClick={() => setEditInv(null)}>Cancel</button>
              <button style={s.saveB('#6366f1')} onClick={submitEdit}>Save Changes →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Password Confirmation Modal ── */}
      {pwdConfirm && (
        <div style={s.overlay} onClick={() => { if (!pwdLoading) { setPwdConfirm(null); setPwdValue('') } }}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 38 }}>{pwdConfirm.action === 'delete' ? '🗑️' : '✏️'}</div>
              <h2 style={{ ...s.modalH, textAlign: 'center', marginTop: 8 }}>{pwdConfirm.title}</h2>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
              {pwdConfirm.msg}
            </p>
            {pwdConfirm.action === 'delete' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#991b1b', marginBottom: 12 }}>
                ⚠️ All payment records linked to this invoice will also be deleted.
              </div>
            )}
            <label style={s.label}>Your Password *</label>
            <input
              style={s.field}
              type="password"
              placeholder="Enter your admin password"
              value={pwdValue}
              autoFocus
              onChange={e => setPwdValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && pwdValue && !pwdLoading && handlePwdConfirm()}
            />
            <div style={s.mRow}>
              <button style={s.cancelB} disabled={pwdLoading}
                onClick={() => { setPwdConfirm(null); setPwdValue('') }}>
                Cancel
              </button>
              <button
                style={s.saveB(pwdConfirm.action === 'delete' ? '#ef4444' : '#6366f1')}
                disabled={!pwdValue || pwdLoading}
                onClick={handlePwdConfirm}>
                {pwdLoading ? 'Verifying…' : pwdConfirm.action === 'delete' ? '🗑️ Delete' : '✅ Confirm Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Payment Modal ── */}
      {payInv && (
        <div style={s.overlay} onClick={() => setPayInv(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>Record Payment</h2>
            <p style={s.modalSub}>{payInv.invoice_no} · {payInv.school?.name}</p>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Period</span>
                <strong>{payInv.period_label}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Invoice total</span>
                <strong>₹{fmt(payInv.total)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Already paid</span>
                <strong>₹{fmt(payInv.total_paid || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #86efac', marginTop: 6, paddingTop: 6, fontWeight: 700 }}>
                <span>Balance due</span>
                <span>₹{fmt(Math.max(0, parseFloat(payInv.total) - parseFloat(payInv.total_paid || 0)))}</span>
              </div>
              {payInv.due_date && (
                <div style={{ fontSize: 12, color: new Date(payInv.due_date) < new Date() ? '#dc2626' : '#166534', marginTop: 4 }}>
                  Due: {fmtDate(payInv.due_date)}
                </div>
              )}
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                <div>
                  <label style={s.label}>Amount (₹) *</label>
                  <input style={s.field} type="number" step="0.01" required
                    value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                  {payForm.amount && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                      Remaining: ₹{fmt(Math.max(0, parseFloat(payInv.total) - parseFloat(payInv.total_paid || 0) - parseFloat(payForm.amount || 0)))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={s.label}>Payment Date *</label>
                  <input style={s.field} type="date" required
                    value={payForm.payment_date}
                    onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Method *</label>
                  <select style={s.selFull} value={payForm.method}
                    onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                    {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Reference / UTR</label>
                  <input style={s.field} type="text" placeholder="Transaction ID / Ref"
                    value={payForm.reference_no}
                    onChange={e => setPayForm(f => ({ ...f, reference_no: e.target.value }))} />
                </div>
              </div>
              <label style={s.label}>Billing Cycle</label>
              <input style={{ ...s.field, background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                value={payInv.billing_cycle === 'annual' ? 'Annual' : 'Monthly'} readOnly />
              <label style={s.label}>Notes</label>
              <textarea style={{ ...s.field, minHeight: 56, resize: 'vertical' }}
                value={payForm.notes}
                onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              <div style={s.mRow}>
                <button type="button" style={s.cancelB} onClick={() => setPayInv(null)}>Cancel</button>
                <button type="submit" style={s.saveB('#22c55e')} disabled={paySaving}>
                  {paySaving ? 'Saving…' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// helper used in View modal for WA share
function buildWaMsg(inv) {
  const school = inv.school || {}
  return [
    '🏫 *Vikashana Invoice Reminder*',
    '',
    `Invoice: *${inv.invoice_no}*`,
    `School: ${school.name}`,
    `Period: ${inv.period_label}`,
    `Total: ₹${parseFloat(inv.total).toLocaleString('en-IN')}`,
    `Balance: ₹${parseFloat(inv.balance || 0).toLocaleString('en-IN')}`,
    `Due: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}`,
    '',
    'Please arrange payment at your earliest convenience.',
    'Team Vikashana',
  ].join('\n')
}

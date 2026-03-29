import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

const INV_STATUS_COLOR = { draft: '#94a3b8', sent: '#3b82f6', partial: '#f59e0b', paid: '#22c55e', overdue: '#ef4444', cancelled: '#64748b' }
const INV_STATUS_LABEL = { draft: 'Draft', sent: 'Sent', partial: 'Partial', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' }

const STATUS_COLOR = { active: '#22c55e', trial: '#f59e0b', overdue: '#ef4444', cancelled: '#94a3b8', expired: '#dc2626' }
const PLAN_COLOR   = { free: '#94a3b8', starter: '#3b82f6', pro: '#8b5cf6', premium: '#f59e0b', enterprise: '#ec4899' }
const PLAN_LABEL   = { free: 'Forever Free', starter: 'Starter', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' }
const PLAN_RATES   = { free: 0, starter: 15, pro: 25, premium: 40, enterprise: 0 }
const METHOD_LABEL = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', online: 'Online', other: 'Other' }
const METHOD_COLOR = { cash: '#22c55e', upi: '#8b5cf6', bank_transfer: '#3b82f6', cheque: '#f59e0b', online: '#06b6d4', other: '#94a3b8' }

const s = {
  back:     { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0, fontWeight: 600 },
  hdrRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  hdrName:  { fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 },
  hdrSub:   { fontSize: 13, color: '#64748b', margin: '4px 0 0' },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  grid3:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 },
  card:     { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardH:    { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  field:    { marginBottom: 14 },
  fLabel:   { fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  fVal:     { fontSize: 14, color: '#1e293b', fontWeight: 600 },
  badge:    (c) => ({ display: 'inline-block', padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: c + '22', color: c }),
  kpiCard:  (c) => ({ background: `${c}0d`, border: `1px solid ${c}33`, borderRadius: 12, padding: 20, textAlign: 'center' }),
  kpiVal:   (c) => ({ fontSize: 26, fontWeight: 800, color: c, margin: '0 0 4px' }),
  kpiLbl:   { fontSize: 12, color: '#64748b', margin: 0 },
  btn:      (c) => ({ padding: '8px 16px', background: c, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }),
  outBtn:   (c) => ({ padding: '8px 16px', background: 'transparent', color: c, border: `1px solid ${c}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }),
  actRow:   { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },

  // Payment table
  table:    { width: '100%', borderCollapse: 'collapse' },
  th:       { padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  td:       { padding: '11px 14px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #f8fafc' },
  emptyTxt: { textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 },

  // Edit modal
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal:    { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalH:   { fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' },
  label:    { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, marginTop: 12 },
  input:    { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  select:   { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  mRow:     { display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  saveBtn:  { padding: '9px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  banner:   { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: 13, color: '#0369a1' },
}

const autoRenewalDate = (cycle) => {
  const d = new Date()
  if (cycle === 'annual') d.setFullYear(d.getFullYear() + 1)
  else d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

const calcAmount = (plan, students, cycle) => {
  const monthly = (PLAN_RATES[plan] || 0) * (students || 0)
  return cycle === 'annual' ? Math.round(monthly * 12 * 0.8) : monthly
}

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function SubscriptionDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [activeTab, setActiveTab] = useState('invoices') // 'invoices' | 'payments'
  const [invoices, setInvoices]   = useState([])
  const [invLoading, setInvLoading] = useState(false)

  // Edit subscription
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [amountAuto, setAmountAuto] = useState(true)
  const [saving,   setSaving]   = useState(false)

  // Record payment
  const [payOpen,  setPayOpen]  = useState(false)
  const [payForm,  setPayForm]  = useState({ amount: '', payment_date: todayStr(), method: 'upi', reference_no: '', period_label: '', notes: '' })
  const [paySaving, setPaySaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`subscriptions/${id}`)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }

  const loadInvoices = useCallback(() => {
    setInvLoading(true)
    api.get('invoices', { params: { school_id: data?.subscription?.school_id } })
      .then(r => setInvoices(r.data.data || []))
      .finally(() => setInvLoading(false))
  }, [data?.subscription?.school_id])

  useEffect(() => { load() }, [id])
  useEffect(() => { if (data?.subscription?.school_id) loadInvoices() }, [data?.subscription?.school_id])

  const openEdit = () => {
    const sub = data.subscription
    setAmountAuto(true)
    setEditForm({
      plan:           sub.plan,
      status:         sub.status,
      billing_cycle:  sub.billing_cycle,
      renewal_date:   sub.renewal_date || autoRenewalDate(sub.billing_cycle),
      monthly_amount: sub.monthly_amount || calcAmount(sub.plan, sub.student_count, sub.billing_cycle),
      mobile_enabled: sub.mobile_enabled,
      notes:          sub.notes || '',
    })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    setSaving(true)
    try {
      await api.put(`subscriptions/${id}`, editForm)
      setEditOpen(false)
      load()
    } catch { alert('Failed to save') }
    finally { setSaving(false) }
  }

  const handlePlanChange = (plan) => {
    const updated = { ...editForm, plan }
    if (amountAuto) updated.monthly_amount = calcAmount(plan, data.subscription.student_count, editForm.billing_cycle)
    setEditForm(updated)
  }

  const handleCycleChange = (cycle) => {
    const updated = { ...editForm, billing_cycle: cycle, renewal_date: autoRenewalDate(cycle) }
    if (amountAuto) updated.monthly_amount = calcAmount(editForm.plan, data.subscription.student_count, cycle)
    setEditForm(updated)
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    setPaySaving(true)
    try {
      await api.post(`subscriptions/${id}/payments`, payForm)
      setPayOpen(false)
      setPayForm({ amount: '', payment_date: todayStr(), method: 'upi', reference_no: '', period_label: '', notes: '' })
      load()
    } catch { alert('Failed to record payment') }
    finally { setPaySaving(false) }
  }

  const handleDeletePayment = async (payId) => {
    if (!confirm('Delete this payment record?')) return
    await api.delete(`payments/${payId}`)
    load()
  }

  const handleExtendTrial = async () => {
    const days = parseInt(prompt('Extend trial by how many days?', '14'), 10)
    if (!days) return
    await api.post(`subscriptions/${id}/extend-trial`, { days })
    load()
  }

  const handleSync = async () => {
    await api.post(`subscriptions/${id}/sync-student-count`)
    load()
  }

  if (loading) return <p style={{ color: '#64748b', padding: 24 }}>Loading…</p>
  if (!data)   return <p style={{ color: '#ef4444', padding: 24 }}>Not found</p>

  const { subscription: sub, payments, total_paid } = data
  const school   = sub.school || {}
  const amountCalc = calcAmount(editForm.plan || sub.plan, sub.student_count, editForm.billing_cycle || sub.billing_cycle)

  return (
    <div>
      <button style={s.back} onClick={() => navigate('/subscriptions')}>← Back to Subscriptions</button>

      <div style={s.hdrRow}>
        <div>
          <h1 style={s.hdrName}>{school.name || '—'}</h1>
          <p style={s.hdrSub}>Subscription #{sub.id} · {school.email || ''}</p>
        </div>
        <div style={s.actRow}>
          <button style={s.btn('#3b82f6')} onClick={openEdit}>Edit Subscription</button>
          <button style={s.btn('#22c55e')} onClick={() => setPayOpen(true)}>+ Record Payment</button>
          {sub.status === 'trial' && <button style={s.outBtn('#f59e0b')} onClick={handleExtendTrial}>Extend Trial</button>}
          <button style={s.outBtn('#8b5cf6')} onClick={handleSync}>Sync Students</button>
        </div>
      </div>

      {/* KPI row */}
      <div style={s.grid3}>
        <div style={s.kpiCard('#22c55e')}>
          <p style={s.kpiVal('#22c55e')}>₹{(total_paid || 0).toLocaleString('en-IN')}</p>
          <p style={s.kpiLbl}>Total Paid</p>
        </div>
        <div style={s.kpiCard('#3b82f6')}>
          <p style={s.kpiVal('#3b82f6')}>₹{(sub.monthly_amount || 0).toLocaleString('en-IN')}</p>
          <p style={s.kpiLbl}>Monthly Amount</p>
        </div>
        <div style={s.kpiCard('#8b5cf6')}>
          <p style={s.kpiVal('#8b5cf6')}>{sub.student_count || 0}</p>
          <p style={s.kpiLbl}>Students</p>
        </div>
      </div>

      {/* Subscription details + school info */}
      <div style={s.grid2}>
        <div style={s.card}>
          <p style={s.cardH}>Subscription Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {[
              { label: 'Plan',          val: <span style={s.badge(PLAN_COLOR[sub.plan] || '#94a3b8')}>{PLAN_LABEL[sub.plan] || sub.plan}</span> },
              { label: 'Status',        val: <span style={s.badge(STATUS_COLOR[sub.status] || '#94a3b8')}>{sub.status}</span> },
              { label: 'Billing Cycle', val: sub.billing_cycle || '—' },
              { label: 'Mobile Access', val: sub.mobile_enabled ? '✅ Enabled' : '❌ Disabled' },
              { label: 'Renewal Date',  val: sub.renewal_date || '—' },
              { label: 'Trial Ends',    val: sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('en-IN') : '—' },
              { label: '₹/Student',     val: `₹${PLAN_RATES[sub.plan] || 0}` },
              { label: 'Annual Value',  val: `₹${((sub.monthly_amount || 0) * 12).toLocaleString('en-IN')}` },
            ].map(({ label, val }) => (
              <div key={label} style={s.field}>
                <p style={s.fLabel}>{label}</p>
                <p style={s.fVal}>{val}</p>
              </div>
            ))}
          </div>
          {sub.notes && (
            <div style={{ marginTop: 8, background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#475569' }}>
              <strong>Notes:</strong> {sub.notes}
            </div>
          )}
        </div>

        <div style={s.card}>
          <p style={s.cardH}>School Info</p>
          {[
            { label: 'Name',         val: school.name    },
            { label: 'Email',        val: school.email   },
            { label: 'Phone',        val: school.phone   },
            { label: 'Address',      val: school.address },
          ].map(({ label, val }) => (
            <div key={label} style={s.field}>
              <p style={s.fLabel}>{label}</p>
              <p style={s.fVal}>{val || '—'}</p>
            </div>
          ))}
          <button style={{ ...s.outBtn('#3b82f6'), marginTop: 8 }} onClick={() => navigate(`/schools/${sub.school_id}`)}>View School →</button>
        </div>
      </div>

      {/* Tabs: Invoice History + Payment History */}
      <div style={s.card}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9', paddingBottom: 0 }}>
          {[
            { key: 'invoices',  label: `Invoices (${invoices.length})` },
            { key: 'payments',  label: `Payments (${payments.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                background: 'none', borderBottom: activeTab === key ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === key ? '#6366f1' : '#64748b', marginBottom: -2 }}>
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {activeTab === 'invoices' && (
            <button style={s.btn('#6366f1')} onClick={() => navigate('/invoices')}>+ Generate Invoice</button>
          )}
          {activeTab === 'payments' && (
            <button style={s.btn('#22c55e')} onClick={() => setPayOpen(true)}>+ Record Payment</button>
          )}
        </div>

        {/* Invoice History */}
        {activeTab === 'invoices' && (
          invLoading ? <p style={s.emptyTxt}>Loading invoices…</p> :
          invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
              <p style={{ margin: '0 0 12px' }}>No invoices yet for this school</p>
              <button style={s.btn('#6366f1')} onClick={() => navigate('/invoices')}>Generate First Invoice</button>
            </div>
          ) : (
            <table style={s.table}>
              <thead><tr>
                {['Invoice No','Period','Students','Total','Paid','Balance','Status','Due Date',''].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {invoices.map(inv => {
                  const paid = parseFloat(inv.total_paid || 0)
                  const bal  = Math.max(0, parseFloat(inv.total) - paid)
                  return (
                    <tr key={inv.id} style={inv.status === 'overdue' ? { background: '#fef2f2' } : {}}>
                      <td style={s.td}><button style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: 13 }} onClick={() => navigate('/invoices')}>{inv.invoice_no}</button></td>
                      <td style={{ ...s.td, fontSize: 12 }}>{inv.period_label}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{inv.student_count}</td>
                      <td style={{ ...s.td, fontWeight: 700 }}>₹{parseFloat(inv.total).toLocaleString('en-IN')}</td>
                      <td style={{ ...s.td, color: '#22c55e', fontWeight: 600 }}>₹{paid.toLocaleString('en-IN')}</td>
                      <td style={{ ...s.td, color: bal > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>₹{bal.toLocaleString('en-IN')}</td>
                      <td style={s.td}><span style={s.badge(INV_STATUS_COLOR[inv.status] || '#94a3b8')}>{INV_STATUS_LABEL[inv.status] || inv.status}</span></td>
                      <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={s.td}><button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/invoices')}>View</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}

        {/* Payment History */}
        {activeTab === 'payments' && (
          payments.length === 0 ? (
            <p style={s.emptyTxt}>No payments recorded yet</p>
          ) : (
            <table style={s.table}>
              <thead><tr>
                {['Date','Amount','Method','Period','Reference','Recorded By','Notes',''].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={s.td}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: '#22c55e' }}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                    <td style={s.td}><span style={s.badge(METHOD_COLOR[p.method] || '#94a3b8')}>{METHOD_LABEL[p.method] || p.method}</span></td>
                    <td style={s.td}>{p.period_label || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{p.reference_no || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{p.recorded_by || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
                    <td style={s.td}>
                      <button onClick={() => handleDeletePayment(p.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td style={{ ...s.td, fontWeight: 700 }}>Total</td>
                <td style={{ ...s.td, fontWeight: 800, color: '#22c55e', fontSize: 15 }}>₹{(total_paid || 0).toLocaleString('en-IN')}</td>
                <td colSpan={6} />
              </tr></tfoot>
            </table>
          )
        )}
      </div>

      {/* Edit Subscription Modal */}
      {editOpen && (
        <div style={s.overlay} onClick={() => setEditOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>Edit Subscription</h2>

            {/* Amount preview */}
            <div style={s.banner}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span>
                  {sub.student_count || 0} students × ₹{PLAN_RATES[editForm.plan] || 0}/student
                  {editForm.billing_cycle === 'annual' ? ' × 12 × 80%' : '/month'}
                  {' = '}
                  <strong>₹{amountCalc.toLocaleString('en-IN')}</strong>
                  {editForm.billing_cycle === 'annual' ? '/yr' : '/mo'}
                </span>
                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                  <input type="checkbox" checked={amountAuto} onChange={e => {
                    setAmountAuto(e.target.checked)
                    if (e.target.checked) setEditForm(f => ({ ...f, monthly_amount: amountCalc }))
                  }} />
                  Auto-calculate
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div>
                <label style={s.label}>Plan</label>
                <select style={s.select} value={editForm.plan || ''} onChange={e => handlePlanChange(e.target.value)}>
                  {['free','starter','pro','premium','enterprise'].map(o => <option key={o} value={o}>{PLAN_LABEL[o]}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Status</label>
                <select style={s.select} value={editForm.status || ''} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  {['trial','active','overdue','cancelled','expired'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Billing Cycle</label>
                <select style={s.select} value={editForm.billing_cycle || 'monthly'} onChange={e => handleCycleChange(e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual (20% off)</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Amount (₹) {amountAuto ? '— auto' : '— manual'}</label>
                <input style={{ ...s.input, background: amountAuto ? '#f8fafc' : '#fff' }}
                  type="number" readOnly={amountAuto}
                  value={editForm.monthly_amount || 0}
                  onChange={e => setEditForm(f => ({ ...f, monthly_amount: +e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Renewal Date</label>
                <input style={s.input} type="date" value={editForm.renewal_date || ''}
                  onChange={e => setEditForm(f => ({ ...f, renewal_date: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Mobile Access</label>
                <select style={s.select} value={editForm.mobile_enabled ? 'true' : 'false'}
                  onChange={e => setEditForm(f => ({ ...f, mobile_enabled: e.target.value === 'true' }))}>
                  <option value="true">Enabled ✅</option>
                  <option value="false">Disabled ❌</option>
                </select>
              </div>
            </div>
            <label style={s.label}>Notes</label>
            <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }}
              value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
            <div style={s.mRow}>
              <button style={s.cancelBtn} onClick={() => setEditOpen(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleEditSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payOpen && (
        <div style={s.overlay} onClick={() => setPayOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>Record Payment — {school.name}</h2>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', marginBottom: 4 }}>
              Expected monthly: ₹{(sub.monthly_amount || 0).toLocaleString('en-IN')}
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div>
                  <label style={s.label}>Amount (₹) *</label>
                  <input style={s.input} type="number" step="0.01" required
                    placeholder={sub.monthly_amount || ''}
                    value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Payment Date *</label>
                  <input style={s.input} type="date" required
                    value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Method *</label>
                  <select style={s.select} value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Period (e.g. "March 2025")</label>
                  <input style={s.input} type="text" placeholder="March 2025"
                    value={payForm.period_label} onChange={e => setPayForm(f => ({ ...f, period_label: e.target.value }))} />
                </div>
              </div>
              <label style={s.label}>Reference / Transaction ID</label>
              <input style={s.input} type="text" placeholder="UTR / Cheque no. / Transaction ID"
                value={payForm.reference_no} onChange={e => setPayForm(f => ({ ...f, reference_no: e.target.value }))} />
              <label style={s.label}>Notes</label>
              <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }}
                value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              <div style={s.mRow}>
                <button type="button" style={s.cancelBtn} onClick={() => setPayOpen(false)}>Cancel</button>
                <button type="submit" style={{ ...s.saveBtn, background: '#22c55e' }} disabled={paySaving}>
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

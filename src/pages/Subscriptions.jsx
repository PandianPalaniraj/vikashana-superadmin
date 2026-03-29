import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { fmtDate, fmtStatus } from '../utils/format'

const STATUS_COLOR = {
  active:    '#22c55e',
  trial:     '#f59e0b',
  overdue:   '#ef4444',
  cancelled: '#94a3b8',
  expired:   '#dc2626',
}
const PLAN_COLOR = {
  free:       '#94a3b8',
  starter:    '#3b82f6',
  pro:        '#8b5cf6',
  premium:    '#f59e0b',
  enterprise: '#ec4899',
}
const PLAN_LABEL = {
  free: 'Forever Free', starter: 'Starter', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise',
}

const PLAN_RATES = { free: 0, starter: 15, pro: 25, premium: 40, enterprise: 0 }

const calcAmount = (plan, students, cycle) => {
  const monthly = (PLAN_RATES[plan] || 0) * (students || 0)
  return cycle === 'annual' ? Math.round(monthly * 12 * 0.8) : monthly
}

const s = {
  h1:      { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 },
  mrrBox:  { display: 'flex', gap: 12, marginBottom: 20 },
  mrrCard: (c) => ({ flex: 1, background: `${c}11`, border: `1px solid ${c}33`, borderRadius: 10, padding: '14px 18px' }),
  mrrNum:  (c) => ({ fontSize: 22, fontWeight: 800, color: c, margin: '4px 0 0' }),
  mrrLbl:  { fontSize: 12, color: '#64748b', fontWeight: 500 },
  filters: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  select:  { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff' },
  table:   { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th:      { padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td:      { padding: '12px 16px', fontSize: 14, color: '#1e293b', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  badge:   (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: c + '22', color: c }),
  linkBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0 },
  actBtn:  { padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: '#fff', marginLeft: 4 },
  pager:   { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  pageBtn: (dis) => ({ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: dis ? 'not-allowed' : 'pointer', background: '#fff', opacity: dis ? 0.4 : 1, fontSize: 13 }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:   { background: '#fff', borderRadius: 16, padding: 32, width: 460, maxHeight: '90vh', overflowY: 'auto' },
  modalH:  { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20 },
  label:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 14 },
  input:   { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  mSelect: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  mRow:    { display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  saveBtn:  { padding: '9px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  infoBox: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#0369a1' },
}

export default function Subscriptions() {
  const [subs,    setSubs]    = useState([])
  const [meta,    setMeta]    = useState({})
  const [mrr,     setMrr]     = useState(0)
  const [page,    setPage]    = useState(1)
  const [status,  setStatus]  = useState('')
  const [plan,    setPlan]    = useState('')
  const [loading, setLoading] = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState({})
  const [amountAuto, setAmountAuto] = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [mrrStudents, setMrrStudents] = useState(100)

  // Delete with password
  const [delTarget, setDelTarget] = useState(null)
  const [delPwd,    setDelPwd]    = useState('')
  const [delErr,    setDelErr]    = useState('')
  const [deleting,  setDeleting]  = useState(false)
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    const params = { page }
    if (status) params.status = status
    if (plan)   params.plan   = plan
    api.get('subscriptions', { params })
      .then(r => {
        setSubs(r.data.data)
        setMeta(r.data.meta)
        // Compute MRR from monthly_amount
        const total = r.data.data.reduce((sum, s) => sum + (parseFloat(s.monthly_amount) || 0), 0)
        setMrr(total)
      })
      .finally(() => setLoading(false))
  }, [page, status, plan])

  useEffect(() => { load() }, [load])

  const autoRenewalDate = (cycle) => {
    const d = new Date()
    if (cycle === 'annual') d.setFullYear(d.getFullYear() + 1)
    else d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  }

  const openEdit = (sub) => {
    setEditing(sub)
    setAmountAuto(true)
    const cycle = sub.billing_cycle || 'monthly'
    setForm({
      plan:           sub.plan,
      status:         sub.status,
      billing_cycle:  cycle,
      renewal_date:   sub.renewal_date || autoRenewalDate(cycle),
      monthly_amount: sub.monthly_amount || calcAmount(sub.plan, sub.student_count, cycle),
      mobile_enabled: sub.mobile_enabled,
      notes:          sub.notes || '',
    })
  }

  const handlePlanChange = (plan) => {
    const updated = { ...form, plan }
    if (amountAuto) updated.monthly_amount = calcAmount(plan, editing?.student_count, form.billing_cycle)
    setForm(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`subscriptions/${editing.id}`, form)
      setEditing(null)
      load()
    } catch { alert('Failed to update') }
    finally { setSaving(false) }
  }

  const handleExtend = async (sub) => {
    const days = parseInt(prompt('Extend trial by how many days?', '14'), 10)
    if (!days) return
    await api.post(`subscriptions/${sub.id}/extend-trial`, { days })
    load()
  }

  const handleSync = async (sub) => {
    await api.post(`subscriptions/${sub.id}/sync-student-count`)
    load()
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    setDeleting(true); setDelErr('')
    try {
      await api.delete(`subscriptions/${delTarget.id}`, { data: { password: delPwd } })
      setDelTarget(null); setDelPwd('')
      load()
    } catch (err) {
      setDelErr(err.response?.data?.message || 'Failed to delete.')
    } finally { setDeleting(false) }
  }

  const handleMarkPaid = (sub) => {
    openEdit(sub)
    setForm(f => ({ ...f, status: 'active', paid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) }))
  }

  const trialBadge = (sub) => {
    if (sub.status !== 'trial' || !sub.trial_ends_at) return null
    const days = Math.max(0, Math.ceil((new Date(sub.trial_ends_at) - Date.now()) / 86400000))
    return <span style={{ fontSize: 11, color: days <= 3 ? '#ef4444' : '#f59e0b', marginLeft: 4 }}>({days}d left)</span>
  }

  // MRR calculator
  const calcMrr = (plan, students) => {
    const rates = { starter: 15, pro: 25, premium: 40, enterprise: 0 }
    return (rates[plan] || 0) * students
  }

  return (
    <div>
      <h1 style={s.h1}>Subscriptions</h1>

      {/* MRR Summary */}
      <div style={s.mrrBox}>
        <div style={s.mrrCard('#22c55e')}>
          <div style={s.mrrLbl}>Monthly Revenue (MRR)</div>
          <div style={s.mrrNum('#22c55e')}>₹{mrr.toLocaleString('en-IN')}</div>
        </div>
        <div style={s.mrrCard('#8b5cf6')}>
          <div style={s.mrrLbl}>Showing</div>
          <div style={s.mrrNum('#8b5cf6')}>{meta.total || 0} schools</div>
        </div>
        {/* MRR Calculator */}
        <div style={{ ...s.mrrCard('#3b82f6'), minWidth: 220 }}>
          <div style={s.mrrLbl}>MRR Calculator</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
            <select style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: 13 }}
              onChange={e => setMrrStudents(s => ({ ...s, plan: e.target.value }))} defaultValue="pro">
              <option value="starter">Starter ₹15</option>
              <option value="pro">Pro ₹25</option>
              <option value="premium">Premium ₹40</option>
            </select>
            <input type="number" style={{ width: 70, padding: '4px 6px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: 13 }}
              value={typeof mrrStudents === 'object' ? (mrrStudents.count || 100) : mrrStudents}
              onChange={e => setMrrStudents(s => typeof s === 'object' ? { ...s, count: +e.target.value } : { plan: 'pro', count: +e.target.value })} />
            <span style={s.mrrLbl}>students</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
            = ₹{calcMrr(
              typeof mrrStudents === 'object' ? (mrrStudents.plan || 'pro') : 'pro',
              typeof mrrStudents === 'object' ? (mrrStudents.count || 100) : mrrStudents
            ).toLocaleString('en-IN')}/mo
          </div>
        </div>
      </div>

      <div style={s.filters}>
        <select style={s.select} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <select style={s.select} value={plan} onChange={e => { setPlan(e.target.value); setPage(1) }}>
          <option value="">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {['School', 'Plan', 'Status', 'Students', 'Monthly', 'Mobile', 'Renewal / Trial Ends', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>
          ) : subs.map(sub => (
            <tr key={sub.id}>
              <td style={s.td}>
                <button style={s.linkBtn} onClick={() => navigate(`/schools/${sub.school_id}`)}>
                  {sub.school?.name || '—'}
                </button>
              </td>
              <td style={s.td}>
                <span style={s.badge(PLAN_COLOR[sub.plan] || '#64748b')}>{PLAN_LABEL[sub.plan] || sub.plan}</span>
              </td>
              <td style={s.td}>
                <span style={s.badge(STATUS_COLOR[sub.status] || '#64748b')}>{sub.status}</span>
                {trialBadge(sub)}
                {sub.status === 'overdue' && (
                  <div><span style={{fontSize:10,color:'#EF4444',fontWeight:700}}>Grace: {sub.grace_days_left ?? 15}d left</span></div>
                )}
              </td>
              <td style={s.td}>{sub.student_count || 0}</td>
              <td style={s.td}>{sub.monthly_amount > 0 ? `₹${parseFloat(sub.monthly_amount).toLocaleString('en-IN')}` : '—'}</td>
              <td style={s.td}>{sub.mobile_enabled ? '✅' : '—'}</td>
              <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>
                {sub.status === 'trial' ? fmtDate(sub.trial_ends_at) : fmtDate(sub.renewal_date)}
              </td>
              <td style={s.td}>
                <button style={s.actBtn} onClick={() => navigate(`/subscriptions/${sub.id}`)}>View</button>
                <button style={s.actBtn} onClick={() => openEdit(sub)}>Edit</button>
                {sub.status === 'trial' && (
                  <button style={s.actBtn} onClick={() => handleExtend(sub)}>+Trial</button>
                )}
                {sub.status !== 'active' && (
                  <button style={{ ...s.actBtn, color: '#22c55e', borderColor: '#22c55e' }} onClick={() => handleMarkPaid(sub)}>Mark Paid</button>
                )}
                <button style={{ ...s.actBtn, color: '#8b5cf6', borderColor: '#c4b5fd' }} onClick={() => handleSync(sub)}>Sync</button>
                <button style={{ ...s.actBtn, color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => { setDelTarget(sub); setDelPwd(''); setDelErr('') }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {meta.last_page > 1 && (
        <div style={s.pager}>
          <button style={s.pageBtn(page <= 1)} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: '#64748b' }}>Page {meta.page} of {meta.last_page}</span>
          <button style={s.pageBtn(page >= meta.last_page)} disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {editing && (() => {
        const amountCalc = calcAmount(form.plan, editing.student_count, form.billing_cycle)
        return (
          <div style={s.overlay} onClick={() => setEditing(null)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h2 style={s.modalH}>Edit Subscription — {editing.school?.name}</h2>

              {/* Amount preview banner */}
              <div style={s.infoBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span>
                    {editing.student_count || 0} students × ₹{PLAN_RATES[form.plan] || 0}
                    {form.billing_cycle === 'annual' ? ' × 12 × 80%' : '/mo'}
                    {' = '}
                    <strong>₹{amountCalc.toLocaleString('en-IN')}</strong>
                    {form.billing_cycle === 'annual' ? '/yr' : '/mo'}
                  </span>
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#0369a1' }}>
                    <input type="checkbox" checked={amountAuto} onChange={e => {
                      setAmountAuto(e.target.checked)
                      if (e.target.checked) setForm(f => ({ ...f, monthly_amount: amountCalc }))
                    }} />
                    Auto-calculate
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div>
                  <label style={s.label}>Plan</label>
                  <select style={s.mSelect} value={form.plan || ''} onChange={e => handlePlanChange(e.target.value)}>
                    {['starter','pro','premium','enterprise'].map(o => <option key={o} value={o}>{PLAN_LABEL[o]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Status</label>
                  <div style={{ marginTop: 4 }}>
                    <span style={s.badge(STATUS_COLOR[form.status] || '#94a3b8')}>{form.status}</span>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Auto-managed via invoice payments</p>
                  </div>
                </div>
                <div>
                  <label style={s.label}>Billing Cycle</label>
                  <select style={s.mSelect} value={form.billing_cycle || 'monthly'}
                    onChange={e => {
                      const cycle = e.target.value
                      const updated = { ...form, billing_cycle: cycle, renewal_date: autoRenewalDate(cycle) }
                      if (amountAuto) updated.monthly_amount = calcAmount(form.plan, editing.student_count, cycle)
                      setForm(updated)
                    }}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (20% off)</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Amount (₹) {amountAuto ? '— auto' : '— manual'}</label>
                  <input style={{ ...s.input, background: amountAuto ? '#f8fafc' : '#fff' }}
                    type="number" readOnly={amountAuto}
                    value={form.monthly_amount || 0}
                    onChange={e => setForm(f => ({ ...f, monthly_amount: +e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Renewal Date</label>
                  <input style={s.input} type="date" value={form.renewal_date || ''}
                    onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Mobile Access</label>
                  <select style={s.mSelect} value={form.mobile_enabled ? 'true' : 'false'}
                    onChange={e => setForm(f => ({ ...f, mobile_enabled: e.target.value === 'true' }))}>
                    <option value="true">Enabled ✅</option>
                    <option value="false">Disabled ❌</option>
                  </select>
                </div>
              </div>

              <label style={s.label}>Notes</label>
              <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} value={form.notes || ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <div style={s.mRow}>
                <button style={s.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Delete Subscription Modal ── */}
      {delTarget && (
        <div style={s.overlay} onClick={() => setDelTarget(null)}>
          <div style={{ ...s.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 36 }}>🗑️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '8px 0 4px' }}>Delete Subscription</h2>
              <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 700, margin: '4px 0' }}>{delTarget.school?.name}</p>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>
              ⚠️ This will permanently delete the subscription, all its invoices, and all payment records. This cannot be undone.
            </div>
            <form onSubmit={handleDelete}>
              <label style={s.label}>Enter your superadmin password to confirm</label>
              <input
                type="password" autoFocus required
                placeholder="Your password"
                value={delPwd}
                onChange={e => { setDelPwd(e.target.value); setDelErr('') }}
                style={{ ...s.input, borderColor: delErr ? '#fca5a5' : '#d1d5db' }}
              />
              {delErr && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>{delErr}</p>}
              <div style={s.mRow}>
                <button type="button" style={s.cancelBtn} onClick={() => setDelTarget(null)}>Cancel</button>
                <button type="submit" disabled={deleting || !delPwd}
                  style={{ ...s.saveBtn, background: deleting || !delPwd ? '#fca5a5' : '#dc2626', cursor: deleting || !delPwd ? 'not-allowed' : 'pointer' }}>
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const METHOD_COLOR = { cash: '#22c55e', upi: '#8b5cf6', bank_transfer: '#3b82f6', cheque: '#f59e0b', online: '#06b6d4', other: '#94a3b8' }
const METHOD_LABEL = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', online: 'Online', other: 'Other' }

const s = {
  h1:      { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 },
  topRow:  { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  kpiCard: (c) => ({ flex: 1, minWidth: 150, background: `${c}0d`, border: `1px solid ${c}33`, borderRadius: 10, padding: '14px 18px' }),
  kpiNum:  (c) => ({ fontSize: 22, fontWeight: 800, color: c, margin: '4px 0 0' }),
  kpiLbl:  { fontSize: 12, color: '#64748b', fontWeight: 500 },
  filters: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  select:  { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#fff' },
  input:   { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 },
  table:   { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th:      { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td:      { padding: '11px 14px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  badge:   (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c + '22', color: c }),
  linkBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 },
  pager:   { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  pageBtn: (dis) => ({ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: dis ? 'not-allowed' : 'pointer', background: '#fff', opacity: dis ? 0.4 : 1, fontSize: 13 }),
  emptyRow:{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' },
}

// First day of current month
const firstOfMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
const todayStr = () => new Date().toISOString().slice(0, 10)

export default function Payments() {
  const [payments,  setPayments]  = useState([])
  const [meta,      setMeta]      = useState({})
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [method,    setMethod]    = useState('')
  const [from,      setFrom]      = useState(firstOfMonth())
  const [to,        setTo]        = useState(todayStr())
  const [page,      setPage]      = useState(1)
  const navigate = useNavigate()

  // Delete with password
  const [delTarget, setDelTarget] = useState(null)
  const [delPwd,    setDelPwd]    = useState('')
  const [delErr,    setDelErr]    = useState('')
  const [deleting,  setDeleting]  = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page }
    if (method) params.method = method
    if (from)   params.from   = from
    if (to)     params.to     = to
    api.get('payments', { params })
      .then(r => {
        setPayments(r.data.data)
        setMeta(r.data.meta)
        setTotal(r.data.total_amount || 0)
      })
      .finally(() => setLoading(false))
  }, [page, method, from, to])

  useEffect(() => { load() }, [load])

  const handleDelete = async (e) => {
    e.preventDefault()
    setDeleting(true); setDelErr('')
    try {
      await api.delete(`payments/${delTarget.id}`, { data: { password: delPwd } })
      setDelTarget(null); setDelPwd('')
      load()
    } catch (err) {
      setDelErr(err.response?.data?.message || 'Failed to delete.')
    } finally { setDeleting(false) }
  }

  // Summary by method
  const byMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + parseFloat(p.amount || 0)
    return acc
  }, {})

  return (
    <div>
      <h1 style={s.h1}>Payments</h1>

      {/* KPI row */}
      <div style={s.topRow}>
        <div style={s.kpiCard('#22c55e')}>
          <div style={s.kpiLbl}>Total Collected (filtered)</div>
          <div style={s.kpiNum('#22c55e')}>₹{parseFloat(total).toLocaleString('en-IN')}</div>
        </div>
        <div style={s.kpiCard('#3b82f6')}>
          <div style={s.kpiLbl}>Transactions</div>
          <div style={s.kpiNum('#3b82f6')}>{meta.total || 0}</div>
        </div>
        {Object.entries(byMethod).slice(0, 3).map(([m, amt]) => (
          <div key={m} style={s.kpiCard(METHOD_COLOR[m] || '#94a3b8')}>
            <div style={s.kpiLbl}>{METHOD_LABEL[m] || m}</div>
            <div style={s.kpiNum(METHOD_COLOR[m] || '#94a3b8')}>₹{parseFloat(amt).toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input style={s.input} type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} title="From date" />
        <span style={{ fontSize: 13, color: '#64748b' }}>to</span>
        <input style={s.input} type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} title="To date" />
        <select style={s.select} value={method} onChange={e => { setMethod(e.target.value); setPage(1) }}>
          <option value="">All Methods</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="online">Online</option>
          <option value="other">Other</option>
        </select>
        <button style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
          onClick={() => { setFrom(firstOfMonth()); setTo(todayStr()); setMethod(''); setPage(1) }}>
          Reset
        </button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {['Date', 'School', 'Amount', 'Method', 'Period', 'Reference', 'Recorded By', 'Notes', ''].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} style={{ ...s.td, ...s.emptyRow }}>Loading…</td></tr>
          ) : payments.length === 0 ? (
            <tr><td colSpan={9} style={{ ...s.td, ...s.emptyRow }}>No payments found for this period</td></tr>
          ) : payments.map(p => (
            <tr key={p.id}>
              <td style={s.td}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}</td>
              <td style={s.td}>
                <button style={s.linkBtn} onClick={() => navigate(`/subscriptions/${p.subscription_id}`)}>
                  {p.school?.name || '—'}
                </button>
              </td>
              <td style={{ ...s.td, fontWeight: 700, color: '#22c55e' }}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
              <td style={s.td}><span style={s.badge(METHOD_COLOR[p.method] || '#94a3b8')}>{METHOD_LABEL[p.method] || p.method}</span></td>
              <td style={{ ...s.td, color: '#64748b' }}>{p.period_label || '—'}</td>
              <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{p.reference_no || '—'}</td>
              <td style={{ ...s.td, fontSize: 12, color: '#64748b' }}>{p.recorder?.name || '—'}</td>
              <td style={{ ...s.td, fontSize: 12, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
              <td style={s.td}>
                <button onClick={() => { setDelTarget(p); setDelPwd(''); setDelErr('') }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {payments.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f8fafc' }}>
              <td style={{ ...s.td, fontWeight: 700 }}>Page Total</td>
              <td style={s.td}></td>
              <td style={{ ...s.td, fontWeight: 800, color: '#22c55e' }}>
                ₹{payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toLocaleString('en-IN')}
              </td>
              <td colSpan={6}></td>
            </tr>
          </tfoot>
        )}
      </table>

      {meta.last_page > 1 && (
        <div style={s.pager}>
          <button style={s.pageBtn(page <= 1)} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {meta.last_page}</span>
          <button style={s.pageBtn(page >= meta.last_page)} disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── Delete Payment Modal ── */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={() => setDelTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 36 }}>🗑️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '8px 0 4px' }}>Delete Payment</h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                {delTarget.school?.name} · ₹{parseFloat(delTarget.amount).toLocaleString('en-IN')} · {delTarget.period_label || '—'}
              </p>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>
              ⚠️ This payment record will be permanently deleted and the invoice balance will be updated.
            </div>
            <form onSubmit={handleDelete}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Enter your superadmin password to confirm
              </label>
              <input
                type="password" autoFocus required
                placeholder="Your password"
                value={delPwd}
                onChange={e => { setDelPwd(e.target.value); setDelErr('') }}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${delErr ? '#fca5a5' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
              {delErr && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>{delErr}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setDelTarget(null)}
                  style={{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={deleting || !delPwd}
                  style={{ padding: '9px 20px', background: deleting || !delPwd ? '#fca5a5' : '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: deleting || !delPwd ? 'not-allowed' : 'pointer' }}>
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

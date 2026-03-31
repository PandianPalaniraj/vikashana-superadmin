import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { fmtDate, fmtPlan, fmtStatus } from '../utils/format'

const STATUS_COLOR = { active: '#22c55e', trial: '#f59e0b', overdue: '#ef4444', cancelled: '#94a3b8' }
const PLAN_COLOR   = { free: '#94a3b8', basic: '#3b82f6', starter: '#3b82f6', pro: '#8b5cf6', premium: '#f59e0b', enterprise: '#f59e0b' }

const s = {
  row:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  h1:         { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  regBtn:     { padding: '9px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  filters:    { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  input:      { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  select:     { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  table:      { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th:         { padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td:         { padding: '12px 16px', fontSize: 14, color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  badge:      (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: c + '22', color: c }),
  linkBtn:    { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0 },
  actBtn:     { padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 6, background: '#fff' },
  delBtn:     { padding: '5px 10px', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 6, background: '#fff', color: '#dc2626' },
  pager:      { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  pageBtn:    (dis) => ({ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: dis ? 'not-allowed' : 'pointer', background: '#fff', opacity: dis ? 0.4 : 1, fontSize: 13 }),
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:      { background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalH:     { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  modalSub:   { fontSize: 13, color: '#64748b', marginBottom: 20 },
  section:    { fontSize: 13, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 },
  label:      { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 14 },
  mInput:     { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  mSelect:    { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  hint:       { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  planRow:    { display: 'flex', gap: 8, marginTop: 6 },
  planBtn:    (active) => ({ flex: 1, padding: '8px 0', border: `2px solid ${active ? '#7c3aed' : '#d1d5db'}`, borderRadius: 8, background: active ? '#f5f3ff' : '#fff', color: active ? '#7c3aed' : '#374151', fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: 13 }),
  mRow:       { display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' },
  saveBtn:    { padding: '10px 22px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:  { padding: '10px 22px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  // credentials modal
  credModal:  { background: '#fff', borderRadius: 16, padding: 32, width: 440 },
  credTitle:  { fontSize: 18, fontWeight: 700, color: '#15803d', marginBottom: 4 },
  credSub:    { fontSize: 13, color: '#64748b', marginBottom: 20 },
  credBox:    { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 18px', marginBottom: 16 },
  credLabel:  { fontSize: 12, color: '#64748b', fontWeight: 600 },
  credVal:    { fontSize: 15, color: '#1e293b', fontWeight: 700, marginTop: 2 },
  credNote:   { fontSize: 12, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 16 },
  credBtns:   { display: 'flex', gap: 10, flexWrap: 'wrap' },
  copyBtn:    { padding: '9px 16px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  waBtn:      { padding: '9px 16px', background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  doneBtn:    { padding: '9px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, marginLeft: 'auto' },
  toast:      { position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 14, zIndex: 200, maxWidth: 380, textAlign: 'center' },
}

export default function Schools() {
  const [schools, setSchools] = useState([])
  const [meta,    setMeta]    = useState({})
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const [plan,    setPlan]    = useState('')
  const [loading, setLoading] = useState(false)

  // Delete confirmation modal
  const [delTarget,  setDelTarget]  = useState(null)   // school object to delete
  const [delPwd,     setDelPwd]     = useState('')
  const [delError,   setDelError]   = useState('')
  const [deleting,   setDeleting]   = useState(false)

  // Toast
  const [toast, setToast] = useState('')

  const navigate = useNavigate()

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const fetchSchools = useCallback(() => {
    setLoading(true)
    const params = { page }
    if (search) params.search = search
    if (status) params.status = status
    if (plan)   params.plan   = plan
    api.get('schools', { params })
      .then(r => { setSchools(r.data.data); setMeta(r.data.meta) })
      .finally(() => setLoading(false))
  }, [page, search, status, plan])

  useEffect(() => { fetchSchools() }, [fetchSchools])

  const handleToggle = async (school) => {
    await api.post(`schools/${school.id}/toggle-status`)
    fetchSchools()
  }

  const openDeleteModal = (school) => {
    setDelTarget(school)
    setDelPwd('')
    setDelError('')
  }

  const closeDeleteModal = () => {
    setDelTarget(null)
    setDelPwd('')
    setDelError('')
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    setDeleting(true)
    setDelError('')
    try {
      await api.delete(`schools/${delTarget.id}`, { data: { password: delPwd } })
      closeDeleteModal()
      fetchSchools()
      showToast(`"${delTarget.name}" has been permanently deleted.`)
    } catch (err) {
      setDelError(err.response?.data?.message || 'Failed to delete school.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div style={s.row}>
        <h1 style={s.h1}>Schools</h1>
        <button style={s.regBtn} onClick={() => navigate('/schools/register')}>🏫 Register New School</button>
      </div>

      <div style={s.filters}>
        <input style={s.input} placeholder="Search name or email…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select style={s.select} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
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
            {['School', 'Code', 'Email/Phone', 'Plan', 'Status', 'Students', 'Teachers', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>
          ) : schools.length === 0 ? (
            <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>No schools found</td></tr>
          ) : schools.map(sch => (
            <tr key={sch.id}>
              <td style={s.td}>
                <button style={s.linkBtn} onClick={() => navigate(`/schools/${sch.id}`)}>{sch.name}</button>
              </td>
              <td style={s.td}>
                {sch.school_code
                  ? <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 6 }}>{sch.school_code}</span>
                  : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
              </td>
              <td style={s.td}>
                <div style={{ fontSize: 13 }}>{sch.email}</div>
                {sch.phone && <div style={{ fontSize: 12, color: '#64748b' }}>{sch.phone}</div>}
              </td>
              <td style={s.td}>
                <span style={s.badge(PLAN_COLOR[sch.subscription?.plan] || '#94a3b8')}>
                  {sch.subscription?.plan || '—'}
                </span>
              </td>
              <td style={s.td}>
                <span style={s.badge(STATUS_COLOR[sch.subscription?.status] || '#94a3b8')}>
                  {sch.subscription?.status || '—'}
                </span>
                {sch.subscription?.status === 'overdue' && sch.subscription?.grace_days_left != null && (
                  <div style={{fontSize:10,color:'#EF4444'}}>Grace period: {sch.subscription.grace_days_left}d left</div>
                )}
              </td>
              <td style={s.td}>{sch.students_count ?? 0}</td>
              <td style={s.td}>{sch.teachers_count ?? 0}</td>
              <td style={s.td}>
                <button style={{ ...s.actBtn, color: '#7c3aed', borderColor: '#c4b5fd' }} onClick={() => navigate(`/invoices?generate=${sch.id}`)}>Invoice</button>
                {sch.phone && (
                  <button style={{ ...s.actBtn, color: '#25d366', borderColor: '#86efac' }} onClick={() => window.open('https://wa.me/91' + sch.phone, '_blank')}>WhatsApp</button>
                )}
                <button style={s.actBtn} onClick={() => navigate('/schools/' + sch.id)}>View</button>
                <button style={s.actBtn} onClick={() => navigate(`/schools/${sch.id}/edit`)}>Edit</button>
                <button style={s.actBtn} onClick={() => handleToggle(sch)}>
                  {sch.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button style={s.delBtn} onClick={() => openDeleteModal(sch)}>Delete</button>
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

      {/* ── Delete Confirmation Modal ── */}
      {delTarget && (
        <div style={s.overlay} onClick={closeDeleteModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>🗑️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Delete School</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
              You are about to permanently delete:
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{delTarget.name}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              This will remove all students, teachers, fees, attendance records, and data associated with this school. <strong>This cannot be undone.</strong>
            </p>

            <form onSubmit={handleDelete}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Enter your superadmin password to confirm
              </label>
              <input
                type="password"
                autoFocus
                required
                placeholder="Your password"
                value={delPwd}
                onChange={e => { setDelPwd(e.target.value); setDelError('') }}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${delError ? '#fca5a5' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              />
              {delError && (
                <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>{delError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeDeleteModal}
                  style={{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={deleting || !delPwd}
                  style={{ padding: '9px 20px', background: deleting || !delPwd ? '#fca5a5' : '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: deleting || !delPwd ? 'not-allowed' : 'pointer' }}>
                  {deleting ? 'Deleting…' : 'Yes, Delete School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

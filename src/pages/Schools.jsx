import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { fmtDate } from '../utils/format'

const STATUS_COLOR = { active: '#22c55e', trial: '#f59e0b', overdue: '#ef4444', cancelled: '#94a3b8' }
const PLAN_COLOR   = { free: '#94a3b8', basic: '#3b82f6', starter: '#3b82f6', pro: '#8b5cf6', premium: '#f59e0b', enterprise: '#f59e0b' }

const s = {
  row:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  h1:         { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  regBtn:     { padding: '9px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  filters:    { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  input:      { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  select:     { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  table:      { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th:         { padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td:         { padding: '12px 16px', fontSize: 14, color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  badge:      (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: c + '22', color: c }),
  linkBtn:    { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: 0 },
  actBtn:     { padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 6, background: '#fff' },
  delBtn:     { padding: '5px 10px', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 6, background: '#fff', color: '#dc2626' },
  restoreBtn: { padding: '5px 10px', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 6, background: '#fff', color: '#16a34a' },
  purgeBtn:   { padding: '5px 10px', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 6, background: '#fef2f2', color: '#dc2626', fontWeight: 700 },
  pager:      { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  pageBtn:    (dis) => ({ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: dis ? 'not-allowed' : 'pointer', background: '#fff', opacity: dis ? 0.4 : 1, fontSize: 13 }),
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:      { background: '#fff', borderRadius: 16, padding: 32, width: 420 },
  toggleRow:  { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13, background: '#fff', fontWeight: 600 },
  deletedBanner: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 600 },
  toast:      { position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 14, zIndex: 200, maxWidth: 380, textAlign: 'center' },
}

export default function Schools() {
  const [schools,      setSchools]      = useState([])
  const [meta,         setMeta]         = useState({})
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [status,       setStatus]       = useState('')
  const [plan,         setPlan]         = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showDeleted,  setShowDeleted]  = useState(false)

  // Delete (soft) confirmation
  const [delTarget,  setDelTarget]  = useState(null)
  const [delPwd,     setDelPwd]     = useState('')
  const [delError,   setDelError]   = useState('')
  const [deleting,   setDeleting]   = useState(false)

  // Purge (hard-delete) confirmation
  const [purgeTarget, setPurgeTarget] = useState(null)
  const [purgePwd,    setPurgePwd]    = useState('')
  const [purgeError,  setPurgeError]  = useState('')
  const [purging,     setPurging]     = useState(false)

  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const fetchSchools = useCallback(() => {
    setLoading(true)
    const params = { page }
    if (showDeleted) {
      params.deleted = 1
    } else {
      if (search) params.search = search
      if (status) params.status = status
      if (plan)   params.plan   = plan
    }
    api.get('schools', { params })
      .then(r => { setSchools(r.data.data); setMeta(r.data.meta) })
      .finally(() => setLoading(false))
  }, [page, search, status, plan, showDeleted])

  useEffect(() => { fetchSchools() }, [fetchSchools])

  const handleToggle = async (school) => {
    await api.post(`schools/${school.id}/toggle-status`)
    fetchSchools()
  }

  // ── Soft Delete ───────────────────────────────────────────────
  const openDeleteModal = (school) => { setDelTarget(school); setDelPwd(''); setDelError('') }
  const closeDeleteModal = () => { setDelTarget(null); setDelPwd(''); setDelError('') }

  const handleDelete = async (e) => {
    e.preventDefault()
    setDeleting(true); setDelError('')
    try {
      await api.delete(`schools/${delTarget.id}`, { data: { password: delPwd } })
      closeDeleteModal()
      fetchSchools()
      showToast(`"${delTarget.name}" deleted. It can be restored within 30 days.`)
    } catch (err) {
      setDelError(err.response?.data?.message || 'Failed to delete school.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Restore ───────────────────────────────────────────────────
  const handleRestore = async (school) => {
    if (!window.confirm(`Restore "${school.name}" and all its data?`)) return
    try {
      await api.post(`schools/${school.id}/restore`)
      fetchSchools()
      showToast(`"${school.name}" has been restored successfully.`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore school.')
    }
  }

  // ── Purge (permanent) ─────────────────────────────────────────
  const openPurgeModal = (school) => { setPurgeTarget(school); setPurgePwd(''); setPurgeError('') }
  const closePurgeModal = () => { setPurgeTarget(null); setPurgePwd(''); setPurgeError('') }

  const handlePurge = async (e) => {
    e.preventDefault()
    setPurging(true); setPurgeError('')
    try {
      await api.delete(`schools/${purgeTarget.id}/purge`, { data: { password: purgePwd } })
      closePurgeModal()
      fetchSchools()
      showToast(`"${purgeTarget.name}" permanently deleted.`)
    } catch (err) {
      setPurgeError(err.response?.data?.message || 'Failed to purge school.')
    } finally {
      setPurging(false)
    }
  }

  return (
    <div>
      <div style={s.row}>
        <h1 style={s.h1}>Schools</h1>
        <button style={s.regBtn} onClick={() => navigate('/schools/register')}>🏫 Register New School</button>
      </div>

      <div style={s.filters}>
        {!showDeleted && (
          <>
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
          </>
        )}
        <button style={{ ...s.toggleRow, borderColor: showDeleted ? '#fca5a5' : '#d1d5db', color: showDeleted ? '#dc2626' : '#374151' }}
          onClick={() => { setShowDeleted(v => !v); setPage(1) }}>
          {showDeleted ? '🗑️ Deleted Schools' : '🗑️ Show Deleted'}
        </button>
      </div>

      {showDeleted && (
        <div style={s.deletedBanner}>
          Showing soft-deleted schools — these can be restored or permanently purged.
        </div>
      )}

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
            <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>
              {showDeleted ? 'No deleted schools' : 'No schools found'}
            </td></tr>
          ) : schools.map(sch => (
            <tr key={sch.id} style={showDeleted ? { opacity: 0.85, background: '#fef2f2' } : {}}>
              <td style={s.td}>
                {showDeleted
                  ? <span style={{ fontWeight: 600, color: '#64748b' }}>{sch.name}</span>
                  : <button style={s.linkBtn} onClick={() => navigate(`/schools/${sch.id}`)}>{sch.name}</button>}
                {showDeleted && sch.deleted_at && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Deleted {fmtDate(sch.deleted_at)}</div>
                )}
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
                {showDeleted
                  ? <span style={s.badge('#dc2626')}>Deleted</span>
                  : <>
                      <span style={s.badge(STATUS_COLOR[sch.subscription?.status] || '#94a3b8')}>
                        {sch.subscription?.status || '—'}
                      </span>
                      {sch.subscription?.status === 'overdue' && sch.subscription?.grace_days_left != null && (
                        <div style={{ fontSize: 10, color: '#EF4444' }}>Grace period: {sch.subscription.grace_days_left}d left</div>
                      )}
                    </>}
              </td>
              <td style={s.td}>{sch.students_count ?? 0}</td>
              <td style={s.td}>{sch.teachers_count ?? 0}</td>
              <td style={s.td}>
                {showDeleted ? (
                  <>
                    <button style={s.restoreBtn} onClick={() => handleRestore(sch)}>Restore</button>
                    <button style={s.purgeBtn} onClick={() => openPurgeModal(sch)}>Purge</button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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

      {/* ── Delete (Soft) Modal ── */}
      {delTarget && (
        <div style={s.overlay} onClick={closeDeleteModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>🗑️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Delete School</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>You are about to delete:</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{delTarget.name}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
              All students, teachers, fees, and school data will be <strong>soft-deleted</strong>.
            </p>
            <p style={{ fontSize: 13, background: '#f0fdf4', color: '#16a34a', padding: '8px 12px', borderRadius: 8, marginBottom: 20 }}>
              ♻️ This can be restored within 30 days from the "Deleted Schools" view.
            </p>

            <form onSubmit={handleDelete}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Enter your superadmin password to confirm
              </label>
              <input
                type="password" autoFocus required placeholder="Your password"
                value={delPwd}
                onChange={e => { setDelPwd(e.target.value); setDelError('') }}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${delError ? '#fca5a5' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              />
              {delError && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>{delError}</p>}
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

      {/* ── Purge (Hard Delete) Modal ── */}
      {purgeTarget && (
        <div style={s.overlay} onClick={closePurgeModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>💀</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Permanently Purge School</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>You are about to permanently destroy:</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{purgeTarget.name}</p>
            <p style={{ fontSize: 13, background: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, border: '1px solid #fca5a5', marginBottom: 20 }}>
              ⚠️ ALL data will be permanently erased from the database. <strong>This CANNOT be undone.</strong>
            </p>

            <form onSubmit={handlePurge}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Enter your superadmin password to confirm
              </label>
              <input
                type="password" autoFocus required placeholder="Your password"
                value={purgePwd}
                onChange={e => { setPurgePwd(e.target.value); setPurgeError('') }}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${purgeError ? '#fca5a5' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              />
              {purgeError && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>{purgeError}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closePurgeModal}
                  style={{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={purging || !purgePwd}
                  style={{ padding: '9px 20px', background: purging || !purgePwd ? '#fca5a5' : '#7f1d1d', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: purging || !purgePwd ? 'not-allowed' : 'pointer' }}>
                  {purging ? 'Purging…' : 'Permanently Purge'}
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

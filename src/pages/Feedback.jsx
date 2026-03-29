import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'

const STATUS_COLOR   = { new: '#3b82f6', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#94a3b8' }
const PRIORITY_COLOR = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444', critical: '#7f1d1d' }

const s = {
  h1:      { fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  filters: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  select:  { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff' },
  table:   { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th:      { padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td:      { padding: '12px 16px', fontSize: 14, color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  badge:   (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: c + '22', color: c }),
  actBtn:  { padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: '#fff' },
  pager:   { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  pageBtn: (dis) => ({ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: dis ? 'not-allowed' : 'pointer', background: '#fff', opacity: dis ? 0.4 : 1, fontSize: 13 }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:   { background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto' },
  modalH:  { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  label:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 14 },
  input:   { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  mSelect: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  mRow:    { display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  saveBtn: { padding: '9px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  bodyBox: { background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 14, color: '#374151', lineHeight: 1.6, marginTop: 8, whiteSpace: 'pre-wrap' },
  replyBox:{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12, fontSize: 14, color: '#166534', marginTop: 8 },
}

export default function Feedback() {
  const [items,   setItems]   = useState([])
  const [meta,    setMeta]    = useState({})
  const [page,    setPage]    = useState(1)
  const [status,  setStatus]  = useState('')
  const [category,setCategory]= useState('')
  const [priority,setPriority]= useState('')
  const [loading, setLoading] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [reply,   setReply]   = useState('')
  const [saving,  setSaving]  = useState(false)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = { page }
    if (status)   params.status   = status
    if (category) params.category = category
    if (priority) params.priority = priority
    api.get('feedback', { params })
      .then(r => { setItems(r.data.data); setMeta(r.data.meta) })
      .finally(() => setLoading(false))
  }, [page, status, category, priority])

  useEffect(() => { fetch() }, [fetch])

  const openView = (item) => {
    setViewing(item)
    setReply(item.reply || '')
  }

  const handleReply = async () => {
    setSaving(true)
    try {
      await api.post(`feedback/${viewing.id}/reply`, { reply })
      setViewing(null)
      fetch()
    } catch { alert('Failed to send reply') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (item, newStatus) => {
    await api.put(`feedback/${item.id}`, { status: newStatus })
    fetch()
  }

  return (
    <div>
      <h1 style={s.h1}>Feedback</h1>
      <div style={s.filters}>
        <select style={s.select} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select style={s.select} value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature Request</option>
          <option value="complaint">Complaint</option>
          <option value="query">Query</option>
        </select>
        <select style={s.select} value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {['School', 'Category', 'Title', 'Priority', 'Status', 'Date', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>
          ) : items.map(item => (
            <tr key={item.id}>
              <td style={s.td}>{item.school?.name || '—'}</td>
              <td style={s.td}><span style={s.badge('#64748b')}>{item.category}</span></td>
              <td style={s.td}>{item.title}</td>
              <td style={s.td}><span style={s.badge(PRIORITY_COLOR[item.priority])}>{item.priority}</span></td>
              <td style={s.td}><span style={s.badge(STATUS_COLOR[item.status])}>{item.status}</span></td>
              <td style={s.td}>{new Date(item.created_at).toLocaleDateString()}</td>
              <td style={s.td}>
                <button style={s.actBtn} onClick={() => openView(item)}>View / Reply</button>
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

      {viewing && (
        <div style={s.overlay} onClick={() => setViewing(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>{viewing.title}</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
              {viewing.school?.name} · {viewing.category} · <span style={s.badge(PRIORITY_COLOR[viewing.priority])}>{viewing.priority}</span>
            </p>
            <div style={s.bodyBox}>{viewing.body}</div>

            {viewing.reply && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Previous Reply:</p>
                <div style={s.replyBox}>{viewing.reply}</div>
              </div>
            )}

            <label style={s.label}>Reply / Update</label>
            <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={reply}
              onChange={e => setReply(e.target.value)} placeholder="Type your reply…" />

            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['in_progress', 'resolved', 'closed'].map(st => (
                <button key={st} style={{ ...s.actBtn, borderColor: STATUS_COLOR[st], color: STATUS_COLOR[st] }}
                  onClick={() => handleStatusChange(viewing, st)}>
                  Mark {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div style={s.mRow}>
              <button style={s.cancelBtn} onClick={() => setViewing(null)}>Close</button>
              <button style={s.saveBtn} onClick={handleReply} disabled={saving || !reply}>{saving ? 'Sending…' : 'Send Reply'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

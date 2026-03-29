import { useEffect, useState } from 'react'
import api from '../api/client'

const s = {
  row:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  h1:      { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  addBtn:  { padding: '9px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  list:    { display: 'flex', flexDirection: 'column', gap: 12 },
  card:    { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:   { fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' },
  meta:    { fontSize: 12, color: '#64748b', margin: '4px 0' },
  body:    { fontSize: 14, color: '#374151', marginTop: 8, lineHeight: 1.6 },
  badge:   (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: c + '22', color: c }),
  delBtn:  { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:   { background: '#fff', borderRadius: 16, padding: 32, width: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalH:  { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20 },
  label:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 14 },
  input:   { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  mSelect: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  mRow:    { display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  saveBtn: { padding: '9px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
}

const TARGET_COLOR = { all: '#3b82f6', plan: '#8b5cf6', school: '#22c55e' }
const BLANK = { title: '', body: '', target: 'all', target_value: '', scheduled_at: '' }

export default function Announcements() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(BLANK)
  const [saving,  setSaving]  = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get('announcements').then(r => setItems(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('announcements', form)
      setModal(false)
      setForm(BLANK)
      fetch()
    } catch { alert('Failed to create announcement') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await api.delete(`announcements/${id}`)
    fetch()
  }

  return (
    <div>
      <div style={s.row}>
        <h1 style={s.h1}>System Announcements</h1>
        <button style={s.addBtn} onClick={() => setModal(true)}>+ New Announcement</button>
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading…</p> : (
        <div style={s.list}>
          {items.length === 0 && <p style={{ color: '#64748b' }}>No announcements yet.</p>}
          {items.map(item => (
            <div key={item.id} style={s.card}>
              <div style={s.cardRow}>
                <div>
                  <p style={s.title}>{item.title}</p>
                  <p style={s.meta}>
                    <span style={s.badge(TARGET_COLOR[item.target])}>Target: {item.target}{item.target_value ? ` — ${item.target_value}` : ''}</span>
                    {' '} · By {item.creator?.name || '—'} · {new Date(item.created_at).toLocaleDateString()}
                    {item.scheduled_at && <> · Scheduled: {new Date(item.scheduled_at).toLocaleString()}</>}
                    {item.sent_at && <> · Sent: {new Date(item.sent_at).toLocaleString()}</>}
                  </p>
                </div>
                <button style={s.delBtn} onClick={() => handleDelete(item.id)}>✕ Delete</button>
              </div>
              <p style={s.body}>{item.body}</p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>New Announcement</h2>
            <form onSubmit={handleCreate}>
              <label style={s.label}>Title *</label>
              <input style={s.input} type="text" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

              <label style={s.label}>Body *</label>
              <textarea style={{ ...s.input, minHeight: 100, resize: 'vertical' }} required value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />

              <label style={s.label}>Target</label>
              <select style={s.mSelect} value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
                <option value="all">All Schools</option>
                <option value="plan">By Plan</option>
                <option value="school">Specific School</option>
              </select>

              {form.target !== 'all' && (
                <>
                  <label style={s.label}>{form.target === 'plan' ? 'Plan Name' : 'School ID'}</label>
                  <input style={s.input} type="text" value={form.target_value}
                    onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
                </>
              )}

              <label style={s.label}>Schedule At (optional)</label>
              <input style={s.input} type="datetime-local" value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />

              <div style={s.mRow}>
                <button type="button" style={s.cancelBtn} onClick={() => { setModal(false); setForm(BLANK) }}>Cancel</button>
                <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

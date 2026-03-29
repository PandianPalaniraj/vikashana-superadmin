import { useEffect, useState } from 'react'
import api from '../api/client'
import useAuthStore from '../store/authStore'

const s = {
  row:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  h1:      { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  addBtn:  { padding: '9px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  table:   { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th:      { padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td:      { padding: '12px 16px', fontSize: 14, color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  actBtn:  { padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: '#fff' },
  delBtn:  { padding: '5px 10px', border: '1px solid #ef4444', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: '#fff', color: '#ef4444', marginLeft: 6 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:   { background: '#fff', borderRadius: 16, padding: 32, width: 420 },
  modalH:  { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20 },
  label:   { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, marginTop: 14 },
  input:   { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  mRow:    { display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' },
  saveBtn: { padding: '9px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  cancelBtn:{ padding: '9px 20px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  you:     { fontSize: 12, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 99, marginLeft: 8, fontWeight: 600 },
}

export default function Team() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [saving,  setSaving]  = useState(false)
  const { user: me } = useAuthStore()

  const fetch = () => {
    setLoading(true)
    api.get('team').then(r => setMembers(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openAdd = () => { setEditing(null); setForm({ name: '', email: '', password: '' }); setModal(true) }
  const openEdit = (m) => { setEditing(m); setForm({ name: m.name, email: '', password: '' }); setModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const payload = {}
        if (form.name)     payload.name     = form.name
        if (form.password) payload.password = form.password
        await api.put(`team/${editing.id}`, payload)
      } else {
        await api.post('team', form)
      }
      setModal(false)
      fetch()
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (member) => {
    if (member.id === me?.id) { alert("You can't delete yourself"); return }
    if (!confirm(`Remove ${member.name} from the team?`)) return
    await api.delete(`team/${member.id}`)
    fetch()
  }

  return (
    <div>
      <div style={s.row}>
        <h1 style={s.h1}>Team</h1>
        <button style={s.addBtn} onClick={openAdd}>+ Add Member</button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {['Name', 'Email', 'Joined', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} style={{ ...s.td, textAlign: 'center', color: '#64748b' }}>Loading…</td></tr>
          ) : members.map(m => (
            <tr key={m.id}>
              <td style={s.td}>
                {m.name}
                {m.id === me?.id && <span style={s.you}>You</span>}
              </td>
              <td style={s.td}>{m.email}</td>
              <td style={s.td}>{new Date(m.created_at).toLocaleDateString()}</td>
              <td style={s.td}>
                <button style={s.actBtn} onClick={() => openEdit(m)}>Edit</button>
                {m.id !== me?.id && (
                  <button style={s.delBtn} onClick={() => handleDelete(m)}>Remove</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalH}>{editing ? 'Edit Member' : 'Add Team Member'}</h2>
            <form onSubmit={handleSave}>
              <label style={s.label}>Name *</label>
              <input style={s.input} type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {!editing && (
                <>
                  <label style={s.label}>Email *</label>
                  <input style={s.input} type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </>
              )}
              <label style={s.label}>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input style={s.input} type="password" required={!editing} minLength={8} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <div style={s.mRow}>
                <button type="button" style={s.cancelBtn} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" style={s.saveBtn} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

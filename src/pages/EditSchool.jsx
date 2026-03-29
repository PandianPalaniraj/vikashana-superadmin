import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Jammu & Kashmir',
  'Ladakh','Puducherry','Andaman & Nicobar Islands','Dadra & Nagar Haveli','Lakshadweep',
]

const s = {
  page:      { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  header:    { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 },
  backBtn:   { padding: '7px 14px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' },
  headerH:   { fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 },
  headerSub: { fontSize: 13, color: '#64748b', margin: 0 },
  body:      { maxWidth: 860, margin: '0 auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 },
  card:      { background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' },
  cardHead:  (c) => ({ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, background: (c || '#6366f1') + '08' }),
  cardIcon:  { fontSize: 20 },
  cardTitle: { fontSize: 14, fontWeight: 800, color: '#1e293b' },
  cardBody:  { padding: 20 },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  grid3:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' },
  label:     { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5, marginTop: 14 },
  req:       { color: '#ef4444', marginLeft: 2 },
  input:     { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' },
  select:    { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#fff', boxSizing: 'border-box', outline: 'none' },
  hint:      { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  footer:    { padding: '16px 28px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'sticky', bottom: 0 },
  cancelBtn: { padding: '10px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  saveBtn:   (dis) => ({ padding: '11px 32px', background: dis ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14 }),
  toast:     { position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 14, zIndex: 300 },
}

function SectionHead({ icon, title, color }) {
  return (
    <div style={s.cardHead(color)}>
      <span style={s.cardIcon}>{icon}</span>
      <span style={s.cardTitle}>{title}</span>
    </div>
  )
}

function F({ label, required, hint, children }) {
  return (
    <div>
      <label style={s.label}>{label}{required && <span style={s.req}>*</span>}</label>
      {children}
      {hint && <div style={s.hint}>{hint}</div>}
    </div>
  )
}

export default function EditSchool() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const [form,    setForm]    = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    api.get(`schools/${id}`).then(r => {
      const sch = r.data.data
      const st  = sch.settings || {}
      setForm({
        // Direct columns
        name:           sch.name           || '',
        email:          sch.email          || '',
        phone:          sch.phone          || '',
        address:        sch.address        || '',
        website:        sch.website        || '',
        affiliation_no: sch.affiliation_no || '',
        // From settings JSON
        school_type:       st.school_type       || '',
        affiliation_board: st.affiliation_board || '',
        established_year:  st.established_year  || '',
        city:              st.city              || '',
        state:             st.state             || '',
        pincode:           st.pincode           || '',
        alternate_phone:   st.alternate_phone   || '',
        principal_name:    st.principal_name    || st.principal || '',
        principal_phone:   st.principal_phone   || '',
        principal_email:   st.principal_email   || '',
      })
    }).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`schools/${id}`, {
        ...form,
        established_year: form.established_year ? parseInt(form.established_year) : null,
      })
      showToast('School updated successfully!')
      setTimeout(() => navigate(`/schools/${id}`), 1200)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update school.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading…</div>
  if (!form)   return <div style={{ padding: 40, color: '#ef4444', textAlign: 'center' }}>School not found.</div>

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(`/schools/${id}`)}>← Back</button>
        <div>
          <p style={s.headerH}>✏️ Edit School</p>
          <p style={s.headerSub}>{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={s.body}>

          {/* School Information */}
          <div style={s.card}>
            <SectionHead icon="🏫" title="School Information" color="#6366f1" />
            <div style={s.cardBody}>

              <F label="School Name" required>
                <input style={s.input} value={form.name} required onChange={e => set('name', e.target.value)} />
              </F>

              <div style={s.grid2}>
                <F label="School Type">
                  <select style={s.select} value={form.school_type} onChange={e => set('school_type', e.target.value)}>
                    <option value="">— Select —</option>
                    {['Pre-School','Primary','Secondary','Senior Secondary','Higher Secondary','International','Multi-Level','Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </F>
                <F label="Affiliation Board">
                  <select style={s.select} value={form.affiliation_board} onChange={e => set('affiliation_board', e.target.value)}>
                    <option value="">— Select —</option>
                    {['CBSE','ICSE','State Board','IB (International)','Cambridge (IGCSE)','NIOS','Other'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </F>
              </div>

              <div style={s.grid2}>
                <F label="Affiliation Number">
                  <input style={s.input} value={form.affiliation_no} onChange={e => set('affiliation_no', e.target.value)} placeholder="e.g. 1234567" />
                </F>
                <F label="Established Year">
                  <input style={s.input} type="number" min="1800" max={new Date().getFullYear()}
                    value={form.established_year} onChange={e => set('established_year', e.target.value)} placeholder="e.g. 2005" />
                </F>
              </div>

            </div>
          </div>

          {/* Location */}
          <div style={s.card}>
            <SectionHead icon="📍" title="Location" color="#3b82f6" />
            <div style={s.cardBody}>

              <F label="Address">
                <textarea style={{ ...s.input, minHeight: 56, resize: 'vertical' }} value={form.address}
                  onChange={e => set('address', e.target.value)} placeholder="Street / Area / Locality" />
              </F>

              <div style={s.grid3}>
                <F label="City">
                  <input style={s.input} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
                </F>
                <F label="State">
                  <select style={s.select} value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">— State —</option>
                    {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </F>
                <F label="Pincode">
                  <input style={s.input} value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="600001" maxLength={6} />
                </F>
              </div>

            </div>
          </div>

          {/* Contact */}
          <div style={s.card}>
            <SectionHead icon="📞" title="Contact Details" color="#10b981" />
            <div style={s.cardBody}>

              <div style={s.grid2}>
                <F label="Phone" required>
                  <input style={s.input} value={form.phone} required onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
                </F>
                <F label="Alternate Phone">
                  <input style={s.input} value={form.alternate_phone} onChange={e => set('alternate_phone', e.target.value)} placeholder="9876543211" />
                </F>
              </div>

              <div style={s.grid2}>
                <F label="School Email" required>
                  <input style={s.input} type="email" value={form.email} required onChange={e => set('email', e.target.value)} />
                </F>
                <F label="Website">
                  <input style={s.input} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yourschool.com" />
                </F>
              </div>

            </div>
          </div>

          {/* Principal */}
          <div style={s.card}>
            <SectionHead icon="👤" title="Principal Details" color="#8b5cf6" />
            <div style={s.cardBody}>

              <div style={s.grid2}>
                <F label="Principal Name">
                  <input style={s.input} value={form.principal_name} onChange={e => set('principal_name', e.target.value)} placeholder="Dr. Anand Kumar" />
                </F>
                <F label="Principal Phone">
                  <input style={s.input} value={form.principal_phone} onChange={e => set('principal_phone', e.target.value)} placeholder="9876543210" />
                </F>
              </div>

              <F label="Principal Email" hint="Saved to school records only — not used for login">
                <input style={s.input} type="email" value={form.principal_email} onChange={e => set('principal_email', e.target.value)} placeholder="principal@school.com" />
              </F>

              <div style={{ marginTop: 14, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '9px 14px', fontSize: 12, color: '#0369a1' }}>
                💡 To change the admin login email or password, use the Users & Roles section in the school's admin portal.
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={s.footer}>
          <button type="button" style={s.cancelBtn} onClick={() => navigate(`/schools/${id}`)}>Cancel</button>
          <button type="submit" style={s.saveBtn(saving)} disabled={saving}>
            {saving ? '⏳ Saving…' : '✅ Save Changes'}
          </button>
        </div>
      </form>

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

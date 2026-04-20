import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

const PLAN_COLOR   = { pro:'#8b5cf6', premium:'#f59e0b', enterprise:'#ec4899' }
const PLAN_LABEL   = { pro:'Pro', premium:'Premium', enterprise:'Enterprise' }
const STATUS_COLOR = { active:'#22c55e', trial:'#f59e0b', overdue:'#ef4444', cancelled:'#94a3b8', expired:'#dc2626' }

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'
const fmt     = (n) => parseFloat(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })

const s = {
  page:     { fontFamily:'Inter, sans-serif' },
  topBar:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 },
  backBtn:  { background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:14, padding:0, fontWeight:600 },
  actRow:   { display:'flex', gap:8, flexWrap:'wrap' },
  btn:      (c,bg='#fff') => ({ padding:'8px 16px', background:bg||c, color:bg===c?'#fff':'#fff', border:`1px solid ${c}`, borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }),

  // Hero card
  hero:     { background:'linear-gradient(135deg,#1e293b,#334155)', borderRadius:16, padding:'24px 28px', marginBottom:24, display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' },
  heroIcon: { width:60, height:60, borderRadius:14, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 },
  heroInfo: { flex:1, minWidth:0 },
  heroName: { fontSize:22, fontWeight:900, color:'#fff', margin:'0 0 4px', lineHeight:1.2 },
  heroSub:  { fontSize:13, color:'rgba(255,255,255,0.6)', margin:'0 0 12px' },
  heroBdg:  (c) => ({ display:'inline-flex', alignItems:'center', gap:4, background:c+'22', color:c, border:`1px solid ${c}44`, borderRadius:99, padding:'4px 12px', fontSize:12, fontWeight:700, marginRight:8 }),

  // KPI row
  kpiRow:   { display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' },
  kpiCard:  (c='#6366f1') => ({ flex:1, minWidth:110, background:`${c}0d`, border:`1px solid ${c}22`, borderRadius:12, padding:'14px 16px', textAlign:'center' }),
  kpiNum:   (c) => ({ fontSize:26, fontWeight:900, color:c, margin:'0 0 2px' }),
  kpiLbl:   { fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' },

  // Sections
  grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 },
  card:     { background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden' },
  cardHead: (c='#6366f1') => ({ padding:'12px 18px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8, background:c+'08' }),
  cardIcon: { fontSize:18 },
  cardH:    { fontSize:13, fontWeight:800, color:'#1e293b' },
  cardBody: { padding:18 },

  // Field pairs
  fieldGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 20px' },
  field:    { },
  fLbl:     { fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 },
  fVal:     { fontSize:13, color:'#1e293b', fontWeight:600, wordBreak:'break-word' },
  fValFull: { fontSize:13, color:'#1e293b', fontWeight:600, gridColumn:'1/-1' },
  badge:    (c) => ({ display:'inline-block', padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:700, background:c+'22', color:c }),

  // Subscription card
  subPlan:  (c) => ({ display:'inline-block', background:c+'15', border:`2px solid ${c}`, borderRadius:10, padding:'8px 18px', marginBottom:14 }),

  // Full-width sections
  fullCard: { background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden', marginBottom:20 },

  toast:    { position:'fixed', bottom:30, left:'50%', transform:'translateX(-50%)', background:'#1e293b', color:'#fff', padding:'10px 22px', borderRadius:10, fontSize:14, zIndex:200 },
}

function InfoField({ label, value, full }) {
  if (!value && value !== 0) value = '—'
  return (
    <div style={full ? { gridColumn:'1/-1' } : {}}>
      <div style={s.fLbl}>{label}</div>
      <div style={s.fVal}>{value}</div>
    </div>
  )
}

function SectionCard({ icon, title, color, children, action }) {
  return (
    <div style={s.card}>
      <div style={s.cardHead(color)}>
        <span style={s.cardIcon}>{icon}</span>
        <span style={s.cardH}>{title}</span>
        {action && <div style={{ marginLeft:'auto' }}>{action}</div>}
      </div>
      <div style={s.cardBody}>{children}</div>
    </div>
  )
}

const PLAN_RATES = { pro: 25, premium: 40, enterprise: 0 }

const todayStr   = () => new Date().toISOString().slice(0, 10)
const addMonths  = (dateStr, n) => { const d = new Date(dateStr + 'T00:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10) }
const addYears   = (dateStr, n) => { const d = new Date(dateStr + 'T00:00:00'); d.setFullYear(d.getFullYear() + n); return d.toISOString().slice(0, 10) }

function blankSubForm(sub, studentCount) {
  const plan    = sub?.plan    || 'pro'
  const cycle   = sub?.billing_cycle || 'monthly'
  const status  = sub?.status  || 'trial'
  const rate    = PLAN_RATES[plan] || 0
  const amount  = sub?.monthly_amount || rate * (studentCount || 0)
  const today   = todayStr()
  return {
    plan,
    status,
    billing_cycle:  cycle,
    trial_ends_at:  sub?.trial_ends_at  ? sub.trial_ends_at.slice(0,10)  : addMonths(today, 1),
    renewal_date:   sub?.renewal_date   ? String(sub.renewal_date).slice(0,10) : (cycle === 'annual' ? addYears(today, 1) : addMonths(today, 1)),
    monthly_amount: amount,
    mobile_enabled: sub?.mobile_enabled ?? false,
    notes:          sub?.notes || '',
  }
}

export default function SchoolDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [school,  setSchool]  = useState(null)
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [impMsg,  setImpMsg]  = useState('')
  const [toast,   setToast]   = useState('')
  const [invoices,  setInvoices]  = useState([])
  const [timeline,  setTimeline]  = useState([])

  // Subscription modal
  const [subModal,  setSubModal]  = useState(false)
  const [subForm,   setSubForm]   = useState({})
  const [subSaving, setSubSaving] = useState(false)
  const [amountAuto, setAmountAuto] = useState(true)

  // Admin credentials
  const [pwModal,    setPwModal]   = useState(false)
  const [newPw,      setNewPw]     = useState('')
  const [pwSaving,   setPwSaving]  = useState(false)
  const [revealedPw, setRevealedPw] = useState(null)
  const [showAdminPw, setShowAdminPw] = useState(false)

  // Users tab
  const [tab,              setTab]              = useState('overview')
  const [users,            setUsers]            = useState([])
  const [usersLoading,     setUsersLoading]     = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = () =>
    Promise.all([api.get(`schools/${id}`), api.get(`schools/${id}/stats`)])
      .then(([sr, str]) => { setSchool(sr.data.data); setStats(str.data.data) })
      .finally(() => setLoading(false))

  const loadExtras = () => {
    api.get('invoices', { params: { school_id: id, per_page: 10 } })
      .then(r => setInvoices(r.data.data || []))
      .catch(() => {})
    api.get(`schools/${id}/timeline`)
      .then(r => setTimeline(r.data.data || []))
      .catch(() => {})
  }

  const loadUsers = () => {
    setUsersLoading(true)
    api.get(`schools/${id}/users`)
      .then(r => setUsers(r.data.data || []))
      .catch(() => {})
      .finally(() => setUsersLoading(false))
  }

  useEffect(() => { load(); loadExtras() }, [id]) // eslint-disable-line
  useEffect(() => { if (tab === 'users') loadUsers() }, [tab]) // eslint-disable-line

  const handleToggle = async () => {
    await api.post(`schools/${id}/toggle-status`)
    const res = await api.get(`schools/${id}`)
    setSchool(res.data.data)
    showToast(res.data.data.is_active ? 'School activated.' : 'School deactivated.')
  }

  const handleExtendTrial = async () => {
    const days = parseInt(prompt('Extend trial by how many days?', '14'), 10)
    if (!days || isNaN(days)) return
    await api.post(`subscriptions/${school.subscription.id}/extend-trial`, { days })
    showToast(`Trial extended by ${days} days.`)
    load()
  }

  const openSubModal = () => {
    const sub = school.subscription
    setAmountAuto(true)
    setSubForm(blankSubForm(sub, stats?.students))
    setSubModal(true)
  }

  const handleSaveSub = async (e) => {
    e.preventDefault()
    setSubSaving(true)
    try {
      const sub = school.subscription
      if (sub?.id) {
        await api.put(`subscriptions/${sub.id}`, subForm)
        showToast('Subscription updated.')
      } else {
        await api.post(`schools/${id}/subscription`, subForm)
        showToast('Subscription created.')
      }
      setSubModal(false)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save subscription.')
    } finally { setSubSaving(false) }
  }

  const recalcAmount = (plan, cycle, studentCount) => {
    const rate = PLAN_RATES[plan] || 0
    return cycle === 'annual' ? Math.round(rate * (studentCount || 0) * 12 * 0.8) : rate * (studentCount || 0)
  }

  const handleImpersonate = async () => {
    try {
      const res = await api.post(`schools/${id}/impersonate`)
      const { token, user, expires_at } = res.data
      setImpMsg(`Token for ${user.name} (expires ${new Date(expires_at).toLocaleTimeString()}): ${token}`)
    } catch { alert('Impersonation failed') }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPw.trim()) return
    setPwSaving(true)
    try {
      const res = await api.post(`schools/${id}/reset-admin-password`, { password: newPw })
      setRevealedPw({ email: res.data.email, password: res.data.password })
      setPwModal(false)
      setNewPw('')
      showToast('Admin password reset successfully.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password.')
    } finally { setPwSaving(false) }
  }

  if (loading) return <p style={{ color:'#64748b', padding:20 }}>Loading…</p>
  if (!school)  return <p style={{ color:'#ef4444', padding:20 }}>School not found.</p>

  const sub = school.subscription || {}
  const st  = school.settings    || {}
  const planColor  = PLAN_COLOR[sub.plan]   || '#94a3b8'
  const statusColor= STATUS_COLOR[sub.status]|| '#94a3b8'

  // Full address string
  const fullAddress = [school.address, st.city, st.state, st.pincode].filter(Boolean).join(', ')

  return (
    <div style={s.page}>

      {/* Top action bar */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={() => navigate('/schools')}>← Back to Schools</button>
        <div style={s.actRow}>
          <button style={{ ...s.btn('#6366f1','#6366f1') }} onClick={() => navigate(`/schools/${id}/edit`)}>
            ✏️ Edit School
          </button>
          <button style={{ ...s.btn(school.is_active ? '#ef4444':'#22c55e', school.is_active ? '#ef4444':'#22c55e') }} onClick={handleToggle}>
            {school.is_active ? '🔴 Deactivate' : '🟢 Activate'}
          </button>
          <button style={{ ...s.btn('#8b5cf6','#8b5cf6') }} onClick={openSubModal}>
            {sub.id ? '⚙️ Update Subscription' : '➕ Set Up Subscription'}
          </button>
          {sub.id && (
            <button style={{ ...s.btn('#3b82f6','#3b82f6') }} onClick={() => navigate(`/subscriptions/${sub.id}`)}>
              💳 View Subscription
            </button>
          )}
          <button style={{ ...s.btn('#6366f1','#6366f1') }} onClick={() => navigate(`/invoices?generate=${id}`)}>
            🧾 Generate Invoice
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroIcon}>🏫</div>
        <div style={s.heroInfo}>
          <h1 style={s.heroName}>{school.name}</h1>
          <p style={s.heroSub}>
            {[st.school_type, st.affiliation_board, st.city, st.state].filter(Boolean).join(' · ') || 'School'}
          </p>
          <div>
            <span style={s.heroBdg(school.is_active ? '#22c55e' : '#ef4444')}>
              {school.is_active ? '● Active' : '● Inactive'}
            </span>
            {sub.plan && (
              <span style={s.heroBdg(planColor)}>
                {PLAN_LABEL[sub.plan] || sub.plan}
              </span>
            )}
            {sub.status && (
              <span style={s.heroBdg(statusColor)}>
                {sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
              </span>
            )}
          </div>
        </div>
        {st.established_year && (
          <div style={{ textAlign:'right', color:'rgba(255,255,255,0.5)', fontSize:13 }}>
            <div style={{ fontSize:12 }}>Est.</div>
            <div style={{ fontSize:22, fontWeight:900, color:'rgba(255,255,255,0.8)' }}>{st.established_year}</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={s.kpiRow}>
        {[
          { label:'Students',     val: stats?.students ?? '—',  color:'#6366f1' },
          { label:'Teachers',     val: stats?.teachers ?? '—',  color:'#3b82f6' },
          { label:'Classes',      val: stats?.classes  ?? '—',  color:'#10b981' },
          { label:'Last Login',   val: stats?.last_login ? fmtDate(stats.last_login) : 'Never', color:'#f59e0b' },
        ].map(({ label, val, color }) => (
          <div key={label} style={s.kpiCard(color)}>
            <div style={s.kpiNum(color)}>{val}</div>
            <div style={s.kpiLbl}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, borderBottom:'2px solid #e2e8f0', marginBottom:20 }}>
        {[['overview','Overview'],['users','Users']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'9px 20px', background:'none', border:'none', borderBottom: tab===key ? '2px solid #6366f1' : '2px solid transparent', marginBottom:-2, cursor:'pointer', fontSize:13, fontWeight:700, color: tab===key ? '#6366f1' : '#64748b', transition:'color .15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <div style={s.fullCard}>
          <div style={s.cardHead('#6366f1')}>
            <span style={s.cardIcon}>👥</span>
            <span style={s.cardH}>All Users — {school.name}</span>
          </div>
          <div style={s.cardBody}>
            {usersLoading ? (
              <p style={{ color:'#64748b', fontSize:13, margin:0 }}>Loading users…</p>
            ) : users.length === 0 ? (
              <p style={{ color:'#94a3b8', fontSize:13, margin:0 }}>No users found for this school.</p>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:700 }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                      {['Name','Role','Mobile','Email','Password','Status','Last Login','Since'].map(h => (
                        <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const roleColors = { admin:'#EEF2FF', teacher:'#ECFDF5', parent:'#FEF3C7', staff:'#FFF1F2', super_admin:'#F5F3FF' }
                      const roleFg     = { admin:'#4338ca', teacher:'#059669', parent:'#b45309', staff:'#be123c', super_admin:'#7c3aed' }
                      const isVisible  = visiblePasswords[u.id]
                      return (
                        <tr key={u.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                          <td style={{ padding:'9px 10px', fontWeight:600, color:'#1e293b' }}>{u.name}</td>
                          <td style={{ padding:'9px 10px' }}>
                            <span style={{ background: roleColors[u.role]||'#f1f5f9', color: roleFg[u.role]||'#475569', padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:700 }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding:'9px 10px', fontFamily:'monospace', fontSize:12 }}>{u.phone || '—'}</td>
                          <td style={{ padding:'9px 10px', fontSize:12, color:'#475569' }}>{u.email || '—'}</td>
                          <td style={{ padding:'9px 10px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ fontFamily:'monospace', fontSize:12, color: isVisible ? '#1e293b' : '#94a3b8' }}>
                                {isVisible ? (u.plain_password || '—') : '••••••••'}
                              </span>
                              {u.plain_password && (
                                <button
                                  onClick={() => setVisiblePasswords(v => ({ ...v, [u.id]: !v[u.id] }))}
                                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:0, color:'#6366f1' }}
                                  title={isVisible ? 'Hide' : 'Show'}>
                                  {isVisible ? '🙈' : '👁'}
                                </button>
                              )}
                              {isVisible && u.plain_password && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(u.plain_password); showToast('Copied!') }}
                                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, padding:0 }}
                                  title="Copy">📋</button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding:'9px 10px' }}>
                            <span style={{ color: u.status==='active' ? '#10b981' : '#ef4444', fontWeight:600, fontSize:12 }}>
                              {u.status}
                            </span>
                          </td>
                          <td style={{ padding:'9px 10px', fontSize:12, color:'#64748b' }}>{u.last_login ? fmtDate(u.last_login) : 'Never'}</td>
                          <td style={{ padding:'9px 10px', fontSize:12, color:'#94a3b8' }}>{fmtDate(u.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Overview Tab ── */}
      {tab === 'overview' && <>

      {/* 2-col: School Info + Subscription */}
      <div style={s.grid2}>

        {/* School Info */}
        <SectionCard icon="🏫" title="School Information" color="#6366f1">
          <div style={s.fieldGrid}>
            <InfoField label="School Name"      value={school.name} full />
            <InfoField label="Type"             value={st.school_type} />
            <InfoField label="Affiliation Board"value={st.affiliation_board} />
            <InfoField label="Affiliation No"   value={school.affiliation_no} />
            <InfoField label="Established"      value={st.established_year} />
          </div>
        </SectionCard>

        {/* Subscription */}
        <SectionCard icon="💳" title="Subscription" color="#8b5cf6"
          action={
            sub.id && (
              <button style={{ padding:'5px 12px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}
                onClick={() => navigate(`/subscriptions/${sub.id}`)}>
                Manage →
              </button>
            )
          }>
          {sub.plan ? (
            <>
              <div style={s.subPlan(planColor)}>
                <div style={{ fontSize:11, color:planColor, fontWeight:600 }}>PLAN</div>
                <div style={{ fontSize:18, fontWeight:900, color:planColor }}>{PLAN_LABEL[sub.plan] || sub.plan}</div>
              </div>
              <div style={s.fieldGrid}>
                <InfoField label="Status"       value={<span style={s.badge(statusColor)}>{sub.status}</span>} />
                <InfoField label="Billing Cycle"value={sub.billing_cycle || '—'} />
                <InfoField label="Monthly Amount" value={sub.monthly_amount ? `₹${fmt(sub.monthly_amount)}/mo` : '—'} />
                <InfoField label="Students Allowed" value={sub.student_count ?? '—'} />
                <InfoField label="Mobile App"   value={sub.mobile_enabled ? '✅ Enabled' : '❌ Disabled'} />
                <InfoField label="Renewal Date" value={fmtDate(sub.renewal_date)} />
                {sub.trial_ends_at && (
                  <InfoField label="Trial Ends"   value={fmtDate(sub.trial_ends_at)} />
                )}
              </div>
              {sub.status === 'trial' && (
                <button style={{ marginTop:12, padding:'7px 14px', background:'#f59e0b', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:700, cursor:'pointer' }}
                  onClick={handleExtendTrial}>
                  ⏱ Extend Trial
                </button>
              )}
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
              <p style={{ color:'#94a3b8', fontSize:13, margin:'0 0 12px' }}>No subscription set up yet.</p>
              <button style={{ padding:'8px 18px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}
                onClick={openSubModal}>
                ➕ Set Up Subscription
              </button>
            </div>
          )}
        </SectionCard>

      </div>

      {/* 2-col: Location + Contact */}
      <div style={s.grid2}>

        {/* Location */}
        <SectionCard icon="📍" title="Location" color="#3b82f6">
          <div style={s.fieldGrid}>
            {school.address && <InfoField label="Address" value={school.address} full />}
            <InfoField label="City"    value={st.city} />
            <InfoField label="State"   value={st.state} />
            <InfoField label="Pincode" value={st.pincode} />
            {!school.address && !st.city && !st.state && (
              <div style={{ gridColumn:'1/-1', color:'#94a3b8', fontSize:13 }}>No location info added.</div>
            )}
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard icon="📞" title="Contact Details" color="#10b981">
          <div style={s.fieldGrid}>
            <InfoField label="Primary Phone"   value={school.phone} />
            <InfoField label="Alternate Phone" value={st.alternate_phone} />
            <InfoField label="Email"           value={school.email} />
            <InfoField label="Website"         value={school.website
              ? <a href={school.website} target="_blank" rel="noreferrer" style={{ color:'#3b82f6', fontWeight:600 }}>{school.website}</a>
              : null} />
          </div>
        </SectionCard>

      </div>

      {/* Principal Details */}
      <div style={s.fullCard}>
        <div style={s.cardHead('#f59e0b')}>
          <span style={s.cardIcon}>👤</span>
          <span style={s.cardH}>Principal Details</span>
        </div>
        <div style={s.cardBody}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 20px' }}>
            <InfoField label="Principal Name"  value={st.principal_name || st.principal} />
            <InfoField label="Principal Phone" value={st.principal_phone} />
            <InfoField label="Principal Email" value={st.principal_email} />
          </div>
        </div>
      </div>

      {/* Admin Credentials */}
      <div style={s.fullCard}>
        <div style={s.cardHead('#6366f1')}>
          <span style={s.cardIcon}>🔑</span>
          <span style={s.cardH}>Admin Login Credentials</span>
        </div>
        <div style={s.cardBody}>
          {school.admin_user ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 20px', alignItems:'end' }}>
              <div>
                <div style={s.fLbl}>Admin Name</div>
                <div style={s.fVal}>{school.admin_user.name || '—'}</div>
              </div>
              <div>
                <div style={s.fLbl}>Login Email</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ ...s.fVal, fontFamily:'monospace', background:'#f1f5f9', padding:'4px 10px', borderRadius:6 }}>
                    {school.admin_user.email}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(school.admin_user.email); showToast('Email copied!') }}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, padding:2 }}
                    title="Copy email">📋</button>
                </div>
              </div>
              <div>
                <div style={s.fLbl}>Password</div>
                {(() => {
                  const pw = revealedPw?.email === school.admin_user?.email
                    ? revealedPw.password
                    : (showAdminPw ? school.admin_password : null)
                  return (
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:'monospace', background: pw ? '#fefce8' : 'transparent', border: pw ? '1px solid #fde047' : 'none', padding: pw ? '4px 10px' : 0, borderRadius:6, fontSize:13, fontWeight:700, color: pw ? '#713f12' : '#94a3b8', letterSpacing: pw ? 0 : 2 }}>
                        {pw || '••••••••'}
                      </span>
                      {school.admin_password && (
                        <button onClick={() => setShowAdminPw(v => !v)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:2, color:'#6366f1' }}
                          title={showAdminPw ? 'Hide' : 'Show password'}>
                          {showAdminPw ? '🙈' : '👁'}
                        </button>
                      )}
                      {pw && (
                        <button onClick={() => { navigator.clipboard.writeText(pw); showToast('Password copied!') }}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:2 }}
                          title="Copy">📋</button>
                      )}
                      <button onClick={() => { setNewPw(''); setPwModal(true) }}
                        style={{ padding:'4px 10px', background:'#6366f1', color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        🔁 Reset
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            <p style={{ color:'#94a3b8', fontSize:13, margin:0 }}>No admin account found for this school.</p>
          )}
        </div>
      </div>

      {/* Admin Impersonation */}
      <div style={s.fullCard}>
        <div style={s.cardHead('#64748b')}>
          <span style={s.cardIcon}>🔐</span>
          <span style={s.cardH}>Admin Impersonation</span>
        </div>
        <div style={s.cardBody}>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:14, marginTop:0 }}>
            Generate a temporary 2-hour token to log in as this school's admin for troubleshooting.
          </p>
          <button style={{ padding:'9px 20px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}
            onClick={handleImpersonate}>
            🔑 Generate Impersonate Token
          </button>
          {impMsg && (
            <div style={{ marginTop:12, background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:12, fontSize:12, wordBreak:'break-all', color:'#166534', lineHeight:1.6 }}>
              {impMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── Subscription Create/Update Modal ── */}
      {subModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}
          onClick={() => setSubModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            <h2 style={{ fontSize:18, fontWeight:800, color:'#1e293b', marginBottom:4 }}>
              {school.subscription?.id ? '⚙️ Update Subscription' : '➕ Set Up Subscription'}
            </h2>
            <p style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>
              {school.name} · {stats?.students || 0} active students
            </p>

            {school.subscription?.id && (
              <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#0369a1', marginBottom:12 }}>
                Subscription #{school.subscription.id} — fields pre-filled from current subscription
              </div>
            )}

            <form onSubmit={handleSaveSub}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:12 }}>Plan *</label>
                  <select style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, background:'#fff', boxSizing:'border-box' }}
                    value={subForm.plan}
                    onChange={e => {
                      const plan = e.target.value
                      const amount = amountAuto ? recalcAmount(plan, subForm.billing_cycle, stats?.students) : subForm.monthly_amount
                      setSubForm(f => ({ ...f, plan, monthly_amount: amount }))
                    }}>
                    {[['pro','Pro ₹25/std'],['premium','Premium ₹40/std'],['enterprise','Enterprise']].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:12 }}>Status *</label>
                  <select style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, background:'#fff', boxSizing:'border-box' }}
                    value={subForm.status}
                    onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))}>
                    {[['trial','Trial'],['active','Active'],['overdue','Overdue'],['cancelled','Cancelled']].map(([v,l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:12 }}>Billing Cycle *</label>
                  <select style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, background:'#fff', boxSizing:'border-box' }}
                    value={subForm.billing_cycle}
                    onChange={e => {
                      const cycle = e.target.value
                      const renewal = cycle === 'annual' ? addYears(todayStr(), 1) : addMonths(todayStr(), 1)
                      const amount  = amountAuto ? recalcAmount(subForm.plan, cycle, stats?.students) : subForm.monthly_amount
                      setSubForm(f => ({ ...f, billing_cycle: cycle, renewal_date: renewal, monthly_amount: amount }))
                    }}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (20% off)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:12 }}>Mobile App</label>
                  <select style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, background:'#fff', boxSizing:'border-box' }}
                    value={subForm.mobile_enabled ? 'true' : 'false'}
                    onChange={e => setSubForm(f => ({ ...f, mobile_enabled: e.target.value === 'true' }))}>
                    <option value="true">Enabled ✅</option>
                    <option value="false">Disabled ❌</option>
                  </select>
                </div>
                {subForm.status === 'trial' && (
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:12 }}>Trial Ends At</label>
                    <input type="date" style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }}
                      value={subForm.trial_ends_at || ''}
                      onChange={e => setSubForm(f => ({ ...f, trial_ends_at: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:12 }}>Renewal Date</label>
                  <input type="date" style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box' }}
                    value={subForm.renewal_date || ''}
                    onChange={e => setSubForm(f => ({ ...f, renewal_date: e.target.value }))} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#0369a1', marginTop:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                      <span>
                        {stats?.students || 0} students × ₹{PLAN_RATES[subForm.plan] || 0}
                        {subForm.billing_cycle === 'annual' ? ' × 12 × 80%' : '/mo'}
                        {' = '}
                        <strong>₹{recalcAmount(subForm.plan, subForm.billing_cycle, stats?.students).toLocaleString('en-IN')}</strong>
                        {subForm.billing_cycle === 'annual' ? '/yr' : '/mo'}
                      </span>
                      <label style={{ fontSize:12, display:'flex', alignItems:'center', gap:5, cursor:'pointer' }}>
                        <input type="checkbox" checked={amountAuto} onChange={e => {
                          setAmountAuto(e.target.checked)
                          if (e.target.checked) setSubForm(f => ({ ...f, monthly_amount: recalcAmount(f.plan, f.billing_cycle, stats?.students) }))
                        }} />
                        Auto-calculate
                      </label>
                    </div>
                  </div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:10 }}>
                    Amount (₹) {amountAuto ? '— auto' : '— manual'}
                  </label>
                  <input type="number" style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box', background: amountAuto ? '#f8fafc' : '#fff' }}
                    readOnly={amountAuto}
                    value={subForm.monthly_amount || 0}
                    onChange={e => setSubForm(f => ({ ...f, monthly_amount: +e.target.value }))} />
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, marginTop:10 }}>Notes</label>
                  <textarea style={{ width:'100%', padding:'9px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, boxSizing:'border-box', minHeight:52, resize:'vertical' }}
                    value={subForm.notes || ''}
                    onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
                <button type="button" style={{ padding:'9px 20px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}
                  onClick={() => setSubModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={subSaving}
                  style={{ padding:'9px 22px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                  {subSaving ? 'Saving…' : school.subscription?.id ? 'Update Subscription' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Admin Password Modal ── */}
      {pwModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}
          onClick={() => setPwModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:28, width:'100%', maxWidth:400 }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize:17, fontWeight:800, color:'#1e293b', marginBottom:4 }}>🔁 Reset Admin Password</h2>
            <p style={{ fontSize:13, color:'#64748b', marginBottom:18, marginTop:4 }}>
              Set a new password for <strong>{school.admin_user?.email}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>New Password</label>
              <input
                type="text"
                autoFocus
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #d1d5db', borderRadius:8, fontSize:15, fontFamily:'monospace', boxSizing:'border-box', marginBottom:18 }}
                placeholder="Enter new password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                minLength={6}
              />
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" style={{ padding:'9px 20px', background:'#f1f5f9', color:'#374151', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}
                  onClick={() => setPwModal(false)}>Cancel</button>
                <button type="submit" disabled={pwSaving}
                  style={{ padding:'9px 22px', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                  {pwSaving ? 'Saving…' : 'Reset & Show Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Invoice History ── */}
      <div style={s.fullCard}>
        <div style={{ ...s.cardHead('#6366f1'), display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.cardIcon}>🧾</span>
            <span style={s.cardH}>Invoice History</span>
          </div>
          <button
            style={{ padding:'5px 12px', background:'#6366f1', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}
            onClick={() => navigate(`/invoices?generate=${id}`)}>
            + Generate Invoice
          </button>
        </div>
        <div style={s.cardBody}>
          {invoices.length === 0 ? (
            <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>No invoices yet.</p>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                  {['Invoice No', 'Period', 'Students', 'Total', 'Paid', 'Balance', 'Status', 'Due Date'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const paid = inv.total_paid ?? 0
                  const bal  = inv.balance    ?? (inv.total - paid)
                  const sc   = { draft:'#94a3b8', sent:'#3b82f6', partial:'#f59e0b', paid:'#22c55e', overdue:'#ef4444', cancelled:'#64748b' }
                  return (
                    <tr key={inv.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                      <td style={{ padding:'8px 10px', fontWeight:700, color:'#6366f1' }}>{inv.invoice_no}</td>
                      <td style={{ padding:'8px 10px' }}>{inv.period_label}</td>
                      <td style={{ padding:'8px 10px' }}>{inv.student_count}</td>
                      <td style={{ padding:'8px 10px', fontWeight:600 }}>₹{fmt(inv.total)}</td>
                      <td style={{ padding:'8px 10px', color:'#22c55e', fontWeight:600 }}>₹{fmt(paid)}</td>
                      <td style={{ padding:'8px 10px', color: bal > 0 ? '#ef4444' : '#22c55e', fontWeight:600 }}>₹{fmt(bal)}</td>
                      <td style={{ padding:'8px 10px' }}>
                        <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:(sc[inv.status]||'#94a3b8')+'22', color:sc[inv.status]||'#94a3b8' }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding:'8px 10px', fontSize:12, color:'#64748b' }}>{fmtDate(inv.due_date)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Timeline ── */}
      {timeline.length > 0 && (
        <div style={s.fullCard}>
          <div style={s.cardHead('#475569')}>
            <span style={s.cardIcon}>📅</span>
            <span style={s.cardH}>School Timeline</span>
          </div>
          <div style={{ ...s.cardBody, maxHeight:400, overflowY:'auto' }}>
            <div style={{ position:'relative', paddingLeft:28 }}>
              <div style={{ position:'absolute', left:10, top:8, bottom:8, width:2, background:'#e2e8f0' }} />
              {timeline.map((ev, i) => (
                <div key={i} style={{ position:'relative', marginBottom:20 }}>
                  <div style={{ position:'absolute', left:-22, top:2, width:14, height:14, borderRadius:'50%', background:ev.color||'#94a3b8', border:'2px solid #fff', boxShadow:`0 0 0 2px ${ev.color||'#94a3b8'}33` }} />
                  <div style={{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:16 }}>{ev.icon}</span>
                    <div>
                      <span style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{ev.title}</span>
                      {ev.description && <p style={{ fontSize:12, color:'#64748b', margin:'2px 0 0' }}>{ev.description}</p>}
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8', whiteSpace:'nowrap' }}>{ev.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </> /* end overview tab */}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

// ─── Plan metadata ────────────────────────────────────────────────────────────
const PLAN_META = {
  pro:        { monthly: 25,   annual: 20.83, maxS: 2000, maxT: 200, mobile: true,  color: '#8b5cf6',
                features: ['2,000 Students', '200 Teachers', 'Mobile App', 'API Access', 'Priority Support'] },
  premium:    { monthly: 40,   annual: 33.33, maxS: 5000, maxT: 500, mobile: true,  color: '#f59e0b',
                features: ['5,000 Students', '500 Teachers', '24×7 Support', 'Custom Domain', 'Advanced Analytics'] },
  enterprise: { monthly: 0,    annual: 0,     maxS: '∞',  maxT: '∞', mobile: true,  color: '#ec4899',
                features: ['Unlimited Students', 'Dedicated Server', 'Custom Pricing', 'SLA Guarantee', 'White Label'] },
}
const PLAN_LABEL = { pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' }

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh','Jammu & Kashmir',
  'Ladakh','Puducherry','Andaman & Nicobar Islands','Dadra & Nagar Haveli','Lakshadweep',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcAmount = (plan, cycle, students) => {
  const meta     = PLAN_META[plan] || {}
  const rate     = meta[cycle] || 0
  const months   = cycle === 'annual' ? 12 : 1
  const subtotal = parseFloat((rate * Math.max(students, 0) * months).toFixed(2))
  const gst      = parseFloat((subtotal * 0.18).toFixed(2))
  return { rate, months, subtotal, gst, total: subtotal + gst }
}
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmt     = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page:      { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  header:    { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 },
  backBtn:   { padding: '7px 14px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' },
  headerH:   { fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 },
  headerSub: { fontSize: 13, color: '#64748b', margin: 0 },
  body:      { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, padding: '24px 28px', maxWidth: 1200, margin: '0 auto' },
  formCol:   { display: 'flex', flexDirection: 'column', gap: 20 },

  // Cards
  card:      { background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' },
  cardHead:  (c='#6366f1') => ({ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, background: c + '08' }),
  cardIcon:  { fontSize: 20 },
  cardTitle: { fontSize: 14, fontWeight: 800, color: '#1e293b' },
  cardSub:   { fontSize: 12, color: '#64748b', marginLeft: 'auto' },
  cardBody:  { padding: 20 },

  // Form fields
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  grid3:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' },
  label:     { display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5, marginTop: 14 },
  req:       { color: '#ef4444', marginLeft: 2 },
  input:     { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', transition: 'border 0.15s' },
  select:    { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#fff', boxSizing: 'border-box', outline: 'none' },
  hint:      { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  autoTag:   { display: 'inline-block', fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '1px 7px', borderRadius: 99, marginLeft: 6 },

  // Plan cards
  planGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 },
  planCard:  (active, color) => ({
    border: `2px solid ${active ? color : '#e2e8f0'}`,
    borderRadius: 10, padding: '10px 8px', cursor: 'pointer',
    background: active ? color + '10' : '#fff',
    textAlign: 'center', transition: 'all 0.15s',
  }),
  planName:  (active, color) => ({ fontSize: 12, fontWeight: 800, color: active ? color : '#374151', marginBottom: 4 }),
  planRate:  (active, color) => ({ fontSize: 16, fontWeight: 900, color: active ? color : '#1e293b' }),
  planSub:   { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  // Billing cycle toggle
  cycleRow:  { display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 0, marginTop: 8 },
  cycleBtn:  (active) => ({ flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? '#fff' : 'transparent', color: active ? '#6366f1' : '#64748b', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }),

  // Preview card (sticky)
  preview:   { position: 'sticky', top: 80, background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', overflow: 'hidden' },
  prevHead:  { padding: '16px 20px', background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff' },
  prevH:     { fontSize: 15, fontWeight: 800, margin: 0 },
  prevSub:   { fontSize: 12, color: '#94a3b8', margin: '2px 0 0' },
  prevBody:  { padding: 20 },

  // Footer
  footer:    { padding: '16px 28px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'sticky', bottom: 0 },
  cancelBtn: { padding: '10px 24px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  submitBtn: (dis) => ({ padding: '11px 32px', background: dis ? '#c4b5fd' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14 }),

  // Cred modal
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  credModal: { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, required, hint, auto, children }) {
  return (
    <div>
      <label style={s.label}>
        {label}{required && <span style={s.req}>*</span>}
        {auto && <span style={s.autoTag}>AUTO</span>}
      </label>
      {children}
      {hint && <div style={s.hint}>{hint}</div>}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHead({ icon, title, sub, color = '#6366f1' }) {
  return (
    <div style={s.cardHead(color)}>
      <span style={s.cardIcon}>{icon}</span>
      <span style={s.cardTitle}>{title}</span>
      {sub && <span style={s.cardSub}>{sub}</span>}
    </div>
  )
}

// ─── Subscription Preview Card ────────────────────────────────────────────────
function SubscriptionPreview({ form }) {
  const plan    = PLAN_META[form.plan] || {}
  const calc    = calcAmount(form.plan, form.billing_cycle, form.estimated_students)
  const isFreePlan = form.plan === 'enterprise'
  const isTrial = parseInt(form.trial_days || 0) > 0
  const trialEnd  = isTrial ? addDays(parseInt(form.trial_days)) : null
  const renewalBase = trialEnd || new Date()
  const renewalDate = form.billing_cycle === 'annual'
    ? new Date(renewalBase.getFullYear() + 1, renewalBase.getMonth(), renewalBase.getDate())
    : new Date(renewalBase.getFullYear(), renewalBase.getMonth() + 1, renewalBase.getDate())

  const Row = ({ l, v, bold, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
      <span style={{ color: '#64748b' }}>{l}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: color || '#1e293b' }}>{v}</span>
    </div>
  )

  return (
    <div style={s.preview}>
      <div style={s.prevHead}>
        <p style={s.prevH}>📋 Subscription Preview</p>
        <p style={s.prevSub}>Updates as you fill the form</p>
      </div>
      <div style={s.prevBody}>

        {/* Plan badge */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-block', background: plan.color + '15', border: `2px solid ${plan.color}`, borderRadius: 10, padding: '10px 20px' }}>
            <div style={{ fontSize: 12, color: plan.color, fontWeight: 600 }}>SELECTED PLAN</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: plan.color, marginTop: 2 }}>{PLAN_LABEL[form.plan]}</div>
          </div>
        </div>

        {/* Limits */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Limits</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: '👨‍🎓 Max Students', v: typeof plan.maxS === 'number' ? plan.maxS.toLocaleString() : plan.maxS },
              { l: '👨‍🏫 Max Teachers', v: typeof plan.maxT === 'number' ? plan.maxT.toLocaleString() : plan.maxT },
              { l: '📱 Mobile App', v: plan.mobile ? '✅ Yes' : '❌ No' },
              { l: '💳 Billing', v: form.billing_cycle === 'annual' ? '🎁 Annual' : 'Monthly' },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Amount breakdown */}
        {!isFreePlan && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>First Invoice Estimate</div>
            <Row l="Rate / student / month" v={`₹${calc.rate}`} />
            <Row l="Est. students" v={form.estimated_students || 0} />
            <Row l={`Months (${form.billing_cycle})`} v={calc.months} />
            <Row l="Subtotal" v={`₹${fmt(calc.subtotal)}`} />
            <Row l="GST (18%)" v={`₹${fmt(calc.gst)}`} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 15, fontWeight: 800, color: '#1e293b', borderTop: '2px solid #e2e8f0', marginTop: 4 }}>
              <span>Total</span>
              <span style={{ color: '#6366f1' }}>₹{fmt(calc.total)}</span>
            </div>
            {form.billing_cycle === 'annual' && (
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
                🎁 Annual saves ≈{Math.round((1 - calc.rate / (PLAN_META[form.plan]?.monthly || 1)) * 100)}% vs monthly
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline</div>
          <Row l="Status" v={isTrial ? `🟡 Trial (${form.trial_days} days)` : '🟢 Active'} color={isTrial ? '#f59e0b' : '#22c55e'} />
          {isTrial && <Row l="Trial ends" v={fmtDate(trialEnd)} />}
          <Row l="First renewal" v={fmtDate(renewalDate)} />
          <Row l="Billing cycle" v={form.billing_cycle === 'annual' ? 'Yearly' : 'Monthly'} />
        </div>

        {/* Features */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Included Features</div>
          {(plan.features || []).map(f => (
            <div key={f} style={{ fontSize: 12, color: '#374151', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: plan.color }}>✓</span> {f}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ─── Credentials Success Modal ────────────────────────────────────────────────
function CredModal({ data, onDone }) {
  const [copied, setCopied] = useState(false)
  const school = data.school
  const sub    = school.subscription || {}

  const credText = [
    `🏫 School: ${school.name}`,
    `📧 Login URL: https://app.vikashana.com`,
    `👤 Email: ${data.login.email}`,
    `🔑 Password: ${data.login.password}`,
    `📋 Plan: ${sub.plan || '—'} (${sub.billing_cycle || 'monthly'})`,
    `📅 Status: ${sub.status || '—'}${sub.trial_ends_at ? ` · Trial until ${fmtDate(sub.trial_ends_at)}` : ''}`,
  ].join('\n')

  const copy = () => {
    navigator.clipboard?.writeText(credText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waMsg = encodeURIComponent(
    `Welcome to Vikashana! 🎉\n\n` +
    `Your school *${school.name}* has been registered.\n\n` +
    `🔗 Login: https://app.vikashana.com\n` +
    `📧 Email: ${data.login.email}\n` +
    `🔑 Password: ${data.login.password}\n\n` +
    `Plan: ${sub.plan?.toUpperCase()} | Billing: ${sub.billing_cycle}\n\n` +
    `Please login and change your password at the earliest.\n` +
    `For support, reply to this message. 🙏\nTeam Vikashana`
  )
  const waPhone = school.phone?.replace(/\D/g, '')
  const waLink  = `https://wa.me/91${waPhone}?text=${waMsg}`

  const PLAN_C = { pro:'#8b5cf6', premium:'#f59e0b', enterprise:'#ec4899' }
  const planColor = PLAN_C[sub.plan] || '#6366f1'

  return (
    <div style={s.overlay}>
      <div style={s.credModal}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#15803d', margin: 0 }}>School Registered!</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Share the credentials below with the school admin</p>
        </div>

        {/* School info */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{school.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{school.phone} · {school.email}</div>
        </div>

        {/* Credentials */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔐 Admin Login Credentials</div>
          {[
            ['Login URL', 'https://app.vikashana.com'],
            ['Email',     data.login.email],
            ['Password',  data.login.password],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #dbeafe' }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: l === 'Password' ? '#7c3aed' : '#1e293b' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Plan summary */}
        <div style={{ background: planColor + '10', border: `1px solid ${planColor}33`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: planColor, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Subscription</div>
          {[
            ['Plan',    PLAN_LABEL[sub.plan] || sub.plan],
            ['Billing', sub.billing_cycle === 'annual' ? 'Annual' : 'Monthly'],
            ['Status',  sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)],
            ...(sub.trial_ends_at ? [['Trial ends', fmtDate(sub.trial_ends_at)]] : []),
            ...(sub.renewal_date  ? [['Renewal',    fmtDate(sub.renewal_date)]]  : []),
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>{l}</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
          ⚠️ Ask the school admin to change their password after first login.
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={copy}
            style={{ flex: 1, padding: '10px', background: copied ? '#16a34a' : '#1e293b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            {copied ? '✅ Copied!' : '📋 Copy Credentials'}
          </button>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: '10px', background: '#25d366', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
            📱 Send via WhatsApp
          </a>
        </div>

        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <button onClick={onDone}
            style={{ padding: '10px 28px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const BLANK = {
  // School
  school_name: '', school_type: 'Secondary', affiliation_board: 'CBSE', affiliation_no: '',
  established_year: '', address: '', city: '', state: '', pincode: '',
  phone: '', alternate_phone: '', email: '', website: '',
  // Admin login
  admin_name: '', admin_email: '', admin_phone: '', admin_password: '',
  // Subscription
  plan: 'pro', billing_cycle: 'monthly', estimated_students: 100, trial_days: 30,
}

export default function RegisterSchool() {
  const navigate     = useNavigate()
  const [form,     setForm]     = useState(BLANK)
  const [saving,   setSaving]   = useState(false)
  const [credData, setCredData] = useState(null)
  const [errors,   setErrors]   = useState({})

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const err = (key) => errors[key] ? { borderColor: '#ef4444' } : {}

  // Auto-fill admin email from school email if admin email is empty
  const handleSchoolEmail = (v) => {
    set('email', v)
    if (!form.admin_email) set('admin_email', v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const res = await api.post('schools/register', {
        ...form,
        estimated_students: parseInt(form.estimated_students) || 0,
        trial_days:         parseInt(form.trial_days) || 0,
        established_year:   form.established_year ? parseInt(form.established_year) : null,
      })
      setCredData({ school: res.data.data.school, login: res.data.data.login })
    } catch (err) {
      const d = err.response?.data
      if (d?.errors) setErrors(d.errors)
      else alert(d?.message || 'Registration failed. Please check the form.')
    } finally {
      setSaving(false)
    }
  }

  const planMeta = PLAN_META[form.plan] || {}

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/schools')}>← Back</button>
        <div>
          <p style={s.headerH}>🏫 Register New School</p>
          <p style={s.headerSub}>Creates school, admin account, default classes & subscription automatically</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={s.body}>

          {/* ── Left: Form columns ── */}
          <div style={s.formCol}>

            {/* School Information */}
            <div style={s.card}>
              <SectionHead icon="🏫" title="School Information" sub="Basic details" color="#6366f1" />
              <div style={s.cardBody}>

                <Field label="School Name" required>
                  <input style={{ ...s.input, ...err('school_name') }} value={form.school_name} required
                    onChange={e => set('school_name', e.target.value)} placeholder="e.g. Subiksha Pre School" />
                </Field>

                <div style={s.grid2}>
                  <Field label="School Type">
                    <select style={s.select} value={form.school_type} onChange={e => set('school_type', e.target.value)}>
                      {['Pre-School','Primary','Secondary','Senior Secondary','Higher Secondary','International','Multi-Level','Other'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Affiliation Board">
                    <select style={s.select} value={form.affiliation_board} onChange={e => set('affiliation_board', e.target.value)}>
                      {['CBSE','ICSE','State Board','IB (International)','Cambridge (IGCSE)','NIOS','Other'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div style={s.grid2}>
                  <Field label="Affiliation Number" hint="CBSE/Board affiliation no.">
                    <input style={s.input} value={form.affiliation_no} onChange={e => set('affiliation_no', e.target.value)} placeholder="e.g. 1234567" />
                  </Field>
                  <Field label="Established Year" hint="Year school was founded">
                    <input style={s.input} type="number" min="1800" max={new Date().getFullYear()}
                      value={form.established_year} onChange={e => set('established_year', e.target.value)} placeholder="e.g. 2005" />
                  </Field>
                </div>

                <Field label="Address">
                  <textarea style={{ ...s.input, minHeight: 56, resize: 'vertical' }} value={form.address}
                    onChange={e => set('address', e.target.value)} placeholder="Street / Area / Locality" />
                </Field>

                <div style={s.grid3}>
                  <Field label="City" required>
                    <input style={{ ...s.input, ...err('city') }} value={form.city} required
                      onChange={e => set('city', e.target.value)} placeholder="City" />
                  </Field>
                  <Field label="State">
                    <select style={s.select} value={form.state} onChange={e => set('state', e.target.value)}>
                      <option value="">— State —</option>
                      {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </Field>
                  <Field label="Pincode">
                    <input style={s.input} value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="600001" maxLength={6} />
                  </Field>
                </div>

                <div style={s.grid2}>
                  <Field label="Phone" required hint="Primary contact number">
                    <input style={{ ...s.input, ...err('phone') }} value={form.phone} required
                      onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
                  </Field>
                  <Field label="Alternate Phone" hint="Optional second number">
                    <input style={s.input} value={form.alternate_phone}
                      onChange={e => set('alternate_phone', e.target.value)} placeholder="9876543211" />
                  </Field>
                </div>

                <div style={s.grid2}>
                  <Field label="School Email" required hint="Used for school notifications">
                    <input style={{ ...s.input, ...err('email') }} type="email" value={form.email} required
                      onChange={e => handleSchoolEmail(e.target.value)} placeholder="school@example.com" />
                  </Field>
                  <Field label="Website" hint="Optional">
                    <input style={s.input} value={form.website}
                      onChange={e => set('website', e.target.value)} placeholder="https://yourschool.com" />
                  </Field>
                </div>

              </div>
            </div>

            {/* Admin Login */}
            <div style={s.card}>
              <SectionHead icon="🔐" title="Admin Login Account" sub="Credentials for the school admin" color="#3b82f6" />
              <div style={s.cardBody}>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 14px', fontSize: 12, color: '#1d4ed8', marginBottom: 12 }}>
                  💡 These credentials are used to login to Vikashana.
                </div>

                <div style={s.grid2}>
                  <Field label="Admin Name" required hint="Full name of the school administrator">
                    <input style={{ ...s.input, ...err('admin_name') }} value={form.admin_name} required
                      onChange={e => set('admin_name', e.target.value)} placeholder="Dr. Anand Kumar" />
                  </Field>
                  <Field label="Admin Login Email" required hint="Must be unique across all schools">
                    <input style={{ ...s.input, ...err('admin_email') }} type="email" value={form.admin_email} required
                      onChange={e => set('admin_email', e.target.value)} placeholder="admin@school.com" />
                  </Field>
                </div>

                <div style={s.grid2}>
                  <Field label="Admin Phone" hint="Optional — defaults to school phone">
                    <input style={s.input} value={form.admin_phone}
                      onChange={e => set('admin_phone', e.target.value)} placeholder="9876543210" />
                  </Field>
                  <Field label="Admin Password" hint="Leave blank to auto-generate (e.g. Admin@1234)">
                    <input style={s.input} type="text" value={form.admin_password}
                      onChange={e => set('admin_password', e.target.value)} placeholder="Leave blank for auto-generated password" />
                  </Field>
                </div>

              </div>
            </div>

            {/* Subscription */}
            <div style={s.card}>
              <SectionHead icon="📋" title="Subscription Setup" sub="Auto-populated from plan selection" color="#8b5cf6" />
              <div style={s.cardBody}>

                {/* Plan selector */}
                <Field label="Select Plan">
                  <div style={s.planGrid}>
                    {Object.entries(PLAN_META).map(([id, meta]) => {
                      const isActive = form.plan === id
                      const rate     = meta[form.billing_cycle] || 0
                      return (
                        <div key={id} style={s.planCard(isActive, meta.color)}
                          onClick={() => set('plan', id)}>
                          {id === 'pro' && (
                            <div style={{ fontSize: 9, fontWeight: 800, background: meta.color, color: '#fff', padding: '2px 6px', borderRadius: 99, marginBottom: 4, display: 'inline-block' }}>Popular</div>
                          )}
                          <div style={s.planName(isActive, meta.color)}>{PLAN_LABEL[id]}</div>
                          <div style={s.planRate(isActive, meta.color)}>
                            {rate === 0 ? 'Custom' : `₹${rate}`}
                          </div>
                          {rate > 0 && <div style={s.planSub}>/student/mo</div>}
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 5 }}>
                            👨‍🎓 {typeof meta.maxS === 'number' ? meta.maxS.toLocaleString() : meta.maxS}
                          </div>
                          <div style={{ fontSize: 10, color: meta.mobile ? '#22c55e' : '#ef4444', fontWeight: 600, marginTop: 2 }}>
                            📱 {meta.mobile ? 'Yes' : 'No'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Field>

                {/* Auto-populated plan info */}
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginTop: 10, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                    ✅ Auto-populated from <span style={{ color: planMeta.color }}>{PLAN_LABEL[form.plan]}</span> plan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', color: '#374151' }}>
                    <div>Max Students: <strong>{typeof planMeta.maxS === 'number' ? planMeta.maxS.toLocaleString() : planMeta.maxS}</strong></div>
                    <div>Max Teachers: <strong>{typeof planMeta.maxT === 'number' ? planMeta.maxT.toLocaleString() : planMeta.maxT}</strong></div>
                    <div>Mobile App: <strong>{planMeta.mobile ? '✅ Enabled' : '❌ Disabled'}</strong></div>
                    <div>Rate: <strong>{planMeta[form.billing_cycle] ? `₹${planMeta[form.billing_cycle]}/student/mo` : 'Custom'}</strong></div>
                  </div>
                </div>

                {/* Billing cycle */}
                <Field label="Billing Cycle" auto hint="Monthly or annual — affects rate and renewal date">
                  <div style={s.cycleRow}>
                    <button type="button" style={s.cycleBtn(form.billing_cycle === 'monthly')} onClick={() => set('billing_cycle', 'monthly')}>
                      Monthly
                    </button>
                    <button type="button" style={s.cycleBtn(form.billing_cycle === 'annual')} onClick={() => set('billing_cycle', 'annual')}>
                      🎁 Annual (save ~17%)
                    </button>
                  </div>
                </Field>

                <div style={s.grid2}>
                  <Field label="Estimated Students" auto hint="Used to calculate first invoice amount">
                    <input style={s.input} type="number" min="0" value={form.estimated_students}
                      onChange={e => set('estimated_students', parseInt(e.target.value) || 0)} />
                  </Field>
                  <Field label="Trial Period (Days)" auto hint="0 = activate immediately without trial">
                    <input style={s.input} type="number" min="0" max="365" value={form.trial_days}
                      onChange={e => set('trial_days', parseInt(e.target.value) || 0)} />
                    <div style={s.hint}>
                      {parseInt(form.trial_days) > 0
                        ? `Trial ends: ${fmtDate(addDays(parseInt(form.trial_days)))}`
                        : '⚡ Activates immediately'}
                    </div>
                  </Field>
                </div>

                {/* Auto-populated fields summary */}
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '10px 14px', marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auto-Populated Subscription Fields</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12, color: '#374151' }}>
                    {[
                      ['Status', parseInt(form.trial_days) > 0 ? `Trial (${form.trial_days}d)` : 'Active'],
                      ['Billing Cycle', form.billing_cycle === 'annual' ? 'Annual' : 'Monthly'],
                      ['Mobile Access', planMeta.mobile ? 'Enabled' : 'Disabled'],
                      ['Monthly Amount', form.plan !== 'enterprise'
                        ? `₹${(planMeta[form.billing_cycle] || 0) * (form.estimated_students || 0)}`
                        : '—'],
                      ['Trial Ends', parseInt(form.trial_days) > 0 ? fmtDate(addDays(parseInt(form.trial_days))) : 'N/A'],
                      ['First Renewal', (() => {
                        const base = parseInt(form.trial_days) > 0 ? addDays(parseInt(form.trial_days)) : new Date()
                        return fmtDate(form.billing_cycle === 'annual'
                          ? new Date(base.getFullYear() + 1, base.getMonth(), base.getDate())
                          : new Date(base.getFullYear(), base.getMonth() + 1, base.getDate()))
                      })()],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', gap: 6 }}>
                        <span style={{ color: '#64748b', minWidth: 100 }}>{l}:</span>
                        <strong style={{ color: '#1e293b' }}>{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>{/* end formCol */}

          {/* ── Right: Preview ── */}
          <div>
            <SubscriptionPreview form={form} />
          </div>

        </div>{/* end body grid */}

        {/* Footer */}
        <div style={s.footer}>
          <button type="button" style={s.cancelBtn} onClick={() => navigate('/schools')}>Cancel</button>
          <button type="submit" style={s.submitBtn(saving)} disabled={saving}>
            {saving ? '⏳ Registering…' : '🏫 Register School'}
          </button>
        </div>

      </form>

      {/* Success modal */}
      {credData && (
        <CredModal
          data={credData}
          onDone={() => { setCredData(null); navigate('/schools') }}
        />
      )}

    </div>
  )
}

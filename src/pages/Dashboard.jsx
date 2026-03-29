import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { fmtDate } from '../utils/format'

const s = {
  h1:      { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  sub:     { fontSize: 13, color: '#64748b', margin: '0 0 24px' },

  // Hero row
  heroRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 24 },
  mrrBox:  { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 12, padding: 24, color: '#fff' },
  mrrSub:  { fontSize: 13, opacity: 0.8, margin: '0 0 6px' },
  mrrVal:  { fontSize: 34, fontWeight: 800, margin: '0 0 10px' },
  mrrFoot: { fontSize: 12, opacity: 0.75, margin: 0 },
  metaCard:(c) => ({ background: `${c}11`, border: `1px solid ${c}33`, borderRadius: 12, padding: 20 }),
  metaVal: (c) => ({ fontSize: 28, fontWeight: 700, color: c, margin: '6px 0 2px' }),
  metaLbl: { fontSize: 13, color: '#64748b', margin: 0 },
  metaSub: { fontSize: 11, color: '#94a3b8', margin: '4px 0 0' },

  // KPI grid
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 },
  kpi:     { background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  kpiVal:  { fontSize: 26, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  kpiLbl:  { fontSize: 12, color: '#64748b', margin: 0 },

  // Section card
  section: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  secH:    { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' },

  // Two-col layout
  twoCol:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },

  // Plan bar
  planRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  planLbl: { fontSize: 12, color: '#374151', width: 72, textTransform: 'capitalize', fontWeight: 600 },
  planBar: { flex: 1, height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  planFill:(c, pct) => ({ width: `${pct}%`, height: '100%', background: c, borderRadius: 99, transition: 'width 0.6s ease' }),
  planCnt: { fontSize: 12, color: '#64748b', width: 24, textAlign: 'right' },

  // Action item
  actionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, marginBottom: 8 },
  actionLbl:  { fontSize: 13, fontWeight: 600 },
  actionSub:  { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  actionBtn:  (c) => ({ padding: '5px 12px', background: c, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }),

  badge: (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c + '22', color: c }),
}

const PLAN_COLORS = { starter: '#3b82f6', pro: '#8b5cf6', premium: '#f59e0b', enterprise: '#10b981' }
const PLANS = ['enterprise', 'premium', 'pro', 'starter']

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('stats').then(r => setStats(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: '#64748b', padding: 24 }}>Loading…</p>
  if (!stats)  return <p style={{ color: '#ef4444', padding: 24 }}>Failed to load stats</p>

  const planDist = stats.plan_distribution || {}
  const maxPlan  = Math.max(1, ...Object.values(planDist).map(Number))
  const totalSubs = Object.values(planDist).reduce((a, b) => a + Number(b), 0) || 1

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: 2 }}>
      <h1 style={s.h1}>Dashboard</h1>
      <p style={s.sub}>{today}</p>

      {/* ── Hero: Revenue ── */}
      <div style={s.heroRow}>
        <div style={s.mrrBox}>
          <p style={s.mrrSub}>Monthly Recurring Revenue</p>
          <p style={s.mrrVal}>₹{(stats.mrr || 0).toLocaleString('en-IN')}</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <p style={s.mrrFoot}>ARR ≈ ₹{(stats.arr || 0).toLocaleString('en-IN')}</p>
            <p style={s.mrrFoot}>Avg ₹{(stats.avg_revenue_per_school || 0).toLocaleString('en-IN')} / school</p>
          </div>
        </div>
        <div style={s.metaCard('#22c55e')}>
          <p style={s.metaLbl}>Paid Schools</p>
          <p style={s.metaVal('#22c55e')}>{stats.paid_schools || 0}</p>
          <p style={s.metaSub}>{stats.conversion_rate || 0}% conversion rate</p>
        </div>
        <div style={s.metaCard('#f59e0b')}>
          <p style={s.metaLbl}>Action Needed</p>
          <p style={s.metaVal('#f59e0b')}>{(stats.overdue_schools || 0) + (stats.expiring_this_week || 0)}</p>
          <p style={s.metaSub}>{stats.overdue_schools || 0} overdue · {stats.expiring_this_week || 0} expiring</p>
        </div>
      </div>

      {/* ── KPI grid ── */}
      <div style={s.grid}>
        {[
          { label: 'Total Schools',   val: stats.total_schools,         color: '#1e293b' },
          { label: 'Active',          val: stats.active_schools,        color: '#22c55e' },
          { label: 'On Trial',        val: stats.trial_schools,         color: '#3b82f6' },
          { label: 'New This Month',  val: stats.new_schools_this_month,color: '#8b5cf6' },
          { label: 'Total Students',  val: stats.total_students,        color: '#1e293b' },
          { label: 'Total Teachers',  val: stats.total_teachers,        color: '#1e293b' },
          { label: 'Open Feedback',   val: stats.open_feedback,         color: '#ef4444' },
        ].map(({ label, val, color }) => (
          <div key={label} style={s.kpi}>
            <p style={{ ...s.kpiVal, color }}>{val ?? 0}</p>
            <p style={s.kpiLbl}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column: Plan Distribution + Action Items ── */}
      <div style={s.twoCol}>

        {/* Plan Distribution */}
        <div style={s.section}>
          <p style={s.secH}>Plan Distribution</p>
          {PLANS.map(plan => {
            const cnt = Number(planDist[plan] || 0)
            const pct = Math.round((cnt / totalSubs) * 100)
            return (
              <div key={plan} style={s.planRow}>
                <span style={s.planLbl}>{plan}</span>
                <div style={s.planBar}>
                  <div style={s.planFill(PLAN_COLORS[plan] || '#94a3b8', pct)} />
                </div>
                <span style={s.planCnt}>{cnt}</span>
              </div>
            )
          })}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>
            {totalSubs} total subscriptions
          </div>
        </div>

        {/* Action Items */}
        <div style={s.section}>
          <p style={s.secH}>Action Items</p>
          {stats.overdue_schools > 0 && (
            <div style={{ ...s.actionItem, background: '#fef2f2' }}>
              <div>
                <p style={{ ...s.actionLbl, color: '#ef4444' }}>{stats.overdue_schools} Overdue Schools</p>
                <p style={s.actionSub}>Subscriptions past renewal date</p>
              </div>
              <button style={s.actionBtn('#ef4444')} onClick={() => navigate('/subscriptions?status=overdue')}>View</button>
            </div>
          )}
          {stats.expiring_this_week > 0 && (
            <div style={{ ...s.actionItem, background: '#fffbeb' }}>
              <div>
                <p style={{ ...s.actionLbl, color: '#d97706' }}>{stats.expiring_this_week} Trials Expiring</p>
                <p style={s.actionSub}>Trial ends within 7 days</p>
              </div>
              <button style={s.actionBtn('#f59e0b')} onClick={() => navigate('/subscriptions?status=trial')}>View</button>
            </div>
          )}
          {stats.open_feedback > 0 && (
            <div style={{ ...s.actionItem, background: '#eff6ff' }}>
              <div>
                <p style={{ ...s.actionLbl, color: '#3b82f6' }}>{stats.open_feedback} Open Feedback</p>
                <p style={s.actionSub}>Awaiting response from team</p>
              </div>
              <button style={s.actionBtn('#3b82f6')} onClick={() => navigate('/feedback')}>View</button>
            </div>
          )}
          {stats.new_schools_this_month > 0 && (
            <div style={{ ...s.actionItem, background: '#f5f3ff' }}>
              <div>
                <p style={{ ...s.actionLbl, color: '#7c3aed' }}>{stats.new_schools_this_month} New This Month</p>
                <p style={s.actionSub}>Schools registered this month</p>
              </div>
              <button style={s.actionBtn('#7c3aed')} onClick={() => navigate('/schools')}>View</button>
            </div>
          )}
          {stats.overdue_schools === 0 && stats.expiring_this_week === 0 && stats.open_feedback === 0 && (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              No immediate actions required
            </p>
          )}
        </div>
      </div>

      {/* ── Grace Period Overdue Alert Panel ── */}
      {stats.grace_period_schools?.length > 0 && (
        <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:14,color:'#B91C1C',marginBottom:12}}>
            🚨 Overdue — Grace Period Active ({stats.grace_period_schools.length})
          </div>
          {stats.grace_period_schools.map((s, i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<stats.grace_period_schools.length-1?'1px solid #FEE2E2':'none'}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{s.school_name}</div>
                <div style={{fontSize:11,color:'#64748B'}}>Grace ends: {s.grace_ends} · {s.grace_days_left} days left</div>
              </div>
              <button onClick={() => {
                const msg = encodeURIComponent(`Hi ${s.school_name}! Your Vikashana subscription payment is overdue. Please pay within ${s.grace_days_left} days to avoid service interruption.`)
                window.open(`https://wa.me/91${s.school_phone}?text=${msg}`, '_blank')
              }} style={{background:'#EF4444',color:'#fff',border:'none',borderRadius:8,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                Send Reminder
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Expiring Trials Alert Panel ── */}
      {stats.expiring_trials?.length > 0 && (
        <div style={{ ...s.section, borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <p style={{ ...s.secH, color: '#d97706' }}>⚠️ Trials Expiring This Week ({stats.expiring_trials.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.expiring_trials.map(t => (
              <div key={t.school_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #fde68a' }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{t.school_name}</span>
                  <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                    {t.plan} · Ends {t.trial_ends_at}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.days_left <= 2 ? '#ef4444' : '#d97706', marginLeft: 8 }}>
                    {t.days_left}d left
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {t.school_phone && (
                    <a
                      href={`https://wa.me/91${t.school_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! Your Vikashana trial (${t.plan} plan) ends on ${t.trial_ends_at}. Please let us know if you'd like to continue — we can generate an invoice for you. Team Vikashana`)}`}
                      target="_blank" rel="noreferrer"
                      style={{ padding: '5px 12px', background: '#25d366', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      WhatsApp
                    </a>
                  )}
                  <button
                    style={{ padding: '5px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate(`/invoices?generate=${t.school_id}`)}>
                    Generate Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Subscription Status Summary ── */}
      <div style={s.section}>
        <p style={s.secH}>Subscription Health</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Active',    val: stats.active_schools,  color: '#22c55e', desc: 'Paid & current' },
            { label: 'Trial',     val: stats.trial_schools,   color: '#3b82f6', desc: 'In trial period' },
            { label: 'Overdue',   val: stats.overdue_schools, color: '#ef4444', desc: 'Payment overdue' },
          ].map(({ label, val, color, desc }) => {
            const total = (stats.active_schools || 0) + (stats.trial_schools || 0) + (stats.overdue_schools || 0)
            const pct   = total > 0 ? Math.round((val / total) * 100) : 0
            return (
              <div key={label} style={{ flex: 1, minWidth: 140, background: color + '08', border: `1px solid ${color}22`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={s.badge(color)}>{label}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}%</span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 700, color, margin: '8px 0 2px' }}>{val ?? 0}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{desc}</p>
                <div style={{ marginTop: 8, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

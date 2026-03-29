export const fmtDate = (d) => {
    if (!d) return '—'
    try {
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    } catch { return d }
}

export const fmtCurrency = (n) =>
    n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`

export const fmtPlan = (p) => ({
    starter:    { label: 'Starter',    color: '#3B82F6' },
    pro:        { label: 'Pro',        color: '#6366F1' },
    premium:    { label: 'Premium',    color: '#8B5CF6' },
    enterprise: { label: 'Enterprise', color: '#F59E0B' },
}[p] || { label: p, color: '#94A3B8' })

export const fmtStatus = (s) => ({
    trial:     { label: 'Trial',     color: '#F59E0B' },
    active:    { label: 'Active',    color: '#10B981' },
    overdue:   { label: 'Overdue',   color: '#EF4444' },
    expired:   { label: 'Expired',   color: '#EF4444' },
    cancelled: { label: 'Cancelled', color: '#94A3B8' },
    draft:     { label: 'Draft',     color: '#94A3B8' },
    sent:      { label: 'Sent',      color: '#3B82F6' },
    partial:   { label: 'Partial',   color: '#F59E0B' },
    paid:      { label: 'Paid',      color: '#10B981' },
}[s] || { label: s, color: '#94A3B8' })

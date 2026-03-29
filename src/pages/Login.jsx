import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const s = {
  page:   { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b' },
  card:   { background: '#fff', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo:   { textAlign: 'center', marginBottom: 32 },
  logoH:  { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  logoS:  { fontSize: 13, color: '#64748b', margin: '4px 0 0' },
  label:  { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input:  { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btn:    { width: '100%', padding: 12, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  err:    { background: '#fee2e2', color: '#dc2626', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  group:  { marginBottom: 20 },
}

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }   = useAuthStore()
  const navigate    = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== 'super_admin') {
        setError('Access denied. Super admin only.')
        useAuthStore.getState().logout()
        return
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <img src="/logo.svg" alt="Vikashana" style={{ height:72, width:'auto', marginBottom:10 }} />
          <p style={s.logoS}>Super Admin Portal</p>
        </div>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={s.group}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

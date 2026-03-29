import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Schools from './pages/Schools'
import SchoolDetail from './pages/SchoolDetail'
import RegisterSchool from './pages/RegisterSchool'
import EditSchool from './pages/EditSchool'
import Subscriptions from './pages/Subscriptions'
import SubscriptionDetail from './pages/SubscriptionDetail'
import Payments from './pages/Payments'
import Invoices from './pages/Invoices'
import Feedback from './pages/Feedback'
import Announcements from './pages/Announcements'
import Team from './pages/Team'

function RequireAuth({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/schools" element={<RequireAuth><Schools /></RequireAuth>} />
        <Route path="/schools/register" element={<RequireAuth><RegisterSchool /></RequireAuth>} />
        <Route path="/schools/:id/edit" element={<RequireAuth><EditSchool /></RequireAuth>} />
        <Route path="/schools/:id" element={<RequireAuth><SchoolDetail /></RequireAuth>} />
        <Route path="/subscriptions" element={<RequireAuth><Subscriptions /></RequireAuth>} />
        <Route path="/subscriptions/:id" element={<RequireAuth><SubscriptionDetail /></RequireAuth>} />
        <Route path="/payments" element={<RequireAuth><Payments /></RequireAuth>} />
        <Route path="/invoices" element={<RequireAuth><Invoices /></RequireAuth>} />
        <Route path="/feedback" element={<RequireAuth><Feedback /></RequireAuth>} />
        <Route path="/announcements" element={<RequireAuth><Announcements /></RequireAuth>} />
        <Route path="/team" element={<RequireAuth><Team /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

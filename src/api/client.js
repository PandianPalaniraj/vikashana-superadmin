import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8001/api/superadmin/v1/',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('superadmin_token')
      localStorage.removeItem('superadmin_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

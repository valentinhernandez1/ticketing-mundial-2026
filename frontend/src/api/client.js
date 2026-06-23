import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    const status = err.response?.status
    // 401 = token expirado/inválido (con el fix de SecurityConfig)
    // 403 sin token = sesión perdida (fallback por si el backend viejo devuelve 403)
    if (status === 401 || (status === 403 && !localStorage.getItem('token'))) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL + '/api',
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If token expires, clear storage and reload to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cw_token')
      localStorage.removeItem('cw_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
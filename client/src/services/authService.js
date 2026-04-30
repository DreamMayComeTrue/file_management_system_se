import api from './api.js'

export const authService = {
  login:          (data)  => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)  => api.post('/auth/reset-password', data),
  changePassword: (data)  => api.put('/auth/change-password', data),
}

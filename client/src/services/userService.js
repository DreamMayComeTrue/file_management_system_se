import api from './api.js'

export const userService = {
  getLecturers:    ()     => api.get('/users/lecturers'),
  createLecturer:  (data) => api.post('/users/lecturers', data),
  deleteLecturer:  (id)   => api.delete(`/users/lecturers/${id}`),

  getAuditors:     ()     => api.get('/users/auditors'),
  createAuditor:   (data) => api.post('/users/auditors', data),
  deleteAuditor:   (id)   => api.delete(`/users/auditors/${id}`),
}

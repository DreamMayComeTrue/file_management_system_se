import api from './api.js'

export const userService = {
  getLecturers:    ()     => api.get('/users/lecturers'),
  createLecturer:  (data) => api.post('/users/lecturers', data),
  deleteLecturer:  (id)   => api.delete(`/users/lecturers/${id}`),
}

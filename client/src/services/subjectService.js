import api from './api.js'

export const subjectService = {
  getMySubjects:   ()         => api.get('/subjects/mine'),
  getAllSubjects:   ()         => api.get('/subjects'),
  getSubject:      (id)       => api.get(`/subjects/${id}`),
  createSubject:   (data)     => api.post('/subjects', data),
  createSection:   (subjectId, data) => api.post(`/subjects/${subjectId}/sections`, data),
  getSections:     (subjectId)       => api.get(`/subjects/${subjectId}/sections`),
  getSection:      (subjectId, sectionId) => api.get(`/subjects/${subjectId}/sections/${sectionId}`),
  setDeadline:     (sectionId, data) => api.put(`/sections/${sectionId}/deadline`, data),
  getTemplate:     ()         => api.get('/subfolder-template'),
  saveTemplate:    (data)     => api.put('/subfolder-template', data),
  addSubfolder:    (sectionId, data) => api.post(`/sections/${sectionId}/subfolders`, data),
  removeSubfolder: (subfolderId)     => api.delete(`/subfolders/${subfolderId}`),
}

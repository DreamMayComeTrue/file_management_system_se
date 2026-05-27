import api from './api.js'

export const dashboardService = {
  getMyDashboard:       ()           => api.get('/dashboard/mine'),
  getProgrammeDashboard:()           => api.get('/dashboard/programme'),
  getComments:          (sectionId)                  => api.get(`/sections/${sectionId}/comments`),
  addComment:           (sectionId, text)            => api.post(`/sections/${sectionId}/comments`, { text }),
  deleteComment:        (sectionId, commentId)       => api.delete(`/sections/${sectionId}/comments/${commentId}`),
  exportReport:         (params)     => api.get('/dashboard/export', { params, responseType: 'blob' }),
  getAuditLog:          (params)     => api.get('/audit-log', { params }),
}

import api from './api.js'

export const dashboardService = {
  getMyDashboard:       ()           => api.get('/dashboard/mine'),
  getProgrammeDashboard:()           => api.get('/dashboard/programme'),
  updateComment:        (sectionId, text) => api.put(`/sections/${sectionId}/comment`, { text }),
  exportReport:         (params)     => api.get('/dashboard/export', { params, responseType: 'blob' }),
  getAuditLog:          (params)     => api.get('/audit-log', { params }),
}

import api from './api.js'

export const fileService = {
  upload:         (subfolderId, formData) =>
    api.post(`/subfolders/${subfolderId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadVersion:  (fileId, formData) =>
    api.post(`/files/${fileId}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getVersions:    (fileId)      => api.get(`/files/${fileId}/versions`),
  restoreVersion: (fileId, versionId) => api.put(`/files/${fileId}/versions/${versionId}/restore`),
  deleteFile:     (fileId)      => api.delete(`/files/${fileId}`),
}

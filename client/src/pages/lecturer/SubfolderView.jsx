// UC-07 Upload File | UC-08 New Version | UC-09 Version History | UC-10 Restore | UC-11 Delete
import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import {
  ArrowLeft, Upload, File, Trash2, History, CheckSquare, XSquare,
  RefreshCw, ChevronDown, ChevronRight, AlertTriangle, Calendar, Download
} from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import { fileService } from '../../services/fileService.js'
import Spinner from '../../components/common/Spinner.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

/* ── helpers ── */
function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)      return `${bytes} B`
  if (bytes < 1024**2)   return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024**2).toFixed(1)} MB`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/* ── Upload dropzone ── */
function DropUpload({ onFile, uploading }) {
  const onDrop = useCallback(files => { if (files[0]) onFile(files[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled: uploading })
  return (
    <div {...getRootProps()} className={`dropzone${isDragActive ? ' drag-over' : ''}`} style={{ padding: '1.25rem' }}>
      <input {...getInputProps()} />
      <div className="dropzone-icon"><Upload size={22} /></div>
      <p className="dropzone-text">
        {uploading ? 'Uploading…' : <><strong>Click to upload</strong> or drag a file here</>}
      </p>
      <p className="dropzone-hint">Any file type accepted</p>
    </div>
  )
}

/* ── Version history modal ── */
function VersionModal({ open, onClose, file, onRestore }) {
  const { data, isLoading } = useQuery({
    queryKey: ['versions', file?.id],
    queryFn:  () => fileService.getVersions(file.id).then(r => r.data),
    enabled: open && !!file?.id,
  })

  return (
    <Modal open={open} onClose={onClose} title={`Version History — ${file?.fileName ?? ''}`} size="modal-lg">
      {isLoading ? <Spinner center /> : (
        <div>
          {(!data || data.length === 0) ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No versions found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Uploaded</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((v, i) => (
                    <tr key={v.id}>
                      <td>v{data.length - i}</td>
                      <td>{fmtDate(v.uploadedAt)}</td>
                      <td>{fmt(v.fileSize)}</td>
                      <td>{v.uploadedByName ?? '—'}</td>
                      <td>
                        {i > 0 && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => onRestore(file.id, v.id)}
                          >
                            <RefreshCw size={13} /> Restore
                          </button>
                        )}
                        {i === 0 && <span className="badge badge-complete">Current</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

/* ── Subfolder row ── */
function SubfolderRow({ sf, subjectId, sectionId, onRefresh, canComplete }) {
  const [open, setOpen]         = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newVersionTarget, setNewVersionTarget] = useState(null) // file to upload new version for
  const [versionModal, setVersionModal] = useState(null)         // file to show versions for
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const qc = useQueryClient()
  const { user } = useAuth()

  const isLecturer = user?.role === 'Lecturer' || user?.role === 'PIC'

  async function handleUpload(file) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await fileService.upload(sf.id, fd)
      toast.success(`"${file.name}" uploaded.`)
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Upload failed.')
    } finally { setUploading(false) }
  }

  async function handleNewVersion(file) {
    if (!newVersionTarget) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await fileService.uploadVersion(newVersionTarget.id, fd)
      toast.success('New version uploaded.')
      setNewVersionTarget(null)
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Version upload failed.')
    } finally { setUploading(false) }
  }

  async function handleRestore(fileId, versionId) {
    try {
      await fileService.restoreVersion(fileId, versionId)
      toast.success('Version restored.')
      qc.invalidateQueries(['versions', fileId])
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Restore failed.')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await fileService.deleteFile(deleteTarget.id)
      toast.success(`"${deleteTarget.fileName}" deleted.`)
      setDeleteTarget(null)
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Delete failed.')
    }
  }

  async function handleMarkComplete() {
    try {
      await fileService.markComplete(sf.id)
      toast.success(`"${sf.name}" marked as complete.`)
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to mark complete.')
    }
  }

  async function handleMarkIncomplete() {
    try {
      await fileService.markIncomplete(sf.id)
      toast.success(`"${sf.name}" marked as incomplete.`)
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to mark incomplete.')
    }
  }

  return (
    <>
      <div className={`subfolder-item${sf.isCompleted ? ' is-complete' : ''}`}>
        {/* Header */}
        <div className="subfolder-header" onClick={() => setOpen(v => !v)}>
          <div className="subfolder-name">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {sf.name}
          </div>
          <div className="subfolder-meta">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {sf.files?.length ?? 0} file{sf.files?.length !== 1 ? 's' : ''}
            </span>
            <StatusBadge status={sf.isCompleted ? 'complete' : 'incomplete'} />
          </div>
        </div>

        {/* Body */}
        {open && (
          <div className="subfolder-body">
            {/* File list */}
            {sf.files?.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '0.75rem 0' }}>
                No files uploaded yet.
              </p>
            ) : (
              sf.files.map(f => (
                <div key={f.id} className="file-row">
                  <File size={16} className="file-icon" />
                  <div className="file-name" title={f.fileName}>{f.fileName}</div>
                  <span className="file-meta">{fmt(f.fileSize)}</span>
                  <span className="file-meta">{fmtDate(f.uploadedAt)}</span>
                  <div className="file-actions">
                    {/* Download */}
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-icon"
                      title="Download"
                    >
                      <Download size={14} />
                    </a>
                    {/* Upload new version */}
                    {isLecturer && (
                      <button
                        className="btn btn-icon"
                        title="Upload new version"
                        onClick={() => setNewVersionTarget(f)}
                      >
                        <Upload size={14} />
                      </button>
                    )}
                    {/* Version history */}
                    <button
                      className="btn btn-icon"
                      title="Version history"
                      onClick={() => setVersionModal(f)}
                    >
                      <History size={14} />
                    </button>
                    {/* Delete */}
                    {isLecturer && (
                      <button
                        className="btn btn-icon"
                        title="Delete file"
                        onClick={() => setDeleteTarget(f)}
                        style={{ color: 'var(--color-incomplete)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Upload area */}
            {isLecturer && !sf.isCompleted && (
              <div style={{ marginTop: '0.75rem' }}>
                <DropUpload onFile={handleUpload} uploading={uploading} />
              </div>
            )}

            {/* New-version dropzone */}
            {newVersionTarget && (
              <Modal
                open={!!newVersionTarget}
                onClose={() => setNewVersionTarget(null)}
                title={`Upload New Version — ${newVersionTarget.fileName}`}
              >
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  This will add a new version. The existing file is preserved in version history.
                </p>
                <DropUpload onFile={handleNewVersion} uploading={uploading} />
              </Modal>
            )}

            {/* Actions */}
            {isLecturer && (
              <div className="subfolder-actions">
                {!sf.isCompleted ? (
                  <button
                    className="btn btn-success btn-sm"
                    disabled={!sf.files?.length || !canComplete}
                    onClick={handleMarkComplete}
                    title={!sf.files?.length ? 'Upload at least one file first' : ''}
                  >
                    <CheckSquare size={14} /> Mark as Complete
                  </button>
                ) : (
                  <button className="btn btn-danger-outline btn-sm" onClick={handleMarkIncomplete}>
                    <XSquare size={14} /> Mark as Incomplete
                  </button>
                )}
                {sf.isCompleted && sf.completedByName && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Completed by {sf.completedByName} · {fmtDate(sf.completedAt)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Version history modal */}
      <VersionModal
        open={!!versionModal}
        onClose={() => setVersionModal(null)}
        file={versionModal}
        onRestore={(fid, vid) => { handleRestore(fid, vid); setVersionModal(null) }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteTarget?.fileName}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </>
  )
}

/* ── Main page ── */
export default function SubfolderView() {
  const { subjectId, sectionId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sectionDetail', subjectId, sectionId],
    queryFn:  () => subjectService.getSection(subjectId, sectionId).then(r => r.data),
  })

  if (isLoading) return <Spinner center size="lg" />
  if (isError)   return (
    <div className="page-container">
      <div className="alert alert-error"><AlertTriangle size={16} /> Failed to load section data.</div>
    </div>
  )

  const section  = data ?? {}
  const subject  = section.subject ?? {}
  const subfolders = section.subfolders ?? []
  const deadline = section.deadline ? new Date(section.deadline) : null
  const isOverdue = deadline && deadline < new Date()

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/my-subjects')}>My Subjects</span>
        <span className="breadcrumb-sep">/</span>
        <span>{subject.code}</span>
        <span className="breadcrumb-sep">/</span>
        <span>Section {section.sectionNumber}</span>
      </div>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            {subject.code} — Section {section.sectionNumber}
          </h1>
          <p className="page-subtitle">{subject.name} · {subject.programme}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {deadline && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.8125rem',
              color: isOverdue ? 'var(--color-incomplete)' : 'var(--color-text-muted)',
              background: isOverdue ? 'var(--color-incomplete-bg)' : 'var(--color-surface-alt)',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${isOverdue ? 'rgba(192,57,43,0.3)' : 'var(--color-border)'}`,
            }}>
              <Calendar size={13} />
              {isOverdue ? 'Overdue: ' : 'Deadline: '}
              {deadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          The deadline for this section has passed. Please contact your PIC if you need an extension.
        </div>
      )}

      {/* Subfolders */}
      {subfolders.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No subfolders yet"
            description="The PIC hasn't set up subfolders for this section yet."
          />
        </div>
      ) : (
        <div>
          {/* Progress bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Completion progress</span>
              <span style={{ fontWeight: 600 }}>
                {subfolders.filter(s => s.isCompleted).length} / {subfolders.length}
              </span>
            </div>
            <div className="progress">
              <div
                className={`progress-bar${subfolders.every(s => s.isCompleted) ? ' complete' : ''}`}
                style={{ width: `${(subfolders.filter(s => s.isCompleted).length / subfolders.length) * 100}%` }}
              />
            </div>
          </div>

          {subfolders.map(sf => (
            <SubfolderRow
              key={sf.id}
              sf={sf}
              subjectId={subjectId}
              sectionId={sectionId}
              onRefresh={refetch}
              canComplete={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

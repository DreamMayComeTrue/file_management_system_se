// FR-08 — Section Detail (PIC view: manage subfolders, see files, check completion)
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  FolderKanban, Plus, Trash2, Calendar, ChevronDown, ChevronRight,
  AlertTriangle, CheckSquare, XCircle, File, Download, Clock, Eye
} from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import { fileService } from '../../services/fileService.js'
import { dashboardService } from '../../services/dashboardService.js'
import Spinner from '../../components/common/Spinner.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import SectionComment from '../../components/common/SectionComment.jsx'

function fmt(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)    return `${bytes} B`
  if (bytes < 1024**2) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1024**2).toFixed(1)} MB`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
/* Download a file with its real name (Cloudinary URLs ignore the <a download> attr cross-origin) */
async function downloadFile(url, fileName) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = fileName || 'download'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objUrl)
  } catch {
    window.open(url, '_blank')   // fallback: open in a new tab
  }
}
/* Open a file preview in a new tab — forces the correct MIME so PDFs/images render inline */
async function previewFile(url, fileName) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const ext  = (fileName || '').split('.').pop().toLowerCase()
    const mimeByExt = {
      pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg',
      jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', txt: 'text/plain',
    }
    const mime   = mimeByExt[ext] || blob.type || 'application/octet-stream'
    const objUrl = URL.createObjectURL(new Blob([blob], { type: mime }))
    const win    = window.open(objUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(objUrl), 60000)
    if (!win) URL.revokeObjectURL(objUrl)
  } catch {
    window.open(url, '_blank')
  }
}

function SubfolderRow({ sf, onRemove, onReject, onRefresh }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`subfolder-item${sf.isCompleted ? ' is-complete' : ''}`}>
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
          {!!sf.isCompleted && (
            <button
              className="btn btn-sm"
              title="Reject completion: revert subfolder to incomplete with a reason"
              onClick={(e) => { e.stopPropagation(); onReject(sf) }}
              style={{
                color: 'var(--color-incomplete)',
                border: '1px solid var(--color-incomplete)',
                background: 'transparent',
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              }}
            >
              <XCircle size={13} /> Reject
            </button>
          )}
          {!sf.files?.length && (
            <button
              className="btn btn-icon btn-sm"
              title="Remove subfolder"
              onClick={(e) => { e.stopPropagation(); onRemove(sf) }}
              style={{ color: 'var(--color-incomplete)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="subfolder-body">
          {!!sf.isCompleted && sf.completedByName && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-complete)', marginBottom: '0.625rem' }}>
              <CheckSquare size={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
              Completed by {sf.completedByName} · {fmtDate(sf.completedAt)}
            </div>
          )}
          {!sf.files?.length ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '0.5rem 0' }}>No files uploaded.</p>
          ) : (
            sf.files.map(f => (
              <div key={f.id} className="file-row">
                <File size={15} className="file-icon" />
                <div className="file-name" title={f.fileName}>{f.fileName}</div>
                <span className="file-meta">{fmt(f.fileSize)}</span>
                <span className="file-meta">{fmtDate(f.uploadedAt)}</span>
                <div className="file-actions">
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Preview"
                    onClick={() => previewFile(f.fileUrl, f.fileName)}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon"
                    title="Download"
                    onClick={() => downloadFile(f.fileUrl, f.fileName)}
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function SectionDetail() {
  const { subjectId, sectionId } = useParams()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [addModal, setAddModal]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [removeTarget, setRemoveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sectionDetail', subjectId, sectionId],
    queryFn:  () => subjectService.getSection(subjectId, sectionId).then(r => r.data),
  })

  const addMut = useMutation({
    mutationFn: () => subjectService.addSubfolder(sectionId, { name: newName.trim() }),
    onSuccess: () => {
      toast.success('Subfolder added.')
      setAddModal(false)
      setNewName('')
      refetch()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to add subfolder.'),
  })

  const removeMut = useMutation({
    mutationFn: () => subjectService.removeSubfolder(removeTarget.id),
    onSuccess: () => {
      toast.success(`"${removeTarget.name}" removed.`)
      setRemoveTarget(null)
      refetch()
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Cannot remove, subfolder may have files.'),
  })

  // Reject a completed subfolder: revert it to incomplete and post a comment
  // explaining why, so the lecturer can see the reason in Section Notes.
  const rejectMut = useMutation({
    mutationFn: async () => {
      const reason = rejectReason.trim()
      const name   = rejectTarget?.name ?? 'subfolder'
      await fileService.markIncomplete(rejectTarget.id)
      await dashboardService.addComment(
        sectionId,
        `[Rejected: "${name}"] ${reason}`
      )
    },
    onSuccess: () => {
      toast.success(`"${rejectTarget?.name}" rejected. Lecturer can see the reason in Section Notes.`)
      setRejectTarget(null)
      setRejectReason('')
      refetch()
      qc.invalidateQueries(['sectionComments', sectionId])
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Failed to reject subfolder.')
    },
  })

  if (isLoading) return <Spinner center size="lg" />
  if (isError)   return (
    <div className="page-container">
      <div className="alert alert-error"><AlertTriangle size={16} /> Failed to load section.</div>
    </div>
  )

  const section    = data ?? {}
  const subject    = section.subject ?? {}
  const subfolders = section.subfolders ?? []
  const deadline   = section.deadline ? new Date(section.deadline) : null
  const isOverdue  = deadline && deadline < new Date()

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/subjects-sections')}>Subjects &amp; Sections</span>
        <span className="breadcrumb-sep">/</span>
        <span>{subject.code}</span>
        <span className="breadcrumb-sep">/</span>
        <span>Section {section.sectionNumber}</span>
      </div>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{subject.code} : Section {section.sectionNumber}</h1>

        </div>
        <div className="card-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/set-deadline/${sectionId}`)}
          >
            <Calendar size={13} /> {deadline ? 'Extend Deadline' : 'Set Deadline'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>
            <Plus size={13} /> Add Subfolder
          </button>
        </div>
      </div>

      {/* Deadline chip */}
      {deadline && (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.8125rem',
            color: isOverdue ? 'var(--color-incomplete)' : 'var(--color-text-muted)',
            background: isOverdue ? 'var(--color-incomplete-bg)' : 'var(--color-surface-alt)',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${isOverdue ? 'rgba(192,57,43,0.3)' : 'var(--color-border)'}`,
          }}>
            <Calendar size={13} />
            {isOverdue ? 'Overdue: ' : 'Deadline: '}
            {deadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      )}

      {/* Progress summary */}
      {subfolders.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Completion</span>
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
      )}

      {/* Section Notes (comment) */}
      <SectionComment sectionId={sectionId} />

      {/* Subfolder list */}
      {subfolders.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderKanban}
            title="No subfolders"
            description="Add subfolders manually or set up the subfolder template."
            action={
              <button className="btn btn-primary" onClick={() => setAddModal(true)}>
                <Plus size={14} /> Add Subfolder
              </button>
            }
          />
        </div>
      ) : (
        subfolders.map(sf => (
          <SubfolderRow
            key={sf.id}
            sf={sf}
            onRemove={setRemoveTarget}
            onReject={setRejectTarget}
            onRefresh={refetch}
          />
        ))
      )}

      {/* Add subfolder modal */}
      <Modal
        open={addModal}
        onClose={() => { setAddModal(false); setNewName('') }}
        title="Add Subfolder"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setAddModal(false); setNewName('') }}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={!newName.trim() || addMut.isPending}
              onClick={() => addMut.mutate()}
            >
              {addMut.isPending ? <><Spinner size="sm" /> Adding…</> : 'Add'}
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label form-label-required">Subfolder Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Assessment 1"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newName.trim() && addMut.mutate()}
            autoFocus
          />
        </div>
      </Modal>

      {/* Remove confirm */}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeMut.mutate()}
        title="Remove Subfolder"
        message={`Remove "${removeTarget?.name}"? This cannot be undone. Only subfolders with no files can be removed.`}
        confirmLabel="Remove"
        danger
        loading={removeMut.isPending}
      />

      {/* Reject completion modal — PIC reverts a completed subfolder + posts reason */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason('') }}
        title={`Reject Completion: ${rejectTarget?.name ?? ''}`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => { setRejectTarget(null); setRejectReason('') }}
              disabled={rejectMut.isPending}
            >Cancel</button>
            <button
              className="btn btn-danger"
              disabled={!rejectReason.trim() || rejectMut.isPending}
              onClick={() => rejectMut.mutate()}
            >
              {rejectMut.isPending
                ? <><Spinner size="sm" /> Rejecting…</>
                : <><XCircle size={14} /> Reject & Post Note</>}
            </button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 0 }}>
          This will revert <strong style={{ color: 'var(--color-text)' }}>"{rejectTarget?.name}"</strong> back to
          incomplete and post your reason as a Section Note so the lecturer can see it.
        </p>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label form-label-required">Reason for rejection</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="e.g. Lecture notes missing for week 4; please re-upload before marking complete."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  )
}

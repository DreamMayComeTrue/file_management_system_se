// FR-08 — Section Detail (PIC view: manage subfolders, see files, check completion)
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  FolderKanban, Plus, Trash2, Calendar, ChevronDown, ChevronRight,
  AlertTriangle, CheckSquare, File, Download, Clock
} from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import Spinner from '../../components/common/Spinner.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

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

function SubfolderRow({ sf, onRemove, onRefresh }) {
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
          {sf.isCompleted && sf.completedByName && (
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
                  <a href={f.fileUrl} target="_blank" rel="noreferrer" className="btn btn-icon" title="Download">
                    <Download size={13} />
                  </a>
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
    onError: (err) => toast.error(err.response?.data?.message ?? 'Cannot remove — subfolder may have files.'),
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
          <h1 className="page-title">{subject.code} — Section {section.sectionNumber}</h1>

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
    </div>
  )
}

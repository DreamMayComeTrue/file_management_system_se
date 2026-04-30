// FR-08 — Subfolder Template Management
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderTree, Plus, Trash2, GripVertical, Save, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'react-toastify'
import { subjectService } from '../../services/subjectService.js'
import Spinner from '../../components/common/Spinner.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'

export default function SubfolderTemplate() {
  const qc = useQueryClient()
  const [names, setNames]           = useState([])
  const [newName, setNewName]       = useState('')
  const [confirmSave, setConfirmSave] = useState(false)
  const [dirty, setDirty]           = useState(false)

  const { data: template = [], isLoading } = useQuery({
    queryKey: ['subfolderTemplate'],
    queryFn:  () => subjectService.getTemplate().then(r => r.data),
  })

  useEffect(() => {
    setNames(template.map(t => t.name))
    setDirty(false)
  }, [template])

  const saveMut = useMutation({
    mutationFn: () => subjectService.saveTemplate({ names }),
    onSuccess: () => {
      toast.success('Template saved. New sections will use this template.')
      qc.invalidateQueries(['subfolderTemplate'])
      setDirty(false)
      setConfirmSave(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Save failed.')
      setConfirmSave(false)
    },
  })

  function addName() {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (names.includes(trimmed)) { toast.error('That name already exists.'); return }
    setNames(n => [...n, trimmed])
    setNewName('')
    setDirty(true)
  }

  function removeName(idx) {
    setNames(n => n.filter((_, i) => i !== idx))
    setDirty(true)
  }

  function moveName(idx, dir) {
    setNames(n => {
      const arr = [...n]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr
    })
    setDirty(true)
  }

  if (isLoading) return <Spinner center size="lg" />

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderTree size={22} />
          Subfolder Template
        </h1>
        <p className="page-subtitle">
          Define the default subfolders auto-created when a new section is added.
        </p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
        <Info size={16} style={{ flexShrink: 0 }} />
        Changes here only affect <strong>new</strong> sections. Existing sections are not modified.
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><FolderTree size={16} /> Template Subfolders ({names.length})</span>
          {dirty && (
            <button className="btn btn-primary btn-sm" onClick={() => setConfirmSave(true)}>
              <Save size={13} /> Save Changes
            </button>
          )}
        </div>
        <div className="card-body">
          {/* Add new */}
          <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="New subfolder name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addName())}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={addName} disabled={!newName.trim()}>
              <Plus size={15} /> Add
            </button>
          </div>

          {/* List */}
          {names.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
              No subfolders defined yet. Add at least one above.
            </p>
          ) : (
            <div>
              {names.map((name, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.625rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.375rem',
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <GripVertical size={15} style={{ color: 'var(--color-border-strong)', cursor: 'grab', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{name}</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-icon"
                      disabled={idx === 0}
                      onClick={() => moveName(idx, -1)}
                      title="Move up"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem' }}
                    >↑</button>
                    <button
                      className="btn btn-icon"
                      disabled={idx === names.length - 1}
                      onClick={() => moveName(idx, 1)}
                      title="Move down"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem' }}
                    >↓</button>
                    <button
                      className="btn btn-icon"
                      onClick={() => removeName(idx)}
                      title="Remove"
                      style={{ color: 'var(--color-incomplete)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {dirty && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setConfirmSave(true)} disabled={saveMut.isPending}>
              {saveMut.isPending ? <><Spinner size="sm" /> Saving…</> : <><Save size={14} /> Save Template</>}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={() => saveMut.mutate()}
        title="Save Template"
        message="Save these subfolder names as the template? New sections created after this will automatically get these subfolders."
        confirmLabel="Save"
        loading={saveMut.isPending}
      />
    </div>
  )
}

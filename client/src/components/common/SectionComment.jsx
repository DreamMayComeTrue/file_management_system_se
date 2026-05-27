// Section Notes — multi-comment, multi-role.
// PIC, Lecturer and Audit can each post comments. Each user can delete their
// own. Comments from other roles render as read-only messages.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, Trash2, MessageCircleOff } from 'lucide-react'
import { toast } from 'react-toastify'
import { dashboardService } from '../../services/dashboardService.js'
import Spinner from './Spinner.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const ROLE_STYLE = {
  PIC:      { bg: '#3a0010', fg: '#e8839b', badge: 'rgba(215,41,139,0.18)', badgeText: '#D7298B' },
  Lecturer: { bg: '#001f3a', fg: '#83b6e8', badge: 'rgba(96,165,250,0.15)', badgeText: '#60A5FA' },
  Audit:    { bg: '#3a3000', fg: '#c9a227', badge: 'rgba(212,162,39,0.15)', badgeText: '#D4A227' },
}

export default function SectionComment({ sectionId }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const canPost = user?.role === 'Lecturer' || user?.role === 'PIC' || user?.role === 'Audit'

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['sectionComments', sectionId],
    queryFn:  () => dashboardService.getComments(sectionId).then(r => r.data),
    enabled:  !!sectionId,
  })

  const [draft, setDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)   // the comment object

  const addMut = useMutation({
    mutationFn: () => dashboardService.addComment(sectionId, draft.trim()),
    onSuccess:  () => {
      toast.success('Note posted.')
      setDraft('')
      qc.invalidateQueries(['sectionComments', sectionId])
    },
    onError:    (e) => toast.error(e.response?.data?.message ?? 'Failed to post note.'),
  })

  const delMut = useMutation({
    mutationFn: (commentId) => dashboardService.deleteComment(sectionId, commentId),
    onSuccess:  () => {
      toast.success('Note deleted.')
      setDeleteTarget(null)
      qc.invalidateQueries(['sectionComments', sectionId])
    },
    onError:    (e) => {
      toast.error(e.response?.data?.message ?? 'Failed to delete.')
      setDeleteTarget(null)
    },
  })

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="card-header">
        <span className="card-title">
          <MessageSquare size={15} /> Section Notes ({comments.length})
        </span>
      </div>
      <div className="card-body">
        {isLoading ? (
          <Spinner />
        ) : comments.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            color: 'var(--color-text-muted)', fontSize: '0.875rem', fontStyle: 'italic',
            padding: '0.5rem 0 1rem',
          }}>
            <MessageCircleOff size={15} />
            No notes yet. Be the first to leave one below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {comments.map((c) => {
              const style = ROLE_STYLE[c.authorRole] || ROLE_STYLE.Lecturer
              const mine  = c.authorId === user?.id
              return (
                <div key={c.id} style={{
                  display: 'flex', gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  {/* avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: style.bg, color: style.fg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials(c.authorName)}
                  </div>
                  {/* body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      flexWrap: 'wrap', marginBottom: '0.3rem',
                    }}>
                      <strong style={{ fontSize: '0.875rem' }}>{c.authorName ?? 'Unknown'}</strong>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em',
                        padding: '0.15rem 0.5rem', borderRadius: '999px',
                        background: style.badge, color: style.badgeText,
                        border: `1px solid ${style.badgeText}33`,
                      }}>
                        {(c.authorRole ?? '').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        · {fmtDate(c.updatedAt)}
                      </span>
                      {mine && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600,
                          color: 'var(--color-text-muted)',
                          marginLeft: '0.25rem',
                        }}>(you)</span>
                      )}
                    </div>
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.9rem',
                      color: 'var(--color-text)',
                      lineHeight: 1.5,
                    }}>{c.body}</div>
                  </div>
                  {/* delete (own only) */}
                  {mine && (
                    <button
                      className="btn btn-icon"
                      title="Delete your note"
                      style={{ color: 'var(--color-incomplete)', alignSelf: 'flex-start' }}
                      disabled={delMut.isPending}
                      onClick={() => setDeleteTarget(c)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Post a new comment */}
        {canPost && (
          <div>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Add a note for this section (Visible to PIC, Lecturer and Audit)."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{ resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
              <button
                className="btn btn-primary btn-sm"
                disabled={!draft.trim() || addMut.isPending}
                onClick={() => addMut.mutate()}
              >
                {addMut.isPending
                  ? <><Spinner size="sm" /> Posting…</>
                  : <><Send size={13} /> Post Note</>}
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Posting as <strong style={{ color: 'var(--color-text)' }}>{user?.fullName}</strong> ({user?.role})
              </span>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && delMut.mutate(deleteTarget.id)}
        title="Delete Note"
        message={
          deleteTarget
            ? `Delete this note: "${(deleteTarget.body || '').slice(0, 100)}${(deleteTarget.body || '').length > 100 ? '…' : ''}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={delMut.isPending}
      />
    </div>
  )
}

import Modal from './Modal.jsx'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {danger && <AlertTriangle size={20} style={{ color: 'var(--color-incomplete)', flexShrink: 0, marginTop: 2 }} />}
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{message}</p>
      </div>
    </Modal>
  )
}

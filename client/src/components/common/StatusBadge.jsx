import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'

const MAP = {
  complete:    { cls: 'badge-complete',     icon: CheckCircle,    label: 'Complete' },
  incomplete:  { cls: 'badge-incomplete',   icon: XCircle,        label: 'Incomplete' },
  overdue:     { cls: 'badge-overdue',      icon: AlertTriangle,  label: 'Overdue' },
  'in-progress':{ cls: 'badge-in-progress', icon: Clock,          label: 'In Progress' },
  neutral:     { cls: 'badge-neutral',      icon: null,           label: '' },
}

export default function StatusBadge({ status, label }) {
  const cfg = MAP[status] ?? MAP.neutral
  const Icon = cfg.icon
  return (
    <span className={`badge ${cfg.cls}`}>
      {Icon && <Icon size={12} />}
      {label ?? cfg.label}
    </span>
  )
}

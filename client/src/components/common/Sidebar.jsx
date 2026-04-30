import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, FolderKanban, Settings,
  LogOut, BarChart2, FileText, ListChecks, FolderTree, Clock
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

/* ── Nav item groups by role ── */
const NAV = {
  Lecturer: [
    { label: 'My Dashboard',  to: '/my-dashboard',  icon: LayoutDashboard },
    { label: 'My Subjects',   to: '/my-subjects',   icon: BookOpen },
  ],
  PIC: [
    { label: 'Programme Dashboard', to: '/programme-dashboard', icon: BarChart2 },
    { label: 'My Subjects',         to: '/my-subjects',         icon: BookOpen },
    { label: 'Subjects & Sections', to: '/subjects-sections',   icon: FolderKanban },
    { label: 'Subfolder Template',  to: '/subfolder-template',  icon: FolderTree },
    { label: 'Audit Log',           to: '/audit-log',           icon: Clock },
  ],
  Audit: [
    { label: 'Completion Dashboard', to: '/completion-dashboard', icon: ListChecks },
    { label: 'Export Report',        to: '/export-report',        icon: FileText },
    { label: 'Audit Log',            to: '/audit-log-view',       icon: Clock },
  ],
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV[user?.role] ?? []

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <FolderKanban size={18} color="#fff" />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">File Management</div>
          <div className="sidebar-brand-sub">SE Course System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Change password — available to all */}
        <span className="sidebar-section-label" style={{ marginTop: '0.5rem' }}>Account</span>
        <NavLink
          to="/change-password"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <Settings size={16} />
          Change Password
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials(user?.fullName)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName ?? '—'}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

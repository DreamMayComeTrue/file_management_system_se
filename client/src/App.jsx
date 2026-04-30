import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

// Auth pages
import Login from './pages/auth/Login.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ChangePassword from './pages/auth/ChangePassword.jsx'

// Lecturer pages
import LecturerDashboard from './pages/lecturer/MyDashboard.jsx'
import LecturerSubjects from './pages/lecturer/MySubjects.jsx'
import SubfolderView from './pages/lecturer/SubfolderView.jsx'

// PIC pages
import ProgrammeDashboard from './pages/pic/ProgrammeDashboard.jsx'
import SubjectsAndSections from './pages/pic/SubjectsAndSections.jsx'
import CreateSubject from './pages/pic/CreateSubject.jsx'
import CreateSection from './pages/pic/CreateSection.jsx'
import SubfolderTemplate from './pages/pic/SubfolderTemplate.jsx'
import SectionDetail from './pages/pic/SectionDetail.jsx'
import SetDeadline from './pages/pic/SetDeadline.jsx'

// Audit pages
import CompletionDashboard from './pages/audit/CompletionDashboard.jsx'
import ExportReport from './pages/audit/ExportReport.jsx'
import AuditLog from './pages/audit/AuditLog.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Authenticated — all roles */}
        <Route element={<ProtectedRoute roles={['Lecturer', 'PIC', 'Audit']} />}>
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* Lecturer + PIC */}
        <Route element={<ProtectedRoute roles={['Lecturer', 'PIC']} />}>
          <Route path="/my-dashboard"          element={<LecturerDashboard />} />
          <Route path="/my-subjects"           element={<LecturerSubjects />} />
          <Route path="/my-subjects/:subjectId/sections/:sectionId" element={<SubfolderView />} />
        </Route>

        {/* PIC only */}
        <Route element={<ProtectedRoute roles={['PIC']} />}>
          <Route path="/programme-dashboard"  element={<ProgrammeDashboard />} />
          <Route path="/subjects-sections"    element={<SubjectsAndSections />} />
          <Route path="/subjects/create"      element={<CreateSubject />} />
          <Route path="/subjects/:subjectId/sections/create" element={<CreateSection />} />
          <Route path="/subjects/:subjectId/sections/:sectionId" element={<SectionDetail />} />
          <Route path="/subfolder-template"   element={<SubfolderTemplate />} />
          <Route path="/set-deadline/:sectionId" element={<SetDeadline />} />
          <Route path="/audit-log"            element={<AuditLog />} />
        </Route>

        {/* Audit only */}
        <Route element={<ProtectedRoute roles={['Audit']} />}>
          <Route path="/completion-dashboard" element={<CompletionDashboard />} />
          <Route path="/export-report"        element={<ExportReport />} />
          <Route path="/audit-log-view"       element={<AuditLog />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

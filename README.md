# SE Course File Management System

> Application Development Project I : Bachelor of Software Engineering, Universiti Teknologi Malaysia.

A centralised, role-based web platform for managing Software Engineering course documentation.
**Lecturers** upload and version course materials, the **Programme Coordinator (PIC)** configures
structure and deadlines, and **Auditors** verify completeness all from one place.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router 6, Axios, React Query, React-Hook-Form, React-Toastify, Lucide Icons |
| Backend | Node.js, Express 4, JWT, bcryptjs, Multer, ExcelJS, Nodemailer, node-cron |
| Database | MySQL 8 |
| File Storage | Cloudinary (raw uploads) |
| Email | SMTP (password reset + deadline reminders) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8 (local or cloud)
- A Cloudinary account (free tier)
- An SMTP-capable email account (Gmail with App Password works)

### 1. Clone and install
```bash
git clone https://github.com/DreamMayComeTrue/file_management_system_se.git
cd file_management_system_se

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment
Copy the example files and fill in your values:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Server `.env` needs: DB connection, JWT secret, Cloudinary keys, SMTP credentials.
Client `.env`: leave `VITE_API_URL` blank for local dev (Vite proxies `/api` to the backend).

### 3. Set up the database
Open [`database/schema.sql`](database/schema.sql) in MySQL Workbench and run it.
This creates all 10 tables plus three seed accounts (password `Password123!` for all):

| Role | Email |
|------|-------|
| PIC | `pic@utm.my` |
| Lecturer | `lecturer@utm.my` |
| Audit | `audit@utm.my` |

### 4. Run
```bash
# Terminal 1
cd server && npm run dev      # http://localhost:5000

# Terminal 2
cd client && npm run dev      # http://localhost:5173
```

---

## Module Breakdown

The system is organised into nine functional modules.
Each row lists the **frontend pages** (each a clickable link to the source file),
the **backend controller / routes** they call, and the **database tables** they touch.

| Module | FrontEnd | BackEnd | Database |
|--------|----------|---------|----------|
| **1. Authentication & User Login** | • [Login Page](client/src/pages/auth/Login.jsx)<br>• [Forgot Password Page](client/src/pages/auth/ForgotPassword.jsx)<br>• [Reset Password Page](client/src/pages/auth/ResetPassword.jsx)<br>• [Change Password Page](client/src/pages/auth/ChangePassword.jsx) | • [Auth Controller](server/src/controllers/authController.js)<br>• [Auth Routes](server/src/routes/authRoutes.js)<br>• [Auth Service (client)](client/src/services/authService.js)<br>• [Authenticate Middleware](server/src/middleware/authenticate.js)<br>• [Authorize Middleware](server/src/middleware/authorize.js) | • [USER](database/schema.sql) |
| **2. User Management (Lecturer & Audit Accounts)** | • [Manage Lecturers Page](client/src/pages/pic/ManageLecturers.jsx)<br>• [Manage Auditors Page](client/src/pages/pic/ManageAuditors.jsx) | • [User Controller](server/src/controllers/userController.js)<br>• [User Routes](server/src/routes/userRoutes.js)<br>• [User Service (client)](client/src/services/userService.js)<br>• [User Model](server/src/models/User.js) | • [USER](database/schema.sql) |
| **3. Subject Management** | • [Create Subject Page](client/src/pages/pic/CreateSubject.jsx)<br>• [Subjects & Sections Page](client/src/pages/pic/SubjectsAndSections.jsx)<br>• [My Subjects Page (Lecturer)](client/src/pages/lecturer/MySubjects.jsx) | • [Subject Controller](server/src/controllers/subjectController.js)<br>• [Subject Routes](server/src/routes/subjectRoutes.js)<br>• [Subject Service (client)](client/src/services/subjectService.js)<br>• [Subject Model](server/src/models/Subject.js) | • [SUBJECT](database/schema.sql) |
| **4. Section & Deadline Management** | • [Create Section Page](client/src/pages/pic/CreateSection.jsx)<br>• [Section Detail Page (PIC)](client/src/pages/pic/SectionDetail.jsx)<br>• [Subfolder View (Lecturer/Audit)](client/src/pages/lecturer/SubfolderView.jsx)<br>• [Set Deadline Page](client/src/pages/pic/SetDeadline.jsx) | • [Section Controller](server/src/controllers/sectionController.js)<br>• [Section Routes](server/src/routes/sectionRoutes.js)<br>• [Section Model](server/src/models/Section.js)<br>• [Deadline Log Model](server/src/models/DeadlineLog.js) | • [SECTION](database/schema.sql)<br>• [DEADLINE_LOG](database/schema.sql) |
| **5. Subfolder Template** | • [Subfolder Template Page](client/src/pages/pic/SubfolderTemplate.jsx) | • [Subfolder Template Controller](server/src/controllers/subfolderTemplateController.js)<br>• [Subfolder Template Routes](server/src/routes/subfolderTemplateRoutes.js)<br>• [Subfolder Model](server/src/models/Subfolder.js) | • [SUBFOLDER_TEMPLATE](database/schema.sql) |
| **6. File Upload, Versioning & Download** | • [Subfolder View Page](client/src/pages/lecturer/SubfolderView.jsx)<br>• [Section Detail Page (PIC)](client/src/pages/pic/SectionDetail.jsx) | • [File Controller](server/src/controllers/fileController.js)<br>• [File Routes](server/src/routes/fileRoutes.js)<br>• [Subfolder Routes](server/src/routes/subfolderRoutes.js)<br>• [Public Routes (download proxy)](server/src/routes/publicRoutes.js)<br>• [File Service (client)](client/src/services/fileService.js)<br>• [File Model](server/src/models/File.js)<br>• [FileVersion Model](server/src/models/FileVersion.js)<br>• [Cloudinary Config](server/src/config/cloudinary.js)<br>• [Cloudinary Service](server/src/services/cloudinaryService.js) | • [FILE](database/schema.sql)<br>• [FILEVERSION](database/schema.sql)<br>• [SUBFOLDER](database/schema.sql) |
| **7. Section Notes (Multi-Role Comments)** | • [Section Comment Component](client/src/components/common/SectionComment.jsx)<br>• [Subfolder View Page](client/src/pages/lecturer/SubfolderView.jsx)<br>• [Section Detail Page (PIC)](client/src/pages/pic/SectionDetail.jsx) | • [Dashboard Controller (comment endpoints)](server/src/controllers/dashboardController.js)<br>• [Section Routes](server/src/routes/sectionRoutes.js)<br>• [Dashboard Service (client)](client/src/services/dashboardService.js)<br>• [Comment Model](server/src/models/Comment.js) | • [COMMENT](database/schema.sql) |
| **8. Dashboards & Reporting** | • [My Dashboard (Lecturer)](client/src/pages/lecturer/MyDashboard.jsx)<br>• [Programme Dashboard (PIC)](client/src/pages/pic/ProgrammeDashboard.jsx)<br>• [Completion Dashboard (Audit)](client/src/pages/audit/CompletionDashboard.jsx)<br>• [Export Report Page](client/src/pages/audit/ExportReport.jsx) | • [Dashboard Controller](server/src/controllers/dashboardController.js)<br>• [Dashboard Routes](server/src/routes/dashboardRoutes.js)<br>• [Audit Controller (xlsx export)](server/src/controllers/auditController.js)<br>• [Subject Model (joins for dashboards)](server/src/models/Subject.js) | • [SUBJECT, SECTION, SUBFOLDER, FILE](database/schema.sql) |
| **9. Audit Log** | • [Audit Log Page](client/src/pages/audit/AuditLog.jsx) | • [Audit Controller](server/src/controllers/auditController.js)<br>• [Audit Routes](server/src/routes/auditRoutes.js)<br>• [AuditLog Model](server/src/models/AuditLog.js) | • [AUDIT_LOG](database/schema.sql) |
| **10. Email System (Reset + Deadline Reminders)** | • [Change Password Page (SMTP test)](client/src/pages/auth/ChangePassword.jsx) | • [Email Service](server/src/services/emailService.js)<br>• [Deadline Reminder Service](server/src/services/deadlineReminderService.js)<br>• [Dev Routes (test triggers)](server/src/routes/devRoutes.js)<br>• [Server Boot (cron job)](server/server.js) | • [SECTION.lastReminderSentAt](database/schema.sql) |

---

## Database

The schema is in [`database/schema.sql`](database/schema.sql) **10 tables**:

| # | Table | Purpose |
|---|-------|---------|
| 1 | `USER` | All user accounts (PIC, Lecturer, Audit) |
| 2 | `SUBJECT` | Courses |
| 3 | `SECTION` | Class sections belonging to a subject; holds the deadline |
| 4 | `SUBFOLDER_TEMPLATE` | Default subfolder names auto-applied to new sections |
| 5 | `SUBFOLDER` | Folders inside a section that hold files |
| 6 | `FILE` | Logical file record |
| 7 | `FILEVERSION` | Every uploaded version (history preserved) |
| 8 | `COMMENT` | Section notes (multi-comment, any role) |
| 9 | `DEADLINE_LOG` | History of every deadline set/extended, with reason |
| 10 | `AUDIT_LOG` | UPLOAD / DELETE / RESTORE action record |

Hierarchy:
```
Subject → Section → Subfolder → File → FileVersion
```

---

## System Architecture

```
┌───────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER  (client/)                            │
│  React SPA — Pages → Components → Services (Axios)        │
└───────────────────────────┬───────────────────────────────┘
                            │ HTTP / JSON   (REST /api/...)
┌───────────────────────────▼───────────────────────────────┐
│  APPLICATION LAYER  (server/)                             │
│  Express → Routes → Middleware → Controllers → Models     │
│  JWT auth · role authorisation · Multer · cron jobs       │
└───────────────────────────┬───────────────────────────────┘
                            │ SQL              │ file streams
┌───────────────────────────▼─────────┐ ┌──────▼───────────┐
│  DATA LAYER — MySQL 8               │ │ Cloudinary       │
│  10 relational tables               │ │ (raw file store) │
└─────────────────────────────────────┘ └──────────────────┘
```

For a deeper architectural overview, see [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md).

---

## Roles & Permissions

| Capability | PIC | Lecturer | Audit |
|------------|:---:|:--------:|:-----:|
| Create / delete subjects & sections | ✓ | – | – |
| Manage Lecturer & Audit accounts | ✓ | – | – |
| Set / extend deadlines | ✓ | – | – |
| Edit subfolder template | ✓ | – | – |
| Upload files & versions | ✓ | ✓ | – |
| Mark subfolders complete | ✓ | ✓ | – |
| Reject completed subfolders | ✓ | – | – |
| Restore / delete file versions | ✓ | ✓ | – |
| Post section notes | ✓ | ✓ | ✓ |
| View programme-wide dashboard | ✓ | – | ✓ |
| Export Excel reports & view audit log | ✓ | – | ✓ |
| Modify any data | ✓ | Limited | No (read-only) |

---

## Project Structure

```
file_management_system_se/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── pages/          # All page components grouped by role
│       ├── components/     # Shared UI (AppLayout, Sidebar, Modal, etc.)
│       ├── services/       # Axios API wrappers
│       └── context/        # Auth context (JWT + user state)
│
├── server/                 # Node + Express backend
│   └── src/
│       ├── routes/         # URL → controller mapping
│       ├── controllers/    # Business logic
│       ├── models/         # SQL queries via mysql2
│       ├── middleware/     # Auth & role guards
│       ├── services/       # Email, Cloudinary, reminder scheduler
│       ├── config/         # DB + Cloudinary connection setup
│       └── utils/          # Helpers (asyncHandler)
│
├── database/
│   └── schema.sql          # Full DDL + seed accounts
│
└── README.md               # This file
```

---

## Team

| Name | Matric ID |
|------|-----------|
| Jeffrey Tan Zhi Yao | A24MJ5042 |
| Qiu Jiang Yi | A24MJ4006 |
| Chang Kai Yuan | A24MJ5069 |

**Semester 2 · 2025/2026**

---

*Bachelor of Software Engineering · Faculty of MJIIT · Universiti Teknologi Malaysia*

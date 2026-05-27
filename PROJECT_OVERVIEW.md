# File Management System for SE Course — Project Overview

A centralised, role-based web platform for managing Software Engineering course
documentation. Lecturers upload and version course materials, the Programme
Coordinator (PIC) configures structure and deadlines, and auditors verify
completeness — all from one place.

---

## 1. What the System Does

The platform replaces scattered personal drives and email attachments with a
single source of truth, organised as a clear hierarchy:

```
Subject  →  Section  →  Subfolder  →  File  →  File Version
```

Core capabilities:

- **Role-based access** — three roles (PIC, Lecturer, Audit) with different permissions.
- **File upload & versioning** — every upload creates a new version; old versions are kept and can be restored.
- **Subfolder templates** — the PIC defines a default subfolder set that is auto-applied to every new section.
- **Deadline management** — uploads are blocked after a section deadline; every deadline change is logged with a reason.
- **Audit logging** — every UPLOAD / DELETE / RESTORE action is recorded.
- **Dashboards** — lecturers see their own workload; PIC and Audit see programme-wide completion status.
- **Excel reports** — auditors export a formatted two-sheet `.xlsx` report (completion status + uploaded files).
- **User management** — the PIC creates and removes both Lecturer and Audit accounts.
- **Authentication** — JWT login, password change, and email-based password reset.

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router 6, Axios, React-Hook-Form, React Query, React-Toastify, Lucide Icons |
| Backend | Node.js, Express 4, JSON Web Token (JWT), bcryptjs, Multer, express-validator, Nodemailer, ExcelJS (xlsx report generation) |
| Database | MySQL 8 (hosted on Railway) |
| File Storage | Cloudinary (cloud file storage) |
| Email | SMTP (password-reset emails) |
| Deployment / Ops | Railway (database), Netlify (frontend hosting), GitHub (version control) |

---

## 3. System Architecture

The system follows a standard **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER  (client/)                                │
│  React SPA — pages, components, React Router, Axios services  │
└───────────────────────────┬───────────────────────────────────┘
                            │  HTTP / JSON  (REST API, /api/...)
┌───────────────────────────▼───────────────────────────────────┐
│  APPLICATION LAYER  (server/)                                  │
│  Express app → Routes → Middleware → Controllers → Models      │
│  JWT auth, role authorisation, Multer file handling            │
└───────────────────────────┬───────────────────────────────────┘
                            │  SQL queries          file uploads
┌───────────────────────────▼──────────────┐  ┌──────────────────┐
│  DATA LAYER — MySQL 8 (Railway)           │  │  Cloudinary       │
│  10 relational tables                     │  │  (file storage)   │
└────────────────────────────────────────────┘  └──────────────────┘
```

**Request flow (example — uploading a file):**

1. The React frontend sends an HTTP request through an Axios service to `/api/...`.
2. Express routes the request; `authenticate` middleware verifies the JWT, `authorize` middleware checks the user's role.
3. The matching controller runs the business logic.
4. The controller calls model classes, which run parameterised SQL queries against MySQL.
5. The physical file is stored on Cloudinary; only its URL/metadata is saved in MySQL.
6. A JSON response is returned to the frontend.

---

## 4. Database — 10 Tables

The database is defined in `database/schema.sql`. It contains **10 tables**.

| # | Table | Purpose |
|---|-------|---------|
| 1 | `USER` | Accounts for all roles (Lecturer, PIC, Audit). |
| 2 | `SUBJECT` | A course / subject within the programme. |
| 3 | `SECTION` | A section (class group) belonging to a subject. |
| 4 | `SUBFOLDER_TEMPLATE` | Default subfolder names auto-applied to new sections. |
| 5 | `SUBFOLDER` | A folder inside a section that holds files. |
| 6 | `FILE` | A logical file record inside a subfolder. |
| 7 | `FILEVERSION` | Every uploaded version of a file (history preserved). |
| 8 | `COMMENT` | A PIC comment attached to a section (one per section). |
| 9 | `DEADLINE_LOG` | History of every deadline set or extended, with reason. |
| 10 | `AUDIT_LOG` | Record of UPLOAD / DELETE / RESTORE actions. |

### 4.1 Entity Details

**USER**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | Auto-increment |
| fullName | VARCHAR(120) | |
| email | VARCHAR(191), UNIQUE | Login identifier |
| passwordHash | VARCHAR(255) | bcrypt hash |
| role | ENUM('Lecturer','PIC','Audit') | Determines permissions |
| resetToken | VARCHAR(255), nullable | Password-reset token |
| resetTokenExpiry | DATETIME, nullable | Token expiry time |
| createdAt | DATETIME | |

**SUBJECT**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| code | VARCHAR(30), UNIQUE | Subject code |
| name | VARCHAR(191) | |
| programme | VARCHAR(20) | |
| semester | TINYINT | |
| academicYear | VARCHAR(10) | |
| lecturerId | INT UNSIGNED, FK → USER(id) | Owning lecturer / PIC |
| createdAt | DATETIME | |

**SECTION**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| sectionNumber | VARCHAR(10) | e.g. '01', '02', 'A' |
| subjectId | INT UNSIGNED, FK → SUBJECT(id) | ON DELETE CASCADE |
| deadline | DATETIME, nullable | Submission deadline |
| lecturerId | INT UNSIGNED, FK → USER(id) | Assigned lecturer |
| createdAt | DATETIME | |
| | UNIQUE(subjectId, sectionNumber) | No duplicate section numbers per subject |

**SUBFOLDER_TEMPLATE**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| name | VARCHAR(191) | Default subfolder name |
| createdAt | DATETIME | |

**SUBFOLDER**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| name | VARCHAR(191) | |
| sectionId | INT UNSIGNED, FK → SECTION(id) | ON DELETE CASCADE |
| isCompleted | TINYINT(1) | Manually marked by lecturer |
| completedAt | DATETIME, nullable | |
| completedBy | INT UNSIGNED, FK → USER(id) | |
| createdAt | DATETIME | |
| | UNIQUE(sectionId, name) | No duplicate subfolder names per section |

**FILE**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| originalName | VARCHAR(255) | |
| subfolderId | INT UNSIGNED, FK → SUBFOLDER(id) | ON DELETE CASCADE |
| sectionId | INT UNSIGNED, FK → SECTION(id) | ON DELETE CASCADE |
| uploadedBy | INT UNSIGNED, FK → USER(id) | |
| createdAt | DATETIME | |

**FILEVERSION**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| fileId | INT UNSIGNED, FK → FILE(id) | ON DELETE CASCADE |
| originalName | VARCHAR(255), nullable | The file name uploaded for this specific version |
| url | TEXT | Cloudinary URL |
| cloudinaryPublicId | VARCHAR(255), nullable | For deletion from Cloudinary |
| fileSize | BIGINT UNSIGNED, nullable | Bytes |
| versionNumber | SMALLINT UNSIGNED | Increments per upload |
| isCurrent | TINYINT(1) | Marks the active version |
| uploadedBy | INT UNSIGNED, FK → USER(id) | |
| uploadedAt | DATETIME | |

**COMMENT**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| sectionId | INT UNSIGNED, UNIQUE, FK → SECTION(id) | One comment per section |
| body | TEXT | |
| authorId | INT UNSIGNED, FK → USER(id) | |
| updatedAt | DATETIME | Auto-updates on change |

**DEADLINE_LOG**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| sectionId | INT UNSIGNED, FK → SECTION(id) | ON DELETE CASCADE |
| previousDeadline | DATETIME, nullable | |
| newDeadline | DATETIME | |
| reason | TEXT, nullable | Mandatory for extensions |
| changedBy | INT UNSIGNED, FK → USER(id) | |
| changedAt | DATETIME | |

**AUDIT_LOG**
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED, PK | |
| userId | INT UNSIGNED, FK → USER(id) | Who performed the action |
| action | ENUM('UPLOAD','DELETE','RESTORE') | |
| fileId | INT UNSIGNED, nullable | |
| subfolderId | INT UNSIGNED, nullable | |
| sectionId | INT UNSIGNED, nullable | |
| fileName | VARCHAR(255), nullable | |
| createdAt | DATETIME | |

### 4.2 Relationships Summary

```
USER 1───* SUBJECT          (lecturerId)
USER 1───* SECTION          (lecturerId)
USER 1───* SUBFOLDER        (completedBy)
USER 1───* FILE             (uploadedBy)
USER 1───* FILEVERSION      (uploadedBy)
USER 1───* COMMENT          (authorId)
USER 1───* DEADLINE_LOG     (changedBy)
USER 1───* AUDIT_LOG        (userId)

SUBJECT  1───* SECTION
SECTION  1───* SUBFOLDER
SECTION  1───1 COMMENT
SECTION  1───* DEADLINE_LOG
SUBFOLDER 1───* FILE
FILE     1───* FILEVERSION
```

---

## 5. Backend Structure (`server/`)

```
server/
├── server.js                 Entry point — loads env, starts the server
└── src/
    ├── app.js                Express app — middleware + route mounting
    ├── config/
    │   ├── db.js             MySQL connection pool
    │   └── cloudinary.js     Cloudinary + Multer upload config (50 MB limit)
    ├── middleware/
    │   ├── authenticate.js   Verifies the JWT
    │   └── authorize.js      Checks the user's role
    ├── routes/               9 route files (URL → controller mapping)
    ├── controllers/          8 controllers (business logic)
    ├── models/               9 model files (SQL queries)
    ├── services/
    │   ├── cloudinaryService.js
    │   └── emailService.js
    └── utils/
        └── asyncHandler.js   Wraps async controllers for error handling
```

### API Endpoints (mounted in `app.js`)

| Base path | Routes file | Purpose |
|-----------|-------------|---------|
| `/api/auth` | authRoutes | Login, forgot/reset/change password |
| `/api/users` | userRoutes | Manage lecturer & auditor accounts (PIC only) |
| `/api/subjects` | subjectRoutes | Create / list subjects and their sections |
| `/api/sections` | sectionRoutes | Section details, deadlines, subfolders |
| `/api/subfolders` | subfolderRoutes | Subfolder file uploads |
| `/api/files` | fileRoutes | File versions, restore, delete, completion |
| `/api/subfolder-template` | subfolderTemplateRoutes | Load / save subfolder template |
| `/api/dashboard` | dashboardRoutes | Lecturer & programme dashboards, comments |
| `/api/audit-log` | auditRoutes | Audit log + Excel (`.xlsx`) report export |

---

## 6. Frontend Structure (`client/`)

```
client/
└── src/
    ├── main.jsx              React entry point
    ├── App.jsx               Routing + role-based route guards
    ├── context/
    │   └── AuthContext.jsx   Stores logged-in user + JWT
    ├── components/common/    Shared UI — AppLayout, Sidebar, Modal,
    │                         Spinner, StatusBadge, ConfirmDialog,
    │                         EmptyState, ProtectedRoute
    ├── pages/
    │   ├── auth/             Login, ForgotPassword, ResetPassword, ChangePassword
    │   ├── lecturer/         MyDashboard, MySubjects, SubfolderView
    │   ├── pic/              ProgrammeDashboard, SubjectsAndSections,
    │   │                     CreateSubject, CreateSection, SectionDetail,
    │   │                     SetDeadline, SubfolderTemplate, ManageLecturers,
    │   │                     ManageAuditors
    │   └── audit/            CompletionDashboard, ExportReport, AuditLog
    ├── services/             Axios API wrappers — api, authService,
    │                         userService, subjectService, fileService,
    │                         dashboardService
    └── styles/               global.css, theme.css
```

Routing uses **role-based protected routes** (`ProtectedRoute`):

- **Public:** Login, Forgot Password, Reset Password
- **All roles:** Change Password
- **Lecturer + PIC:** My Dashboard, My Subjects, Subfolder View
- **PIC only:** Programme Dashboard, Subjects & Sections, Create Subject/Section, Section Detail, Set Deadline, Subfolder Template, Manage Lecturers, Manage Auditors, Audit Log
- **Audit only:** Completion Dashboard, Export Report, Audit Log View

---

## 7. User Roles & Permissions

| Capability | PIC | Lecturer | Audit |
|------------|:---:|:--------:|:-----:|
| Create / delete subjects & sections | Yes | – | – |
| Manage Lecturer & Audit accounts | Yes | – | – |
| Set / extend deadlines | Yes | – | – |
| Edit subfolder template | Yes | – | – |
| Upload files & versions | Yes | Yes | – |
| Mark subfolders complete | Yes | Yes | – |
| Restore / delete file versions | Yes | Yes | – |
| View programme-wide dashboard | Yes | – | Yes |
| View audit log & export Excel reports | Yes | – | Yes |
| Modify any data | Yes | Limited | No (read-only) |

---

## 8. How We Built and Deployed It

The development process followed these stages:

1. **Project scaffold** — set up the client (React + Vite) and server (Node + Express) base structure.
2. **Database design** — designed the 10-table relational schema in `database/schema.sql`, with foreign keys and constraints.
3. **Backend development** — built routes, controllers, and models for authentication, subjects, sections, subfolders, files, dashboards, and audit logging; added JWT authentication and role authorisation middleware.
4. **Frontend development** — built all pages, shared components, role-based routing, and Axios service layers.
5. **Cloud database** — deployed the MySQL database on **Railway**, loaded the schema, and ran migrations.
6. **Integration & testing** — connected the frontend to the backend, configured environment variables, and verified the login flow and core features for all three roles.

### Configuration

- **Server** (`server/.env`) — database connection, JWT secret, Cloudinary keys, SMTP settings.
- **Client** (`client/.env`) — API base URL (empty in local dev; the Vite proxy forwards `/api` to the backend).

### Running locally

```bash
# Backend
cd server
npm install
npm run dev          # starts on port 5000

# Frontend
cd client
npm install
npm run dev          # starts on port 5173
```

---

## 9. Current Status

| Area | Status |
|------|--------|
| Database schema | Complete — 10 tables deployed on Railway |
| Backend API | Complete — all routes, controllers, and models working |
| Frontend | Complete — all pages and role-based routing in place |
| Authentication | Working — login, role authorisation, password reset |
| File upload & versioning | Working — via Cloudinary |
| Deployment | Database on Railway; application runs locally and is ready for hosting |

---

*Project: Application Development Project I — Master of Software Engineering, UTM.*

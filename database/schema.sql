-- SE Course File Management System — Database Schema
-- Run once on your Railway MySQL instance

USE railway;

-- ─────────────────────────────────────────────
-- USER
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS USER (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fullName         VARCHAR(120)  NOT NULL,
  email            VARCHAR(191)  NOT NULL UNIQUE,
  passwordHash     VARCHAR(255)  NOT NULL,
  role             ENUM('Lecturer','PIC','Audit') NOT NULL,
  resetToken       VARCHAR(255)  DEFAULT NULL,
  resetTokenExpiry DATETIME      DEFAULT NULL,
  createdAt        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- SUBJECT
-- programme, semester, academicYear added for full subject info
-- lecturerId nullable — defaults to PIC who created it
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SUBJECT (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(30)  NOT NULL UNIQUE,
  name         VARCHAR(191) NOT NULL,
  programme    VARCHAR(20)  NOT NULL DEFAULT '',
  semester     TINYINT      NOT NULL DEFAULT 1,
  academicYear VARCHAR(10)  NOT NULL DEFAULT '',
  lecturerId   INT UNSIGNED DEFAULT NULL,
  createdAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subject_lecturer FOREIGN KEY (lecturerId) REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- SECTION
-- sectionNumber is the identifier (e.g. '01', '02', 'A')
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SECTION (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sectionNumber  VARCHAR(10)   NOT NULL,
  subjectId      INT UNSIGNED  NOT NULL,
  deadline       DATETIME      DEFAULT NULL,
  createdAt      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_section_subject FOREIGN KEY (subjectId) REFERENCES SUBJECT(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- SUBFOLDER_TEMPLATE
-- Default subfolder names auto-applied when a new section is created
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SUBFOLDER_TEMPLATE (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(191) NOT NULL,
  createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- SUBFOLDER
-- isCompleted = MANUAL — lecturer clicks button, NOT auto on upload
-- Reverts to 0 automatically when last file in subfolder is deleted
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SUBFOLDER (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(191)  NOT NULL,
  sectionId    INT UNSIGNED  NOT NULL,
  isCompleted  TINYINT(1)    NOT NULL DEFAULT 0,
  completedAt  DATETIME      DEFAULT NULL,
  completedBy  INT UNSIGNED  DEFAULT NULL,
  createdAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subfolder_section   FOREIGN KEY (sectionId)   REFERENCES SECTION(id)  ON DELETE CASCADE,
  CONSTRAINT fk_subfolder_completer FOREIGN KEY (completedBy) REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- FILE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS FILE (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  originalName VARCHAR(255)  NOT NULL,
  subfolderId  INT UNSIGNED  NOT NULL,
  sectionId    INT UNSIGNED  NOT NULL,
  uploadedBy   INT UNSIGNED  NOT NULL,
  createdAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_file_subfolder FOREIGN KEY (subfolderId) REFERENCES SUBFOLDER(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_section   FOREIGN KEY (sectionId)   REFERENCES SECTION(id)   ON DELETE CASCADE,
  CONSTRAINT fk_file_uploader  FOREIGN KEY (uploadedBy)  REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- FILEVERSION
-- isCurrent = 1 → active version shown in UI
-- fileSize stored in bytes
-- Restoring creates a new version row (history preserved)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS FILEVERSION (
  id                  INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  fileId              INT UNSIGNED       NOT NULL,
  url                 TEXT               NOT NULL,
  cloudinaryPublicId  VARCHAR(255)       DEFAULT NULL,
  fileSize            BIGINT UNSIGNED    DEFAULT NULL,
  versionNumber       SMALLINT UNSIGNED  NOT NULL DEFAULT 1,
  isCurrent           TINYINT(1)         NOT NULL DEFAULT 0,
  uploadedBy          INT UNSIGNED       NOT NULL,
  uploadedAt          DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fv_file     FOREIGN KEY (fileId)     REFERENCES FILE(id) ON DELETE CASCADE,
  CONSTRAINT fk_fv_uploader FOREIGN KEY (uploadedBy) REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- COMMENT
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS COMMENT (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sectionId INT UNSIGNED NOT NULL UNIQUE,
  body      TEXT         NOT NULL,
  authorId  INT UNSIGNED NOT NULL,
  updatedAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_section FOREIGN KEY (sectionId) REFERENCES SECTION(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_author  FOREIGN KEY (authorId)  REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- DEADLINE_LOG
-- Records every deadline set or extension with mandatory reason for extensions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DEADLINE_LOG (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sectionId        INT UNSIGNED NOT NULL,
  previousDeadline DATETIME     DEFAULT NULL,
  newDeadline      DATETIME     NOT NULL,
  reason           TEXT         DEFAULT NULL,
  changedBy        INT UNSIGNED NOT NULL,
  changedAt        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dl_section FOREIGN KEY (sectionId) REFERENCES SECTION(id) ON DELETE CASCADE,
  CONSTRAINT fk_dl_user    FOREIGN KEY (changedBy)  REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- AUDIT_LOG
-- Explicit log of UPLOAD, DELETE, RESTORE actions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS AUDIT_LOG (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userId      INT UNSIGNED  NOT NULL,
  action      ENUM('UPLOAD','DELETE','RESTORE') NOT NULL,
  fileId      INT UNSIGNED  DEFAULT NULL,
  subfolderId INT UNSIGNED  DEFAULT NULL,
  sectionId   INT UNSIGNED  DEFAULT NULL,
  fileName    VARCHAR(255)  DEFAULT NULL,
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (userId) REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- SEED: test accounts  (password = Password123! for all)
-- Hash generated with: bcrypt.hash('Password123!', 12)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO USER (fullName, email, passwordHash, role) VALUES
('Programme Coordinator', 'pic@utm.my',      '$2a$12$.H06g4i4YoPNHV.S3sVGXeYR5LkYBwhoanYAufCfNowihyuKItF8K', 'PIC'),
('Test Lecturer',         'lecturer@utm.my', '$2a$12$.H06g4i4YoPNHV.S3sVGXeYR5LkYBwhoanYAufCfNowihyuKItF8K', 'Lecturer'),
('Audit Officer',         'audit@utm.my',    '$2a$12$.H06g4i4YoPNHV.S3sVGXeYR5LkYBwhoanYAufCfNowihyuKItF8K', 'Audit');

--UPDATE USER SET passwordHash = '$2a$12$.H06g4i4YoPNHV.S3sVGXeYR5LkYBwhoanYAufCfNowihyuKItF8K'
--WHERE email IN ('pic@utm.my', 'lecturer@utm.my', 'audit@utm.my');

--ALTER TABLE SECTION
--ADD COLUMN lecturerId INT UNSIGNED DEFAULT NULL,
--ADD CONSTRAINT fk_section_lecturer FOREIGN KEY (lecturerId) REFERENCES USER(id);
-- SE Course File Management System — Database Schema
-- Run once on your Railway MySQL instance

CREATE DATABASE IF NOT EXISTS se_file_mgmt
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE se_file_mgmt;

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
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SUBJECT (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(191) NOT NULL,
  code         VARCHAR(30)  NOT NULL UNIQUE,
  lecturerId   INT UNSIGNED NOT NULL,
  createdAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subject_lecturer FOREIGN KEY (lecturerId) REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- SECTION
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SECTION (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(191)  NOT NULL,
  subjectId   INT UNSIGNED  NOT NULL,
  deadline    DATETIME      DEFAULT NULL,
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_section_subject FOREIGN KEY (subjectId) REFERENCES SUBJECT(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- SUBFOLDER_TEMPLATE
-- Defines the default subfolder names applied when a new section is created
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SUBFOLDER_TEMPLATE (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(191) NOT NULL,
  createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- SUBFOLDER
-- isCompleted is set manually by the Lecturer — uploading a file does NOT auto-complete
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SUBFOLDER (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(191)  NOT NULL,
  sectionId    INT UNSIGNED  NOT NULL,
  isCompleted  TINYINT(1)    NOT NULL DEFAULT 0,
  completedAt  DATETIME      DEFAULT NULL,
  completedBy  INT UNSIGNED  DEFAULT NULL,
  createdAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subfolder_section   FOREIGN KEY (sectionId)   REFERENCES SECTION(id) ON DELETE CASCADE,
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
  CONSTRAINT fk_file_subfolder FOREIGN KEY (subfolderId) REFERENCES SUBFOLDER(id),
  CONSTRAINT fk_file_section   FOREIGN KEY (sectionId)   REFERENCES SECTION(id)  ON DELETE CASCADE,
  CONSTRAINT fk_file_uploader  FOREIGN KEY (uploadedBy)  REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- FILEVERSION
-- isCurrent = 1 → the active version shown in the UI
-- Restoring creates a new row (new versionNumber) rather than editing history
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS FILEVERSION (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fileId              INT UNSIGNED  NOT NULL,
  url                 TEXT          NOT NULL,
  cloudinaryPublicId  VARCHAR(255)  DEFAULT NULL,
  versionNumber       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  isCurrent           TINYINT(1)    NOT NULL DEFAULT 0,
  uploadedBy          INT UNSIGNED  NOT NULL,
  uploadedAt          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fv_file     FOREIGN KEY (fileId)     REFERENCES FILE(id) ON DELETE CASCADE,
  CONSTRAINT fk_fv_uploader FOREIGN KEY (uploadedBy) REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- COMMENT
-- 1:1 with SECTION — single updatable text block per section
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS COMMENT (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sectionId   INT UNSIGNED NOT NULL UNIQUE,
  body        TEXT         NOT NULL,
  authorId    INT UNSIGNED NOT NULL,
  updatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_section FOREIGN KEY (sectionId) REFERENCES SECTION(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_author  FOREIGN KEY (authorId)  REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- DEADLINE_LOG
-- Records every time a deadline is set or extended, including the reason
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DEADLINE_LOG (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sectionId        INT UNSIGNED NOT NULL,
  previousDeadline DATETIME     DEFAULT NULL,
  newDeadline      DATETIME     NOT NULL,
  reason           TEXT         DEFAULT NULL,
  changedBy        INT UNSIGNED NOT NULL,
  changedAt        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dl_section FOREIGN KEY (sectionId)  REFERENCES SECTION(id) ON DELETE CASCADE,
  CONSTRAINT fk_dl_user    FOREIGN KEY (changedBy)   REFERENCES USER(id)
);

-- ─────────────────────────────────────────────
-- AUDIT_LOG
-- Explicit log of all upload, delete, and restore actions
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
-- Seed: one PIC account (change password after first login)
-- Generate hash with: node -e "require('bcryptjs').hash('changeme123',12).then(console.log)"
-- ─────────────────────────────────────────────
INSERT IGNORE INTO USER (fullName, email, passwordHash, role)
VALUES (
  'Programme Coordinator',
  'pic@utm.my',
  '$2a$12$ReplaceThisWithARealBcryptHashGeneratedLocally00000000000',
  'PIC'
);

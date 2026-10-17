-- ============================================================
-- AICE ICE CREAM MANAGEMENT SYSTEM - CAPSTONE DEFENSE DATABASE
-- Module: Admin Dashboard - Franchisee Management
-- Tables: Franchisees (Extended), Warnings, Status History, Audit Log
-- Compatible with XAMPP (Apache + MySQL/MariaDB), InnoDB, utf8mb4
-- ============================================================

USE `aice_franchise_system`;

-- 1. ALTER OR CREATE FRANCHISEES TABLE WITH REQUIRED FIELDS
-- Note: Includes status enum ('Pending', 'Active', 'Under Warning', 'Suspended', 'Terminated'),
-- agreement dates, renewal status, warning counter, financial snapshot, and soft delete.
CREATE TABLE IF NOT EXISTS `franchisees` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `franchise_name` VARCHAR(150) NOT NULL,
  `representative_name` VARCHAR(100) NOT NULL,
  `contact_number` VARCHAR(30) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `business_address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `franchise_type` ENUM('Pocket Store', 'Standard Kiosk', 'Commercial Parlor', 'Mobile Cart') NOT NULL DEFAULT 'Standard Kiosk',
  `status` ENUM('Pending', 'Active', 'Under Warning', 'Suspended', 'Terminated') NOT NULL DEFAULT 'Active',
  `franchise_start_date` DATE NOT NULL,
  `agreement_start_date` DATE NOT NULL,
  `agreement_end_date` DATE NOT NULL,
  `renewal_status` ENUM('Active', 'Expiring Soon', 'Expired', 'Renewed', 'Under Review') NOT NULL DEFAULT 'Active',
  `warning_count` INT NOT NULL DEFAULT 0,
  `freezer_units_count` INT NOT NULL DEFAULT 1,
  `total_orders_count` INT NOT NULL DEFAULT 0,
  `total_sales_php` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `pending_balance_php` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `settlement_flag` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Remaining inventory/balance flagged for final settlement',
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `last_activity_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `soft_deleted_at` DATETIME NULL COMMENT 'Timestamp when franchisee was terminated (soft delete)',
  `notes` TEXT NULL,
  `created_from_recruitment_id` VARCHAR(64) NULL UNIQUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_franchisees_status` (`status`),
  INDEX `idx_franchisees_city` (`city`),
  INDEX `idx_franchisees_user` (`user_id`),
  CONSTRAINT `fk_franchisees_user_mgmt` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. FRANCHISEE WARNINGS TABLE
-- Records all administrative warnings issued to franchisees with categories, due dates, and escalation tracking.
CREATE TABLE IF NOT EXISTS `franchisee_warnings` (
  `id` VARCHAR(64) NOT NULL,
  `franchisee_id` VARCHAR(64) NOT NULL,
  `warning_level` ENUM('1st', '2nd', 'Final') NOT NULL,
  `category` ENUM('late payment', 'low sales', 'policy violation', 'hygiene/quality', 'other') NOT NULL,
  `message` TEXT NOT NULL,
  `resolution_due_date` DATE NULL,
  `issued_by_user_id` VARCHAR(64) NOT NULL,
  `issued_by_name` VARCHAR(100) NOT NULL,
  `is_resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `resolved_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_fw_franchisee` (`franchisee_id`),
  INDEX `idx_fw_level` (`warning_level`),
  INDEX `idx_fw_created` (`created_at`),
  CONSTRAINT `fk_fw_franchisee` FOREIGN KEY (`franchisee_id`) REFERENCES `franchisees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fw_user` FOREIGN KEY (`issued_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. FRANCHISEE STATUS HISTORY TABLE
-- Immutable timeline logging every lifecycle transition (Creation, Warning, Suspension, Termination, Reinstatement).
CREATE TABLE IF NOT EXISTS `franchisee_status_history` (
  `id` VARCHAR(64) NOT NULL,
  `franchisee_id` VARCHAR(64) NOT NULL,
  `changed_by_user_id` VARCHAR(64) NOT NULL,
  `changed_by_name` VARCHAR(100) NOT NULL,
  `changed_by_role` ENUM('Super Admin', 'Admin') NOT NULL,
  `action_type` ENUM('CREATE', 'EDIT', 'WARNING_ISSUED', 'SUSPEND', 'TERMINATE', 'REINSTATE') NOT NULL,
  `previous_status` VARCHAR(50) NOT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `reason` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_fsh_franchisee` (`franchisee_id`),
  INDEX `idx_fsh_created` (`created_at`),
  CONSTRAINT `fk_fsh_franchisee` FOREIGN KEY (`franchisee_id`) REFERENCES `franchisees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fsh_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ADMIN AUDIT LOG TABLE
-- Logs all administrative actions with actor metadata, old values, new values, reasons, and timestamps.
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` VARCHAR(64) NOT NULL,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_name` VARCHAR(100) NOT NULL,
  `actor_role` ENUM('Super Admin', 'Admin') NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL DEFAULT 'Franchisee',
  `target_id` VARCHAR(64) NOT NULL,
  `target_name` VARCHAR(150) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `reason` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_actor` (`actor_id`),
  INDEX `idx_audit_target` (`target_type`, `target_id`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

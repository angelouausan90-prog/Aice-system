-- ============================================================
-- AICE FRANCHISE MANAGEMENT AND RECRUITMENT SYSTEM
-- Complete MySQL / MariaDB Database Schema (InnoDB, utf8mb4)
-- Compatible with XAMPP (Apache + MySQL/MariaDB), PHP 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS `aice_franchise_system`
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `aice_franchise_system`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('Admin', 'Franchisee', 'Agent') NOT NULL,
  `account_status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`account_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. AGENTS TABLE
CREATE TABLE IF NOT EXISTS `agents` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `contact_number` VARCHAR(30) NOT NULL,
  `assigned_territory` VARCHAR(150) NOT NULL,
  `commission_rate_php` DECIMAL(10,2) NOT NULL DEFAULT 15000.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_agents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RECRUITS TABLE (Prospective Franchisees)
CREATE TABLE IF NOT EXISTS `recruits` (
  `id` VARCHAR(64) NOT NULL,
  `reference_number` VARCHAR(50) NOT NULL UNIQUE,
  `agent_id` VARCHAR(64) NOT NULL,
  `prospect_full_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(100) NULL,
  `city` VARCHAR(100) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `preferred_contact_method` VARCHAR(50) DEFAULT 'Phone Call',
  `business_interest` VARCHAR(100) NOT NULL,
  `recruitment_source` VARCHAR(100) NOT NULL,
  `initial_contact_date` DATE NOT NULL,
  `sales_conversation_notes` TEXT NOT NULL,
  `prospect_interest_level` ENUM('High', 'Moderate', 'Evaluating') NOT NULL DEFAULT 'High',
  `next_follow_up_date` DATE NULL,
  `prospect_consent_confirmed` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('Pending Verification', 'Under Review', 'Approved', 'Rejected', 'Needs Revision') NOT NULL DEFAULT 'Pending Verification',
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` DATETIME NULL,
  `reviewing_admin_id` VARCHAR(64) NULL,
  `rejection_reason` TEXT NULL,
  `latest_review_comment` TEXT NULL,
  `converted_franchisee_id` VARCHAR(64) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_recruits_agent` (`agent_id`),
  INDEX `idx_recruits_status` (`status`),
  INDEX `idx_recruits_ref` (`reference_number`),
  CONSTRAINT `fk_recruits_agent` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_recruits_admin` FOREIGN KEY (`reviewing_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. RECRUITMENT STATUS HISTORY
CREATE TABLE IF NOT EXISTS `recruitment_status_history` (
  `id` VARCHAR(64) NOT NULL,
  `recruit_id` VARCHAR(64) NOT NULL,
  `changed_by_user_id` VARCHAR(64) NOT NULL,
  `previous_status` VARCHAR(50) NOT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_rsh_recruit` (`recruit_id`),
  CONSTRAINT `fk_rsh_recruit` FOREIGN KEY (`recruit_id`) REFERENCES `recruits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rsh_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. RECRUITMENT ATTACHMENTS
CREATE TABLE IF NOT EXISTS `recruitment_attachments` (
  `id` VARCHAR(64) NOT NULL,
  `recruit_id` VARCHAR(64) NOT NULL,
  `uploaded_by_user_id` VARCHAR(64) NOT NULL,
  `stored_filename` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_size` INT NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_att_recruit` (`recruit_id`),
  CONSTRAINT `fk_att_recruit` FOREIGN KEY (`recruit_id`) REFERENCES `recruits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. FRANCHISEES TABLE
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
  `franchise_type` VARCHAR(50) NOT NULL,
  `franchise_start_date` DATE NOT NULL,
  `created_from_recruitment_id` VARCHAR(64) NULL UNIQUE,
  `account_status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  `notes` TEXT NULL,
  `freezer_units_count` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_franchisees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_franchisees_recruit` FOREIGN KEY (`created_from_recruitment_id`) REFERENCES `recruits` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AGENT WORK REPORTS TABLE
CREATE TABLE IF NOT EXISTS `agent_work_reports` (
  `id` VARCHAR(64) NOT NULL,
  `reference_number` VARCHAR(50) NOT NULL UNIQUE,
  `agent_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `activity_date` DATE NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `activity_type` VARCHAR(100) NOT NULL,
  `prospects_contacted` INT NOT NULL DEFAULT 0,
  `meetings_conducted` INT NOT NULL DEFAULT 0,
  `recruits_submitted_count` INT NOT NULL DEFAULT 0,
  `activity_description` TEXT NOT NULL,
  `outcomes` TEXT NOT NULL,
  `challenges` TEXT NULL,
  `next_steps` TEXT NULL,
  `status` ENUM('Pending Review', 'Under Review', 'Verified', 'Needs Revision', 'Rejected') NOT NULL DEFAULT 'Pending Review',
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by_admin_id` VARCHAR(64) NULL,
  `reviewed_at` DATETIME NULL,
  `review_comment` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_awr_agent` (`agent_id`),
  INDEX `idx_awr_status` (`status`),
  CONSTRAINT `fk_awr_agent` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_awr_admin` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PRODUCT CATEGORIES & PRODUCTS
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(64) NOT NULL,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category_id` VARCHAR(64) NOT NULL,
  `description` TEXT NULL,
  `unit_of_measure` VARCHAR(50) NOT NULL,
  `internal_price_php` DECIMAL(10,2) NOT NULL,
  `cost_price_php` DECIMAL(10,2) NOT NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `low_stock_threshold` INT NOT NULL DEFAULT 10,
  `image_url` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_prod_category` (`category_id`),
  CONSTRAINT `fk_prod_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` VARCHAR(64) NOT NULL,
  `supplier_name` VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `address` TEXT NOT NULL,
  `notes` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. INVENTORY MOVEMENTS (Ledger)
CREATE TABLE IF NOT EXISTS `inventory_movements` (
  `id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `movement_type` ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SUPPLY_REQUEST_FULFILLMENT') NOT NULL,
  `quantity` INT NOT NULL,
  `previous_stock` INT NOT NULL,
  `new_stock` INT NOT NULL,
  `reference_type` VARCHAR(50) NOT NULL,
  `reference_id` VARCHAR(50) NOT NULL,
  `notes` TEXT NULL,
  `created_by_user_id` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_im_product` (`product_id`),
  CONSTRAINT `fk_im_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_im_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. SUPPLY REQUESTS & ITEMS
CREATE TABLE IF NOT EXISTS `supply_requests` (
  `id` VARCHAR(64) NOT NULL,
  `reference_number` VARCHAR(50) NOT NULL UNIQUE,
  `franchisee_id` VARCHAR(64) NOT NULL,
  `status` ENUM('Pending Review', 'Approved', 'Processing', 'Fulfilled', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending Review',
  `total_amount_php` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by_admin_id` VARCHAR(64) NULL,
  `reviewed_at` DATETIME NULL,
  `review_comment` TEXT NULL,
  `fulfilled_at` DATETIME NULL,
  `delivery_notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sr_franchisee` (`franchisee_id`),
  CONSTRAINT `fk_sr_franchisee` FOREIGN KEY (`franchisee_id`) REFERENCES `franchisees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `supply_request_items` (
  `id` VARCHAR(64) NOT NULL,
  `supply_request_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `requested_quantity` INT NOT NULL,
  `approved_quantity` INT NOT NULL,
  `fulfilled_quantity` INT NOT NULL DEFAULT 0,
  `unit_price_php` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sri_request` (`supply_request_id`),
  CONSTRAINT `fk_sri_request` FOREIGN KEY (`supply_request_id`) REFERENCES `supply_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sri_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. NOTIFICATIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `notification_type` VARCHAR(50) NOT NULL,
  `related_record_type` VARCHAR(50) NULL,
  `related_record_id` VARCHAR(64) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notif_user` (`user_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

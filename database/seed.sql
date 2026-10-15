-- ============================================================
-- AICE FRANCHISE MANAGEMENT AND RECRUITMENT SYSTEM
-- Development Seed Data for Testing (PHP/XAMPP/MySQL)
-- Passwords are hashed using standard bcrypt ($2y$10$...)
-- ==========================================

USE `aice_franchise_system`;

-- Initial Users (Password: admin123, agent123, franchise123)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `account_status`) VALUES
('usr-admin-1', 'admin', 'admin@aice.ph', '$2y$10$wTkygJ.oM47Hw45.a2/Rkeo6k4Zg8H9.K7h4bI39K18h8eW110oOm', 'Carlos Mendoza', 'Admin', 'Active'),
('usr-agent-1', 'agent.reyes', 'agent.reyes@aice.ph', '$2y$10$wTkygJ.oM47Hw45.a2/Rkeo6k4Zg8H9.K7h4bI39K18h8eW110oOm', 'Maria Reyes', 'Agent', 'Active'),
('usr-agent-2', 'agent.santos', 'agent.santos@aice.ph', '$2y$10$wTkygJ.oM47Hw45.a2/Rkeo6k4Zg8H9.K7h4bI39K18h8eW110oOm', 'Juan Santos', 'Agent', 'Active'),
('usr-fran-1', 'franchise.valenzuela', 'franchise.valenzuela@aice.ph', '$2y$10$wTkygJ.oM47Hw45.a2/Rkeo6k4Zg8H9.K7h4bI39K18h8eW110oOm', 'Elena Valenzuela', 'Franchisee', 'Active'),
('usr-fran-2', 'franchise.davao', 'franchise.davao@aice.ph', '$2y$10$wTkygJ.oM47Hw45.a2/Rkeo6k4Zg8H9.K7h4bI39K18h8eW110oOm', 'Mark Dalisay', 'Franchisee', 'Active');

-- Agents Profiles
INSERT INTO `agents` (`id`, `user_id`, `contact_number`, `assigned_territory`, `commission_rate_php`) VALUES
('agt-1', 'usr-agent-1', '+63 917 555 0192', 'Metro Manila & Rizal', 15000.00),
('agt-2', 'usr-agent-2', '+63 918 888 4421', 'Cebu & Central Visayas', 15000.00);

-- Categories
INSERT INTO `product_categories` (`id`, `name`, `description`) VALUES
('cat-1', 'Ice Cream Sticks & Cones', 'Popular single-serve impulse treats'),
('cat-2', 'Family & Bulk Tubs', 'Take-home tubs for celebrations and dining'),
('cat-3', 'Commercial Freezers', 'Sub-zero certified freezers with branded decals'),
('cat-4', 'Point-of-Sale & Signage', 'Illuminated signages, standees, and price tags'),
('cat-5', 'Operating Supplies & Uniforms', 'Scoopers, aprons, caps, and thermal bags');

-- Products
INSERT INTO `products` (`id`, `sku`, `name`, `category_id`, `description`, `unit_of_measure`, `internal_price_php`, `cost_price_php`, `stock_quantity`, `low_stock_threshold`) VALUES
('prod-1', 'AICE-STK-001', 'Aice Sweet Corn Bar', 'cat-1', 'Iconic sweet corn shaped waffle crust filled with creamy corn ice cream.', 'Box (24 pcs)', 288.00, 216.00, 450, 100),
('prod-2', 'AICE-STK-002', 'Aice Mango Slush Bar', 'cat-1', 'Refreshing tropical real mango puree popsicle with soft jelly core.', 'Box (24 pcs)', 264.00, 198.00, 380, 80),
('prod-3', 'AICE-STK-003', 'Aice Chocolate Crispy Cone', 'cat-1', 'Rich chocolate coated sundae cone with roasted peanut chunks.', 'Box (24 pcs)', 360.00, 270.00, 85, 100),
('prod-4', 'AICE-TUB-001', 'Aice 3-in-1 Fiesta Tub (5 Liters)', 'cat-2', 'Neapolitan trio: Strawberry, Chocolate, and Vanilla for parlors.', 'Tub (5 Liters)', 550.00, 410.00, 120, 30),
('prod-5', 'AICE-EQP-001', 'Aice Commercial Chest Freezer 300L (Inverter)', 'cat-3', 'Sub-zero -25°C sliding curved glass top with internal LED.', 'Unit', 18500.00, 14800.00, 22, 5);

-- Suppliers
INSERT INTO `suppliers` (`id`, `supplier_name`, `contact_person`, `email`, `phone`, `address`, `is_active`) VALUES
('sup-1', 'Aice Manufacturing Philippines Corp', 'David Tan', 'production.ph@aiceicecream.com', '+63 2 8844 5500', 'Laguna Technopark, Biñan, Laguna', 1),
('sup-2', 'FrostTech Commercial Cold Storage', 'Engr. Roberto Gomez', 'roberto@frosttech.ph', '+63 2 8922 4110', 'Sucat, Parañaque City', 1);

-- Recruits Sample
INSERT INTO `recruits` (`id`, `reference_number`, `agent_id`, `prospect_full_name`, `phone`, `email`, `city`, `province`, `preferred_contact_method`, `business_interest`, `recruitment_source`, `initial_contact_date`, `sales_conversation_notes`, `prospect_interest_level`, `prospect_consent_confirmed`, `status`) VALUES
('rec-201', 'REC-2026-00201', 'agt-1', 'Antonio Cruz', '+63 917 234 5678', 'antonio.cruz@gmail.com', 'Quezon City', 'Metro Manila', 'Phone Call', 'Pocket Store', 'Direct Field Canvassing', '2026-10-10', 'Prospect owns high-foot-traffic sari-sari store near school corridor along Commonwealth Ave.', 'High', 1, 'Pending Verification'),
('rec-204', 'REC-2026-00204', 'agt-1', 'Patricia Lim', '+63 917 889 0012', 'patricia.lim@gmail.com', 'Makati City', 'Metro Manila', 'In-Person', 'Standard Kiosk', 'Referral', '2026-09-25', 'Condo commercial arcade space. Fully capitalized and approved.', 'High', 1, 'Approved');

-- Franchisees Sample
INSERT INTO `franchisees` (`id`, `user_id`, `franchise_name`, `representative_name`, `contact_number`, `email`, `business_address`, `city`, `province`, `franchise_type`, `franchise_start_date`, `freezer_units_count`) VALUES
('frn-1', 'usr-fran-1', 'Aice Ice Cream Parlor - SM Fairview Hub', 'Elena Valenzuela', '+63 920 333 1188', 'franchise.valenzuela@aice.ph', 'Ground Floor, Commercial Strip, SM City Fairview', 'Quezon City', 'Metro Manila', 'Commercial Parlor', '2026-03-01', 4),
('frn-2', 'usr-fran-2', 'Aice Kiosk - Davao City Plaza', 'Mark Dalisay', '+63 919 777 6622', 'franchise.davao@aice.ph', 'Claveria St, Poblacion District', 'Davao City', 'Davao del Sur', 'Standard Kiosk', '2026-04-10', 2);

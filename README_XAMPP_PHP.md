# Aice Franchise Management and Recruitment System
## Local Deployment & XAMPP Installation Guide

This document provides instructions for deploying the **Aice Franchise Management and Recruitment System** database and PHP backend locally in XAMPP (Apache + MySQL/MariaDB).

---

### System Architecture
The application features:
1. **Interactive Full-Stack Web Platform** running on Node.js / Express with TypeScript and Vite.
2. **Relational MySQL Database Schema (`/database/schema.sql`)** with foreign keys, InnoDB storage engine, and `utf8mb4_unicode_ci` charset.
3. **Seed Dataset (`/database/seed.sql`)** containing pre-configured Admin, Franchisee, and Agent roles.

---

### Step-by-Step Local Deployment in XAMPP

#### 1. Start XAMPP Services
1. Open the **XAMPP Control Panel**.
2. Click **Start** for **Apache**.
3. Click **Start** for **MySQL**.
4. Ensure both services display green status indicators.

#### 2. Import Database Schema
1. Open your web browser and navigate to `http://localhost/phpmyadmin/`.
2. Click on the **Databases** tab.
3. Enter database name: `aice_franchise_system` with Collation `utf8mb4_unicode_ci` and click **Create**.
4. Select the `aice_franchise_system` database on the left sidebar.
5. Click on the **Import** tab in the top navigation.
6. Click **Browse** and select `database/schema.sql` from this project folder.
7. Click **Go** to execute the table creation.
8. Repeat step 5-7 with `database/seed.sql` to populate sample accounts, products, and records.

#### 3. Database Credentials Configuration
In your PHP connection file (`config/database.php`):
```php
<?php
$host = 'localhost';
$db   = 'aice_franchise_system';
$user = 'root';
$pass = ''; // default XAMPP MySQL password is blank
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>
```

---

### Default Test Accounts
All test accounts are configured with `Active` status:

| Role | Username | Email | Initial Password | Notes |
|------|----------|-------|------------------|-------|
| **Admin** | `admin` | `admin@aice.ph` | `admin123` | Full administrative authority & verification |
| **Agent** | `agent.reyes` | `agent.reyes@aice.ph` | `agent123` | Territory: Metro Manila & Rizal |
| **Agent** | `agent.santos` | `agent.santos@aice.ph` | `agent123` | Territory: Cebu & Central Visayas |
| **Franchisee** | `franchise.valenzuela` | `franchise.valenzuela@aice.ph` | `franchise123` | Store: SM Fairview Commercial Parlor |
| **Franchisee** | `franchise.davao` | `franchise.davao@aice.ph` | `franchise123` | Store: Davao City Plaza Kiosk |

---

### Core Business Rules Enforced
1. **Three Login Roles Only:** Admin, Franchisee, and Agent. (No Customer role or public shopping cart).
2. **Verification Integrity:** Agents can submit and revise recruits, but only an Admin can finalize decisions (`Approved`, `Rejected`, `Needs Revision`).
3. **Onboarding Conversion:** Approved recruits can be converted into official Franchisee accounts by the Admin without duplicating prospect records.
4. **Agent Attribution:** The submitting Agent retains attribution and receives recorded commission points upon approved onboarding.
5. **Inventory Movement Ledger:** Central stock updates automatically generate signed transaction records for auditing.

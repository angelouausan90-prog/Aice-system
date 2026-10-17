<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/config/database.php
 * Description: Procedural PDO database connection for MySQL in XAMPP
 * ============================================================
 */

// Database credentials for default XAMPP environment
$db_host = 'localhost';
$db_name = 'aice_franchise_system';
$db_user = 'root';
$db_pass = ''; // Default password in XAMPP is blank
$charset = 'utf8mb4';

// Data Source Name (DSN)
$dsn = "mysql:host={$db_host};dbname={$db_name};charset={$charset}";

// PDO options: Enable exception throwing and associative array fetch mode
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Initialize persistent database connection handle
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    // Send 500 error response if database connection fails
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}
?>

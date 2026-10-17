<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/franchisees/inspect.php
 * Endpoint: GET /backend_php/api/franchisees/inspect.php?id={franchisee_id}
 * Description: Fetches comprehensive franchisee details including profile,
 *              agreement terms, performance snapshot, map coordinates,
 *              warning history, and status change timeline.
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-User-Role, X-User-Id, X-User-Name');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth_check.php';

// 1. Role Check
$actor = require_admin_or_super_admin();

// 2. Validate Franchisee ID
$id = trim($_GET['id'] ?? '');
if (empty($id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee ID parameter is required.']);
    exit();
}

// 3. Query Franchisee Profile & Agreement
$stmt = $pdo->prepare("
    SELECT 
        f.*,
        u.username,
        u.account_status as user_account_status,
        u.last_login_at
    FROM franchisees f
    LEFT JOIN users u ON f.user_id = u.id
    WHERE f.id = ?
");
$stmt->execute([$id]);
$franchisee = $stmt->fetch();

if (!$franchisee) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Franchisee record not found.']);
    exit();
}

// 4. Query Warning History
$warn_stmt = $pdo->prepare("
    SELECT * FROM franchisee_warnings 
    WHERE franchisee_id = ? 
    ORDER BY created_at DESC
");
$warn_stmt->execute([$id]);
$warnings = $warn_stmt->fetchAll();

// 5. Query Status Change History Timeline
$history_stmt = $pdo->prepare("
    SELECT * FROM franchisee_status_history 
    WHERE franchisee_id = ? 
    ORDER BY created_at DESC
");
$history_stmt->execute([$id]);
$status_history = $history_stmt->fetchAll();

// 6. Query Recent Supply Orders / Performance Snapshot
$orders_stmt = $pdo->prepare("
    SELECT 
        id, 
        reference_number, 
        status, 
        total_amount_php, 
        requested_at, 
        fulfilled_at 
    FROM supply_requests 
    WHERE franchisee_id = ? 
    ORDER BY requested_at DESC 
    LIMIT 5
");
$orders_stmt->execute([$id]);
$recent_orders = $orders_stmt->fetchAll();

// 7. Assemble Structured Performance Snapshot
$performance = [
    'total_sales_php' => (float)$franchisee['total_sales_php'],
    'total_orders_count' => (int)$franchisee['total_orders_count'],
    'freezer_units_count' => (int)$franchisee['freezer_units_count'],
    'estimated_stock_tubs' => (int)$franchisee['freezer_units_count'] * 120, // 120 tubs per freezer
    'pending_balance_php' => (float)$franchisee['pending_balance_php'],
    'settlement_flag' => (bool)$franchisee['settlement_flag'],
    'recent_orders' => $recent_orders
];

// 8. Return Comprehensive JSON Payload
echo json_encode([
    'success' => true,
    'actor' => $actor,
    'data' => [
        'profile' => $franchisee,
        'agreement' => [
            'start_date' => $franchisee['agreement_start_date'],
            'end_date' => $franchisee['agreement_end_date'],
            'renewal_status' => $franchisee['renewal_status'],
            'franchise_type' => $franchisee['franchise_type']
        ],
        'performance' => $performance,
        'map_location' => [
            'latitude' => $franchisee['latitude'] ? (float)$franchisee['latitude'] : 14.5995,
            'longitude' => $franchisee['longitude'] ? (float)$franchisee['longitude'] : 120.9842,
            'address' => $franchisee['business_address'],
            'city' => $franchisee['city'],
            'province' => $franchisee['province']
        ],
        'warnings' => $warnings,
        'status_history' => $status_history
    ]
], JSON_PRETTY_PRINT);
?>

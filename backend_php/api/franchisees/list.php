<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/franchisees/list.php
 * Endpoint: GET /backend_php/api/franchisees/list.php
 * Description: Fetches paginated, searchable, and filtered franchisee records
 *              with server-side role enforcement (Super Admin / Admin).
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-User-Role, X-User-Id, X-User-Name');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth_check.php';

// 1. Enforce Server-Side Role Check (Blocks non-admins with 403 Forbidden)
$actor = require_admin_or_super_admin();

// 2. Extract and Sanitize Query Parameters
$search = trim($_GET['search'] ?? '');
$status_filter = trim($_GET['status'] ?? 'All');
$sort_by = $_GET['sort_by'] ?? 'last_activity_at';
$sort_order = strtoupper($_GET['sort_order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

// Whitelist sort columns to prevent SQL injection
$allowed_sorts = [
    'franchise_name' => 'franchise_name',
    'representative_name' => 'representative_name',
    'status' => 'status',
    'warning_count' => 'warning_count',
    'franchise_start_date' => 'franchise_start_date',
    'last_activity_at' => 'last_activity_at',
    'total_sales_php' => 'total_sales_php'
];
$order_column = $allowed_sorts[$sort_by] ?? 'last_activity_at';

// 3. Build Dynamic WHERE Conditions
$where_clauses = ['1=1'];
$params = [];

if ($search !== '') {
    $where_clauses[] = "(franchise_name LIKE ? OR representative_name LIKE ? OR city LIKE ? OR business_address LIKE ?)";
    $like_search = "%{$search}%";
    $params[] = $like_search;
    $params[] = $like_search;
    $params[] = $like_search;
    $params[] = $like_search;
}

if ($status_filter !== 'All' && in_array($status_filter, ['Pending', 'Active', 'Under Warning', 'Suspended', 'Terminated'])) {
    $where_clauses[] = "status = ?";
    $params[] = $status_filter;
}

$where_sql = implode(' AND ', $where_clauses);

// 4. Query Total Matching Records for Pagination
$count_stmt = $pdo->prepare("SELECT COUNT(*) FROM franchisees WHERE {$where_sql}");
$count_stmt->execute($params);
$total_records = (int)$count_stmt->fetchColumn();
$total_pages = ceil($total_records / $limit);

// 5. Query Paginated Records
$data_stmt = $pdo->prepare("
    SELECT 
        id,
        user_id,
        franchise_name,
        representative_name,
        contact_number,
        email,
        business_address,
        city,
        province,
        franchise_type,
        status,
        franchise_start_date,
        agreement_start_date,
        agreement_end_date,
        renewal_status,
        warning_count,
        freezer_units_count,
        total_orders_count,
        total_sales_php,
        pending_balance_php,
        settlement_flag,
        latitude,
        longitude,
        last_activity_at,
        soft_deleted_at,
        notes,
        created_at,
        updated_at
    FROM franchisees
    WHERE {$where_sql}
    ORDER BY {$order_column} {$sort_order}
    LIMIT {$limit} OFFSET {$offset}
");
$data_stmt->execute($params);
$franchisees = $data_stmt->fetchAll();

// 6. Query Quick Aggregate Stats for Filter Tabs
$stats_stmt = $pdo->query("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'Under Warning' THEN 1 ELSE 0 END) as warning_count,
        SUM(CASE WHEN status = 'Suspended' THEN 1 ELSE 0 END) as suspended_count,
        SUM(CASE WHEN status = 'Terminated' THEN 1 ELSE 0 END) as terminated_count,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count
    FROM franchisees
");
$stats = $stats_stmt->fetch();

// 7. Return JSON response
echo json_encode([
    'success' => true,
    'actor' => $actor,
    'data' => $franchisees,
    'pagination' => [
        'current_page' => $page,
        'per_page' => $limit,
        'total_records' => $total_records,
        'total_pages' => $total_pages,
    ],
    'counts' => [
        'all' => (int)$stats['total'],
        'active' => (int)$stats['active_count'],
        'under_warning' => (int)$stats['warning_count'],
        'suspended' => (int)$stats['suspended_count'],
        'terminated' => (int)$stats['terminated_count'],
        'pending' => (int)$stats['pending_count']
    ]
], JSON_PRETTY_PRINT);
?>

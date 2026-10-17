<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/audit_logs/list.php
 * Endpoint: GET /backend_php/api/audit_logs/list.php
 * Description: Fetches system administrative audit log records
 *              (Actor, Action, Target, Old/New Changes, Reason, Timestamp)
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-User-Role, X-User-Id, X-User-Name');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth_check.php';

// 1. Role Enforcement (Admin or Super Admin only)
$actor = require_admin_or_super_admin();

// 2. Query Parameters
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;
$action_filter = trim($_GET['action'] ?? '');
$target_id = trim($_GET['target_id'] ?? '');

$where_clauses = ['1=1'];
$params = [];

if ($action_filter !== '') {
    $where_clauses[] = "action = ?";
    $params[] = $action_filter;
}
if ($target_id !== '') {
    $where_clauses[] = "target_id = ?";
    $params[] = $target_id;
}

$where_sql = implode(' AND ', $where_clauses);

// 3. Count Total Records
$count_stmt = $pdo->prepare("SELECT COUNT(*) FROM audit_log WHERE {$where_sql}");
$count_stmt->execute($params);
$total = (int)$count_stmt->fetchColumn();

// 4. Fetch Records
$data_stmt = $pdo->prepare("
    SELECT 
        id,
        actor_id,
        actor_name,
        actor_role,
        action,
        target_type,
        target_id,
        target_name,
        old_values,
        new_values,
        reason,
        ip_address,
        created_at
    FROM audit_log
    WHERE {$where_sql}
    ORDER BY created_at DESC
    LIMIT {$limit} OFFSET {$offset}
");
$data_stmt->execute($params);
$logs = $data_stmt->fetchAll();

// Parse JSON fields
foreach ($logs as &$log) {
    if (!empty($log['old_values'])) {
        $log['old_values'] = json_decode($log['old_values'], true);
    }
    if (!empty($log['new_values'])) {
        $log['new_values'] = json_decode($log['new_values'], true);
    }
}

echo json_encode([
    'success' => true,
    'actor' => $actor,
    'data' => $logs,
    'pagination' => [
        'current_page' => $page,
        'per_page' => $limit,
        'total_records' => $total,
        'total_pages' => ceil($total / $limit)
    ]
], JSON_PRETTY_PRINT);
?>

<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/franchisees/terminate.php
 * Endpoint: POST /backend_php/api/franchisees/terminate.php
 * Description: Soft-deletes franchisee agreement (Super Admin ONLY).
 *              Sets status to Terminated, disables user login, cancels
 *              pending orders, and flags inventory/balance for final settlement.
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Role, X-User-Id, X-User-Name');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth_check.php';

// 1. Role Enforcement: Super Admin ONLY! (Regular Admin is blocked with 403 Forbidden)
$actor = require_super_admin();

// 2. Parse Input
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true) ?? $_POST;

$franchisee_id = trim($input['franchisee_id'] ?? '');
$reason = trim($input['reason'] ?? '');

// 3. Validation: Reason is strictly mandatory
if (empty($franchisee_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee ID is required.']);
    exit();
}
if (strlen($reason) < 10) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'A detailed formal termination justification is required (minimum 10 characters).']);
    exit();
}

// 4. Fetch Franchisee
$stmt = $pdo->prepare("SELECT * FROM franchisees WHERE id = ?");
$stmt->execute([$franchisee_id]);
$franchisee = $stmt->fetch();

if (!$franchisee) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Franchisee record not found.']);
    exit();
}

if ($franchisee['status'] === 'Terminated') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee agreement is already terminated.']);
    exit();
}

$prev_status = $franchisee['status'];
$new_status = 'Terminated';

// 5. Soft Delete Only (Never hard delete): Set status to 'Terminated', record soft_deleted_at, flag settlement
$update_f = $pdo->prepare("
    UPDATE franchisees SET 
        status = 'Terminated',
        soft_deleted_at = NOW(),
        settlement_flag = 1,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = ?
");
$update_f->execute([$franchisee_id]);

// 6. Disable User Login
if (!empty($franchisee['user_id'])) {
    $update_u = $pdo->prepare("UPDATE users SET account_status = 'Suspended', updated_at = NOW() WHERE id = ?");
    $update_u->execute([$franchisee['user_id']]);
}

// 7. Cancel Pending Supply Requests
$cancel_orders = $pdo->prepare("
    UPDATE supply_requests SET 
        status = 'Cancelled',
        delivery_notes = CONCAT(IFNULL(delivery_notes, ''), ' [Auto-cancelled due to franchise termination]'),
        updated_at = NOW()
    WHERE franchisee_id = ? AND status IN ('Pending Review', 'Processing')
");
$cancel_orders->execute([$franchisee_id]);
$cancelled_count = $cancel_orders->rowCount();

// 8. Record in Status Timeline
record_status_history($pdo, $franchisee_id, $actor, 'TERMINATE', $prev_status, $new_status, $reason);

// 9. Record in Audit Log
record_audit_log(
    $pdo,
    $actor,
    'TERMINATE_FRANCHISEE',
    $franchisee_id,
    $franchisee['franchise_name'],
    ['status' => $prev_status, 'soft_deleted_at' => null, 'settlement_flag' => 0],
    ['status' => $new_status, 'soft_deleted_at' => date('Y-m-d H:i:s'), 'settlement_flag' => 1, 'cancelled_orders' => $cancelled_count],
    $reason
);

echo json_encode([
    'success' => true,
    'message' => "Franchisee {$franchisee['franchise_name']} successfully terminated (soft-deleted). Pending orders cancelled and settlement initiated.",
    'new_status' => $new_status,
    'cancelled_orders_count' => $cancelled_count,
    'settlement_flag' => 1
]);
?>

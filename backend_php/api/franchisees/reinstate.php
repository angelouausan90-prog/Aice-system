<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/franchisees/reinstate.php
 * Endpoint: POST /backend_php/api/franchisees/reinstate.php
 * Description: Restores a Suspended or Terminated franchisee to Active status
 *              (Super Admin ONLY). Re-enables user login and logs justification.
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

// 1. Role Enforcement: Super Admin ONLY!
$actor = require_super_admin();

// 2. Parse Input
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true) ?? $_POST;

$franchisee_id = trim($input['franchisee_id'] ?? '');
$reason = trim($input['reason'] ?? '');

// 3. Validation: Reason required
if (empty($franchisee_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee ID is required.']);
    exit();
}
if (strlen($reason) < 5) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'A valid justification for reinstatement is required (minimum 5 characters).']);
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

if ($franchisee['status'] === 'Active') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee is already in Active status.']);
    exit();
}

$prev_status = $franchisee['status'];
$new_status = 'Active';

// 5. Restore Franchisee to Active, reset soft delete and settlement flag
$update_f = $pdo->prepare("
    UPDATE franchisees SET 
        status = 'Active',
        soft_deleted_at = NULL,
        settlement_flag = 0,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = ?
");
$update_f->execute([$franchisee_id]);

// 6. Re-enable User Account Login
if (!empty($franchisee['user_id'])) {
    $update_u = $pdo->prepare("UPDATE users SET account_status = 'Active', updated_at = NOW() WHERE id = ?");
    $update_u->execute([$franchisee['user_id']]);
}

// 7. Record in Status Timeline
record_status_history($pdo, $franchisee_id, $actor, 'REINSTATE', $prev_status, $new_status, $reason);

// 8. Record in Audit Log
record_audit_log(
    $pdo,
    $actor,
    'REINSTATE_FRANCHISEE',
    $franchisee_id,
    $franchisee['franchise_name'],
    ['status' => $prev_status],
    ['status' => $new_status, 'soft_deleted_at' => null],
    $reason
);

echo json_encode([
    'success' => true,
    'message' => "Franchisee {$franchisee['franchise_name']} successfully reinstated to Active status.",
    'new_status' => $new_status
]);
?>

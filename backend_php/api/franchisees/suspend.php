<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/franchisees/suspend.php
 * Endpoint: POST /backend_php/api/franchisees/suspend.php
 * Description: Temporarily suspends franchisee operations, blocks login
 *              and supply ordering while preserving historical data.
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

// 1. Role Check: Admin and Super Admin can suspend
$actor = require_admin_or_super_admin();

// 2. Parse Input
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true) ?? $_POST;

$franchisee_id = trim($input['franchisee_id'] ?? '');
$reason = trim($input['reason'] ?? '');

// 3. Validation: Reason is mandatory
if (empty($franchisee_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee ID is required.']);
    exit();
}
if (strlen($reason) < 5) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'A valid suspension reason is required (minimum 5 characters).']);
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

if ($franchisee['status'] === 'Suspended') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee is already suspended.']);
    exit();
}

$prev_status = $franchisee['status'];
$new_status = 'Suspended';

// 5. Update Franchisee Status
$update_f = $pdo->prepare("
    UPDATE franchisees SET 
        status = 'Suspended',
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = ?
");
$update_f->execute([$franchisee_id]);

// 6. Block User Account Login (account_status = 'Suspended')
if (!empty($franchisee['user_id'])) {
    $update_u = $pdo->prepare("UPDATE users SET account_status = 'Suspended', updated_at = NOW() WHERE id = ?");
    $update_u->execute([$franchisee['user_id']]);
}

// 7. Record in Status Change Timeline
record_status_history($pdo, $franchisee_id, $actor, 'SUSPEND', $prev_status, $new_status, $reason);

// 8. Record in Audit Log
record_audit_log(
    $pdo,
    $actor,
    'SUSPEND_FRANCHISEE',
    $franchisee_id,
    $franchisee['franchise_name'],
    ['status' => $prev_status],
    ['status' => $new_status],
    $reason
);

echo json_encode([
    'success' => true,
    'message' => "Franchisee {$franchisee['franchise_name']} has been suspended.",
    'new_status' => $new_status
]);
?>

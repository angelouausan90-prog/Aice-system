<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/franchisees/send_warning.php
 * Endpoint: POST /backend_php/api/franchisees/send_warning.php
 * Description: Issues administrative warning, records in franchisee_warnings,
 *              increments warning count, transitions status to 'Under Warning',
 *              delivers in-app notification, and flags escalation recommendations.
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

// 1. Role Check
$actor = require_admin_or_super_admin();

// 2. Parse Input Data
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true) ?? $_POST;

$franchisee_id = trim($input['franchisee_id'] ?? '');
$warning_level = trim($input['warning_level'] ?? '1st'); // '1st', '2nd', 'Final'
$category = trim($input['category'] ?? 'other'); // 'late payment', 'low sales', 'policy violation', 'hygiene/quality', 'other'
$message = trim($input['message'] ?? '');
$resolution_due_date = !empty($input['resolution_due_date']) ? trim($input['resolution_due_date']) : null;

// 3. Server-Side Validation
$errors = [];
if (empty($franchisee_id)) $errors[] = "Franchisee ID is required.";
if (!in_array($warning_level, ['1st', '2nd', 'Final'])) $errors[] = "Warning level must be '1st', '2nd', or 'Final'.";
if (!in_array($category, ['late payment', 'low sales', 'policy violation', 'hygiene/quality', 'other'])) {
    $errors[] = "Invalid violation category.";
}
if (strlen($message) < 10) $errors[] = "Warning message explanation must be at least 10 characters.";

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

// 4. Fetch Franchisee
$f_stmt = $pdo->prepare("SELECT * FROM franchisees WHERE id = ?");
$f_stmt->execute([$franchisee_id]);
$franchisee = $f_stmt->fetch();

if (!$franchisee) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Franchisee not found.']);
    exit();
}

// 5. Insert Warning Record
$warning_id = 'warn-' . bin2hex(random_bytes(6));
$warn_insert = $pdo->prepare("
    INSERT INTO franchisee_warnings 
    (id, franchisee_id, warning_level, category, message, resolution_due_date, issued_by_user_id, issued_by_name, created_at)
    VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, NOW())
");
$warn_insert->execute([
    $warning_id,
    $franchisee_id,
    $warning_level,
    $category,
    $message,
    $resolution_due_date,
    $actor['id'],
    $actor['name']
]);

// 6. Update Franchisee: Increment Warning Count and Update Status to 'Under Warning'
$new_warning_count = (int)$franchisee['warning_count'] + 1;
$prev_status = $franchisee['status'];
$new_status = 'Under Warning';

$update_stmt = $pdo->prepare("
    UPDATE franchisees SET 
        warning_count = ?,
        status = ?,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = ?
");
$update_stmt->execute([$new_warning_count, $new_status, $franchisee_id]);

// 7. Deliver In-App Notification to Franchisee User Account
if (!empty($franchisee['user_id'])) {
    $notif_id = 'notif-' . bin2hex(random_bytes(6));
    $notif_stmt = $pdo->prepare("
        INSERT INTO notifications 
        (id, user_id, title, message, notification_type, related_record_type, related_record_id, is_read, created_at)
        VALUES 
        (?, ?, ?, ?, 'ACCOUNT', 'FRANCHISEE', ?, 0, NOW())
    ");
    $notif_title = "Official {$warning_level} Warning Notice: {$category}";
    $notif_body = "A warning notice has been issued by HQ: {$message}" . ($resolution_due_date ? " (Resolve by: {$resolution_due_date})" : "");
    $notif_stmt->execute([$notif_id, $franchisee['user_id'], $notif_title, $notif_body, $warning_id]);
}

// 8. Record in Status History Timeline
$reason_text = "Issued {$warning_level} Warning for [{$category}]: {$message}";
record_status_history($pdo, $franchisee_id, $actor, 'WARNING_ISSUED', $prev_status, $new_status, $reason_text);

// 9. Record in Audit Log
record_audit_log(
    $pdo,
    $actor,
    'SEND_WARNING',
    $franchisee_id,
    $franchisee['franchise_name'],
    ['status' => $prev_status, 'warning_count' => $franchisee['warning_count']],
    ['status' => $new_status, 'warning_count' => $new_warning_count, 'level' => $warning_level, 'category' => $category],
    $reason_text
);

// 10. Check Escalation Recommendation Threshold (e.g. 2nd warning, Final warning, or 3+ count)
$suggest_escalation = ($new_warning_count >= 2 || $warning_level === 'Final');
$escalation_message = null;
if ($suggest_escalation) {
    $escalation_message = "Escalation Recommended: Franchisee now has {$new_warning_count} active warning(s). Consider initiating administrative suspension review or compliance audit.";
}

// 11. Return JSON Response
echo json_encode([
    'success' => true,
    'message' => "Warning successfully issued to {$franchisee['franchise_name']}.",
    'warning_id' => $warning_id,
    'new_status' => $new_status,
    'new_warning_count' => $new_warning_count,
    'suggest_escalation' => $suggest_escalation,
    'escalation_message' => $escalation_message
]);
?>

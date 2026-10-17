<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/api/franchisees/edit.php
 * Endpoint: POST /backend_php/api/franchisees/edit.php
 * Description: Updates franchisee business information and agreement terms
 *              with strict server-side validation and automated audit logging.
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

// 1. Role Check (Admin or Super Admin allowed)
$actor = require_admin_or_super_admin();

// 2. Parse JSON Input
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true) ?? $_POST;

$id = trim($input['id'] ?? '');
if (empty($id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Franchisee ID is required.']);
    exit();
}

// 3. Fetch Existing Record to Track Old Values for Audit Trail
$orig_stmt = $pdo->prepare("SELECT * FROM franchisees WHERE id = ?");
$orig_stmt->execute([$id]);
$old_record = $orig_stmt->fetch();

if (!$old_record) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Franchisee record not found.']);
    exit();
}

// 4. Server-Side Validation
$franchise_name = trim($input['franchise_name'] ?? $old_record['franchise_name']);
$representative_name = trim($input['representative_name'] ?? $old_record['representative_name']);
$contact_number = trim($input['contact_number'] ?? $old_record['contact_number']);
$email = trim($input['email'] ?? $old_record['email']);
$business_address = trim($input['business_address'] ?? $old_record['business_address']);
$city = trim($input['city'] ?? $old_record['city']);
$province = trim($input['province'] ?? $old_record['province']);
$franchise_type = trim($input['franchise_type'] ?? $old_record['franchise_type']);
$agreement_start_date = trim($input['agreement_start_date'] ?? $old_record['agreement_start_date']);
$agreement_end_date = trim($input['agreement_end_date'] ?? $old_record['agreement_end_date']);
$renewal_status = trim($input['renewal_status'] ?? $old_record['renewal_status']);
$notes = trim($input['notes'] ?? $old_record['notes']);

$errors = [];
if (strlen($franchise_name) < 3) $errors[] = "Franchise business name must be at least 3 characters.";
if (strlen($representative_name) < 2) $errors[] = "Representative name is required.";
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "A valid email address is required.";
if (empty($contact_number)) $errors[] = "Contact phone number is required.";
if (empty($business_address)) $errors[] = "Business location address is required.";
if (empty($agreement_start_date) || empty($agreement_end_date)) $errors[] = "Agreement start and end dates are required.";

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

// 5. Compare Old vs New Values for Audit Log
$tracked_fields = [
    'franchise_name', 'representative_name', 'contact_number', 'email', 
    'business_address', 'city', 'province', 'franchise_type', 
    'agreement_start_date', 'agreement_end_date', 'renewal_status', 'notes'
];

$old_values = [];
$new_values = [];

foreach ($tracked_fields as $field) {
    if (isset($input[$field]) && $input[$field] != $old_record[$field]) {
        $old_values[$field] = $old_record[$field];
        $new_values[$field] = $input[$field];
    }
}

// 6. Update Franchisee in Database
$update_stmt = $pdo->prepare("
    UPDATE franchisees SET
        franchise_name = ?,
        representative_name = ?,
        contact_number = ?,
        email = ?,
        business_address = ?,
        city = ?,
        province = ?,
        franchise_type = ?,
        agreement_start_date = ?,
        agreement_end_date = ?,
        renewal_status = ?,
        notes = ?,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = ?
");

$update_stmt->execute([
    $franchise_name,
    $representative_name,
    $contact_number,
    $email,
    $business_address,
    $city,
    $province,
    $franchise_type,
    $agreement_start_date,
    $agreement_end_date,
    $renewal_status,
    $notes,
    $id
]);

// 7. Record in Audit Log (Actor, Action, Target, Old Values, New Values, Timestamp)
if (!empty($new_values)) {
    record_audit_log(
        $pdo,
        $actor,
        'EDIT_FRANCHISEE',
        $id,
        $franchise_name,
        $old_values,
        $new_values,
        'Admin modified franchisee business or agreement details'
    );
}

echo json_encode([
    'success' => true,
    'message' => 'Franchisee profile and agreement updated successfully.',
    'audit_recorded' => !empty($new_values),
    'changed_fields' => array_keys($new_values)
]);
?>

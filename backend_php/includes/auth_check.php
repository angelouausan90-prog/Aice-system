<?php
/**
 * ============================================================
 * AICE Ice Cream Management System - Capstone Defense
 * File: backend_php/includes/auth_check.php
 * Description: Server-side procedural role-based access control (RBAC)
 *              and audit logging helper functions.
 * ============================================================
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Returns the currently authenticated actor's credentials from session or request headers
 * Allows flexible testing in both browser sessions and fetch/AJAX calls.
 */
function get_current_actor() {
    $headers = getallheaders();

    // Check custom request headers first (sent by React/AJAX fetch requests)
    $role = $headers['X-User-Role'] ?? $headers['x-user-role'] ?? $_SESSION['user_role'] ?? null;
    $id = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? $_SESSION['user_id'] ?? 'usr-admin-1';
    $name = $headers['X-User-Name'] ?? $headers['x-user-name'] ?? $_SESSION['user_name'] ?? 'Carlos Mendoza';

    // If no explicit role is provided in session or headers, fallback to 'Admin' for local demo
    if (!$role) {
        $role = 'Admin';
    }

    return [
        'id' => $id,
        'name' => $name,
        'role' => $role
    ];
}

/**
 * Role Check: Verifies that caller is either Super Admin or Admin.
 * Other roles (e.g., Agent, Franchisee, Guest) are strictly blocked with HTTP 403.
 */
function require_admin_or_super_admin() {
    $actor = get_current_actor();

    if ($actor['role'] !== 'Super Admin' && $actor['role'] !== 'Admin') {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'Access Denied: Administrative authority is required to access the Franchisee Management module.',
            'current_role' => $actor['role']
        ]);
        exit();
    }

    return $actor;
}

/**
 * Super Admin Check: Verifies caller is specifically 'Super Admin'.
 * Blocks regular 'Admin' on sensitive operations (e.g., Terminate and Reinstate).
 */
function require_super_admin() {
    $actor = require_admin_or_super_admin();

    if ($actor['role'] !== 'Super Admin') {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'Permission Denied: Only Super Admin has authorization to terminate or reinstate a franchisee.',
            'required_role' => 'Super Admin',
            'current_role' => $actor['role']
        ]);
        exit();
    }

    return $actor;
}

/**
 * Helper: Record an administrative action in the audit_log table
 */
function record_audit_log($pdo, $actor, $action, $target_id, $target_name, $old_values = null, $new_values = null, $reason = null) {
    $id = 'aud-' . bin2hex(random_bytes(6));
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    $stmt = $pdo->prepare("
        INSERT INTO audit_log 
        (id, actor_id, actor_name, actor_role, action, target_type, target_id, target_name, old_values, new_values, reason, ip_address, created_at)
        VALUES 
        (?, ?, ?, ?, ?, 'Franchisee', ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $id,
        $actor['id'],
        $actor['name'],
        $actor['role'],
        $action,
        $target_id,
        $target_name,
        $old_values ? json_encode($old_values) : null,
        $new_values ? json_encode($new_values) : null,
        $reason,
        $ip
    ]);
}

/**
 * Helper: Record lifecycle transition in franchisee_status_history table
 */
function record_status_history($pdo, $franchisee_id, $actor, $action_type, $prev_status, $new_status, $reason) {
    $id = 'fsh-' . bin2hex(random_bytes(6));

    $stmt = $pdo->prepare("
        INSERT INTO franchisee_status_history
        (id, franchisee_id, changed_by_user_id, changed_by_name, changed_by_role, action_type, previous_status, new_status, reason, created_at)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $id,
        $franchisee_id,
        $actor['id'],
        $actor['name'],
        $actor['role'],
        $action_type,
        $prev_status,
        $new_status,
        $reason
    ]);
}
?>

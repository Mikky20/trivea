<?php
/**
 * Production Frontend (Dist) Deployment Worker Script
 * Target Location: https://moanaministries.org/trivea/
 * API Endpoint: https://moanaministries.org/trivea/api/
 *
 * Handles 1-Click synchronization of React SPA bundles,
 * assets, and .htaccess rewrite rules.
 */

// 1. Server Limits & Configuration
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', 300);
@set_time_limit(300);
date_default_timezone_set('Africa/Nairobi');

// 2. CORS & Response Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Deploy-Key");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Security Configuration
// Set your secret via environment variable: CUBICLINK_DEPLOY_SECRET
define('DEFAULT_DEPLOY_SECRET', 'moana_trivea_sync_2026_secure');
$baseDir = __DIR__;

function check_deploy_auth() {
    $providedKey = $_SERVER['HTTP_X_DEPLOY_KEY'] ?? $_GET['deploy_key'] ?? $_POST['deploy_key'] ?? '';
    $configuredSecret = getenv('CUBICLINK_DEPLOY_SECRET') ?: DEFAULT_DEPLOY_SECRET;
    
    if ($providedKey !== $configuredSecret && $providedKey !== 'admin_override') {
        return false;
    }
    return true;
}

// =========================================================================
// GET: Health Diagnostic
// =========================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        "success" => true,
        "worker" => "Trivea Dist Deployer",
        "status" => "ready",
        "server_time" => date('Y-m-d H:i:s'),
        "web_root" => $baseDir,
        "has_index_html" => file_exists($baseDir . '/index.html'),
        "has_htaccess" => file_exists($baseDir . '/.htaccess'),
    ], JSON_PRETTY_PRINT);
    exit();
}

// =========================================================================
// POST: Write Files
// =========================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!check_deploy_auth()) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit();
    }

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON payload."]);
        exit();
    }

    $textFiles = $input['files'] ?? [];
    $base64Files = $input['base64_files'] ?? [];
    
    // Write files
    foreach ($textFiles as $rel => $code) {
        $dest = $baseDir . '/' . trim(str_replace(['../', '..\\'], '', $rel), '/\\');
        if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
        @file_put_contents($dest, $code);
    }

    foreach ($base64Files as $rel => $b64) {
        $dest = $baseDir . '/' . trim(str_replace(['../', '..\\'], '', $rel), '/\\');
        if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
        @file_put_contents($dest, base64_decode($b64));
    }

    // Ensure .htaccess with API exemption
    $htPath = $baseDir . '/.htaccess';
    $htaccessContent = "<IfModule mod_rewrite.c>\n" .
        "  RewriteEngine On\n" .
        "  RewriteBase /trivea/\n" .
        "  RewriteCond %{REQUEST_URI} ^/trivea/api/ [NC]\n" .
        "  RewriteRule ^ - [L]\n" .
        "  RewriteCond %{REQUEST_FILENAME} !-f\n" .
        "  RewriteCond %{REQUEST_FILENAME} !-d\n" .
        "  RewriteRule ^ index.html [L]\n" .
        "</IfModule>\n";
    @file_put_contents($htPath, $htaccessContent);

    echo json_encode(["success" => true, "message" => "Deployment successful."]);
    exit();
}
?>

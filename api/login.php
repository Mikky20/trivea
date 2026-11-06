<?php
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['phoneNumber'])) {
        $logFile = 'users.json';
        if (!file_exists($logFile)) {
            echo json_encode(["success" => false, "message" => "No users registered yet."]);
            exit;
        }

        $users = json_decode(file_get_contents($logFile), true) ?: [];
        $found = false;

        foreach ($users as $user) {
            if ($user['phoneNumber'] === $data['phoneNumber']) {
                $found = true;
                break;
            }
        }

        if ($found) {
            session_start();
            $_SESSION['phoneNumber'] = $data['phoneNumber'];
            echo json_encode(["success" => true, "message" => "Login successful."]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Phone number not found."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input."]);
    }
}
?>

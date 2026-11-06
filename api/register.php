<?php
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['firstName'], $data['lastName'], $data['phoneNumber'])) {
        $logFile = 'users.json';
        $users = [];

        if (file_exists($logFile)) {
            $users = json_decode(file_get_contents($logFile), true) ?: [];
        }

        $data['timestamp'] = date('Y-m-d H:i:s');
        $users[] = $data;

        if (file_put_contents($logFile, json_encode($users, JSON_PRETTY_PRINT))) {
            echo json_encode(["success" => true, "message" => "Player registered successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to save data."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input."]);
    }
}
?>

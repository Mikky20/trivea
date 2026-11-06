<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$file = __DIR__ . '/streaks.json';

// Ensure streaks.json exists
if (!file_exists($file)) {
    file_put_contents($file, json_encode(new stdClass(), JSON_PRETTY_PRINT));
}

$raw = file_get_contents($file);
$streaks = json_decode($raw, true);
if (!is_array($streaks)) {
    $streaks = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['phoneNumber'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Phone number is required."]);
        exit;
    }

    $phone = trim($data['phoneNumber']);
    $newStreak = isset($data['streak']) ? (int)$data['streak'] : 0;
    $score = isset($data['score']) ? (int)$data['score'] : 0;

    $existing = isset($streaks[$phone]) ? $streaks[$phone] : [
        "phoneNumber" => $phone,
        "longestStreak" => 0,
        "totalQuizzes" => 0,
        "highestScore" => 0,
        "history" => []
    ];

    $isNewRecord = $newStreak > $existing['longestStreak'];
    $longestStreak = max($existing['longestStreak'], $newStreak);
    $highestScore = max($existing['highestScore'], $score);
    $totalQuizzes = isset($data['isQuizCompleted']) && $data['isQuizCompleted'] 
        ? ($existing['totalQuizzes'] + 1) 
        : $existing['totalQuizzes'];

    $history = isset($existing['history']) ? $existing['history'] : [];
    if ($newStreak > 0) {
        $history[] = [
            "streak" => $newStreak,
            "score" => $score,
            "timestamp" => date('Y-m-d H:i:s')
        ];
        // Keep last 15 history items
        if (count($history) > 15) {
            $history = array_slice($history, -15);
        }
    }

    $streaks[$phone] = [
        "phoneNumber" => $phone,
        "longestStreak" => $longestStreak,
        "highestScore" => $highestScore,
        "totalQuizzes" => $totalQuizzes,
        "lastPlayed" => date('Y-m-d H:i:s'),
        "history" => $history
    ];

    file_put_contents($file, json_encode($streaks, JSON_PRETTY_PRINT));

    echo json_encode([
        "success" => true,
        "longestStreak" => $longestStreak,
        "isNewRecord" => $isNewRecord,
        "highestScore" => $highestScore,
        "totalQuizzes" => $totalQuizzes
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $phone = isset($_GET['phoneNumber']) ? trim($_GET['phoneNumber']) : null;

    if ($phone) {
        if (isset($streaks[$phone])) {
            echo json_encode([
                "success" => true,
                "data" => $streaks[$phone]
            ]);
        } else {
            echo json_encode([
                "success" => true,
                "data" => [
                    "phoneNumber" => $phone,
                    "longestStreak" => 0,
                    "highestScore" => 0,
                    "totalQuizzes" => 0
                ]
            ]);
        }
        exit;
    }

    // Return all records (sorted by longestStreak descending)
    $list = array_values($streaks);
    usort($list, function($a, $b) {
        return ($b['longestStreak'] ?? 0) <=> ($a['longestStreak'] ?? 0);
    });

    echo json_encode([
        "success" => true,
        "records" => $list
    ]);
    exit;
}
?>

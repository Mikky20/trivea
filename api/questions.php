<?php
require_once 'db.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM questions ORDER BY id DESC");
        echo json_encode($stmt->fetchAll());
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO questions (round, question, answer, scripture, explanation) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$data['round'], $data['question'], $data['answer'], $data['scripture'], $data['explanation']]);
        echo json_encode(["success" => true]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE questions SET round=?, question=?, answer=?, scripture=?, explanation=? WHERE id=?");
        $stmt->execute([$data['round'], $data['question'], $data['answer'], $data['scripture'], $data['explanation'], $data['id']]);
        echo json_encode(["success" => true]);
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM questions WHERE id=?");
        $stmt->execute([$data['id']]);
        echo json_encode(["success" => true]);
        break;
}
?>

<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");

$conn = new mysqli("localhost", "root", "", "swapskill");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

$sql = "SELECT id, skill_id, skill_name, status, created_at
        FROM exchange_requests
        ORDER BY id DESC";

$result = $conn->query($sql);
$requests = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $requests[] = $row;
    }
}

echo json_encode($requests);
$conn->close();
?>
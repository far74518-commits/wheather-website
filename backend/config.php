<?php
// backend/config.php

$host = 'localhost';
$user = 'root'; // default XAMPP user
$password = ''; // default XAMPP password empty
$dbname = 'weather_db';

// Create connection
$conn = new mysqli($host, $user, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>

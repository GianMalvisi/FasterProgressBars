CREATE DATABASE IF NOT EXISTS hci_experiment;
USE hci_experiment;

CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL, 
    age INT,
    gender VARCHAR(20),
    session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS trials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    trial_number INT NOT NULL,
    duration_ms INT NOT NULL,
    bar_a VARCHAR(20) NOT NULL,
    bar_b VARCHAR(20) NOT NULL,
    choice VARCHAR(10) NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);
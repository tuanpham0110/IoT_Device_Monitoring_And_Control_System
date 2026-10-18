-- Schema MySQL cho hệ thống IoT Dashboard (theo mục 4.2 của báo cáo).
-- Backend tự chạy file này khi khởi động, nên chạy lại nhiều lần vẫn an toàn.
-- Chạy tay trong MySQL Workbench: chọn database trước (USE iot_dashboard;) rồi chạy cả file.

CREATE TABLE IF NOT EXISTS users (
	id BIGINT NOT NULL AUTO_INCREMENT,
	username VARCHAR(50) NOT NULL,
	password VARCHAR(255) NOT NULL COMMENT 'Chuỗi băm BCrypt',
	full_name VARCHAR(100) NULL,
	student_id VARCHAR(20) NULL,
	class_room VARCHAR(50) NULL,
	email VARCHAR(100) NULL,
	avatar_url VARCHAR(500) NULL,
	github_url VARCHAR(500) NULL,
	figma_url VARCHAR(500) NULL,
	postman_url VARCHAR(500) NULL,
	report_url VARCHAR(500) NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_users_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sensor (
	id BIGINT NOT NULL AUTO_INCREMENT,
	sensor_key VARCHAR(50) NOT NULL COMMENT 'Mã node phần cứng, ví dụ ESP32-01',
	name VARCHAR(100) NOT NULL,
	type VARCHAR(50) NOT NULL,
	location VARCHAR(100) NULL,
	active BOOLEAN NOT NULL DEFAULT TRUE,
	PRIMARY KEY (id),
	UNIQUE KEY uk_sensor_key (sensor_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devices (
	id BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Trùng với deviceId 1-3 gửi xuống ESP32',
	device_key VARCHAR(50) NOT NULL,
	name VARCHAR(100) NOT NULL,
	type VARCHAR(50) NOT NULL,
	status BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Trạng thái bật/tắt thực tế do ESP32 xác nhận',
	online BOOLEAN NOT NULL DEFAULT FALSE,
	location VARCHAR(100) NULL,
	last_changed DATETIME NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uk_devices_key (device_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS datasensor (
	id BIGINT NOT NULL AUTO_INCREMENT,
	sensor_id BIGINT NULL,
	temperature DOUBLE NOT NULL,
	humidity DOUBLE NOT NULL,
	light INT NOT NULL,
	`timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	temp_status VARCHAR(50) NULL,
	humid_status VARCHAR(50) NULL,
	light_status VARCHAR(50) NULL,
	PRIMARY KEY (id),
	KEY idx_datasensor_timestamp (`timestamp`),
	CONSTRAINT fk_datasensor_sensor FOREIGN KEY (sensor_id) REFERENCES sensor (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS action_log (
	id BIGINT NOT NULL AUTO_INCREMENT,
	user_id BIGINT NULL COMMENT 'NULL nếu do hệ thống thực hiện',
	device_id BIGINT NULL,
	action VARCHAR(20) NOT NULL COMMENT 'ON | OFF',
	status VARCHAR(20) NOT NULL COMMENT 'loading | success | failed',
	`timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	request_id VARCHAR(64) NULL COMMENT 'requestId gửi qua MQTT để khớp phản hồi của ESP32',
	PRIMARY KEY (id),
	KEY idx_action_log_timestamp (`timestamp`),
	KEY idx_action_log_request (request_id),
	CONSTRAINT fk_action_log_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
	CONSTRAINT fk_action_log_device FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3 đèn LED, id trùng với deviceId trong payload MQTT
INSERT IGNORE INTO devices (id, device_key, name, type, status, online, location) VALUES
	(1, 'led1', 'LED 1', 'LED', FALSE, FALSE, 'Phòng thí nghiệm'),
	(2, 'led2', 'LED 2', 'LED', FALSE, FALSE, 'Phòng thí nghiệm'),
	(3, 'led3', 'LED 3', 'LED', FALSE, FALSE, 'Phòng thí nghiệm');

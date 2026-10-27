import 'dotenv/config';

function toInt(value, fallback) {
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : fallback;
}

// "*" hoặc để trống => cho phép mọi origin; ngược lại là danh sách phân tách bằng dấu phẩy
function parseOrigins(value) {
	if (!value || value.trim() === '*') return true;
	return value
		.split(',')
		.map((o) => o.trim())
		.filter(Boolean);
}

export const config = {
	port: toInt(process.env.PORT, 5000),
	corsOrigin: parseOrigins(process.env.CORS_ORIGIN),
	db: {
		host: process.env.DB_HOST || '127.0.0.1',
		port: toInt(process.env.DB_PORT, 3306),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'iot_dashboard',
	},
	controlTimeoutMs: toInt(process.env.CONTROL_TIMEOUT_MS, 3000),
	// Không nhận được message nào từ ESP32 sau khoảng này thì coi thiết bị offline
	offlineAfterMs: toInt(process.env.OFFLINE_AFTER_MS, 15000),
	mqtt: {
		host: process.env.MQTT_HOST || '127.0.0.1',
		port: toInt(process.env.MQTT_PORT, 1889),
		username: process.env.MQTT_USERNAME || '',
		password: process.env.MQTT_PASSWORD || '',
		clientId: process.env.MQTT_CLIENT_ID || 'iot-backend',
		topics: {
			sensor: process.env.MQTT_TOPIC_SENSOR || 'data/sensor',
			control: process.env.MQTT_TOPIC_CONTROL || 'device/control',
			response: process.env.MQTT_TOPIC_RESPONSE || 'device/response',
		},
	},
	// id trong bảng devices; deviceId = 0 trong lệnh điều khiển nghĩa là tác động lên tất cả
	deviceIds: [1, 2, 3],
	// Ngưỡng phân loại temp_status / humid_status / light_status trong bảng datasensor
	thresholds: {
		temperature: { low: 18, high: 35 },
		humidity: { low: 30, high: 80 },
		light: { low: 100, high: 800 },
	},
};

import { db } from '../config/db.js';

// sensor_key -> id, tránh truy vấn bảng sensor cho mỗi message 5 giây/lần
const idCache = new Map();

// Mỗi node ESP32 là một bản ghi trong bảng sensor, tự tạo khi gặp lần đầu
export async function findOrCreateSensorId(sensorKey) {
	if (idCache.has(sensorKey)) return idCache.get(sensorKey);

	await db().execute(
		`INSERT IGNORE INTO sensor (sensor_key, name, type, active)
		 VALUES (?, ?, 'DHT11+LDR', TRUE)`,
		[sensorKey, `Node ${sensorKey}`],
	);
	const [rows] = await db().execute('SELECT id FROM sensor WHERE sensor_key = ?', [sensorKey]);
	idCache.set(sensorKey, rows[0].id);
	return rows[0].id;
}

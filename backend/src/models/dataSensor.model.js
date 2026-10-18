import { db } from '../config/db.js';

const SELECT = `
	SELECT d.id, d.sensor_id, s.sensor_key, d.temperature, d.humidity, d.light, d.\`timestamp\`,
	       d.temp_status, d.humid_status, d.light_status
	FROM datasensor d
	LEFT JOIN sensor s ON s.id = d.sensor_id`;

function toReading(row) {
	return {
		id: row.id,
		sensorId: row.sensor_id,
		sensorKey: row.sensor_key,
		temperature: row.temperature,
		humidity: row.humidity,
		light: row.light,
		timestamp: row.timestamp,
		tempStatus: row.temp_status,
		humidStatus: row.humid_status,
		lightStatus: row.light_status,
	};
}

function buildWhere({ sensorKey, from, to }) {
	const clauses = [];
	const params = [];
	if (sensorKey) {
		clauses.push('s.sensor_key = ?');
		params.push(sensorKey);
	}
	if (from) {
		clauses.push('d.`timestamp` >= ?');
		params.push(from);
	}
	if (to) {
		clauses.push('d.`timestamp` <= ?');
		params.push(to);
	}
	return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export async function insertReading(reading) {
	const [result] = await db().execute(
		`INSERT INTO datasensor
		   (sensor_id, temperature, humidity, light, \`timestamp\`, temp_status, humid_status, light_status)
		 VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)`,
		[
			reading.sensorId,
			reading.temperature,
			reading.humidity,
			reading.light,
			reading.tempStatus,
			reading.humidStatus,
			reading.lightStatus,
		],
	);
	const [rows] = await db().execute(`${SELECT} WHERE d.id = ?`, [result.insertId]);
	return toReading(rows[0]);
}

export async function findLatest(sensorKey) {
	const { where, params } = buildWhere({ sensorKey });
	const [rows] = await db().execute(`${SELECT} ${where} ORDER BY d.id DESC LIMIT 1`, params);
	return rows[0] ? toReading(rows[0]) : null;
}

export async function findPage({ page, limit, ...filter }) {
	const { where, params } = buildWhere(filter);
	const offset = (page - 1) * limit;
	// LIMIT/OFFSET đã được validate là số nguyên nên ghép trực tiếp (execute không nhận tham số ở LIMIT)
	const [rows] = await db().execute(
		`${SELECT} ${where} ORDER BY d.\`timestamp\` DESC, d.id DESC LIMIT ${limit} OFFSET ${offset}`,
		params,
	);
	const [[{ total }]] = await db().execute(
		`SELECT COUNT(*) AS total FROM datasensor d LEFT JOIN sensor s ON s.id = d.sensor_id ${where}`,
		params,
	);
	return { items: rows.map(toReading), total };
}

import { db } from '../config/db.js';

function toDevice(row) {
	return {
		deviceId: row.id,
		deviceKey: row.device_key,
		name: row.name,
		type: row.type,
		state: Boolean(row.status),
		status: row.status ? 'ON' : 'OFF',
		online: Boolean(row.online),
		location: row.location,
		lastChanged: row.last_changed,
	};
}

export async function findAll(ids) {
	const [rows] = await db().query(
		'SELECT id, device_key, name, type, status, online, location, last_changed FROM devices WHERE id IN (?) ORDER BY id',
		[ids],
	);
	return rows.map(toDevice);
}

// Cập nhật trạng thái thực tế; last_changed chỉ đổi khi trạng thái thật sự thay đổi
export async function updateStatus(ids, status) {
	await db().query(
		`UPDATE devices
		 SET last_changed = IF(status <> ?, NOW(), last_changed), status = ?, online = TRUE
		 WHERE id IN (?)`,
		[status, status, ids],
	);
}

export async function setOnline(ids, online) {
	await db().query('UPDATE devices SET online = ? WHERE id IN (?)', [online, ids]);
}

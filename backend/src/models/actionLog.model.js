import { db } from '../config/db.js';

export const ACTION_STATUS = Object.freeze({
	LOADING: 'loading',
	SUCCESS: 'success',
	FAILED: 'failed',
});

const SELECT = `
	SELECT a.id, a.request_id, a.user_id, a.device_id, dv.name AS device_name,
	       a.action, a.status, a.\`timestamp\`
	FROM action_log a
	LEFT JOIN devices dv ON dv.id = a.device_id`;

function toAction(row) {
	return {
		id: row.id,
		requestId: row.request_id,
		userId: row.user_id,
		deviceId: row.device_id,
		deviceName: row.device_name,
		action: row.action,
		status: row.status,
		timestamp: row.timestamp,
	};
}

// Lệnh deviceId = 0 ghi 1 dòng cho mỗi đèn, cùng request_id
export async function insertForRequest({ requestId, deviceIds, action, status }) {
	const values = deviceIds.map((id) => [null, id, action, status, requestId]);
	await db().query(
		'INSERT INTO action_log (user_id, device_id, action, status, request_id) VALUES ?',
		[values],
	);
	return findByRequest(requestId);
}

export async function findByRequest(requestId) {
	const [rows] = await db().execute(`${SELECT} WHERE a.request_id = ? ORDER BY a.id`, [
		requestId,
	]);
	return rows.map(toAction);
}

export async function updateStatusByRequest(requestId, status, { onlyIf } = {}) {
	const params = [status, requestId];
	let sql = 'UPDATE action_log SET status = ? WHERE request_id = ?';
	if (onlyIf) {
		sql += ' AND status = ?';
		params.push(onlyIf);
	}
	await db().execute(sql, params);
	return findByRequest(requestId);
}

export async function findPage({ page, limit }) {
	const offset = (page - 1) * limit;
	const [rows] = await db().execute(
		`${SELECT} ORDER BY a.\`timestamp\` DESC, a.id DESC LIMIT ${limit} OFFSET ${offset}`,
	);
	const [[{ total }]] = await db().execute('SELECT COUNT(*) AS total FROM action_log');
	return { items: rows.map(toAction), total };
}

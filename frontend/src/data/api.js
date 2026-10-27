// Gọi REST API của backend và đổi dữ liệu về dạng các trang đang dùng.
// Đường dẫn tương đối: khi dev Vite proxy sang backend, khi build backend phục vụ luôn Frontend.

async function request(path, options) {
	const res = await fetch(`/api${path}`, options);
	const body = await res.json().catch(() => ({}));
	if (!res.ok || body.success === false) {
		throw new Error(body.message || `HTTP ${res.status}`);
	}
	return body.data;
}

// 1 bản ghi datasensor (nhiệt độ, độ ẩm, ánh sáng) -> 3 dòng, mỗi cảm biến 1 dòng
export function toSensorRows(reading) {
	const values = { 1: reading.temperature, 2: reading.humidity, 3: reading.light };
	return [1, 2, 3].map((sid) => ({
		id: (reading.id - 1) * 3 + sid,
		sensor_id: sid,
		value: values[sid],
		create_at: reading.timestamp,
	}));
}

export const toLatest = (reading) => ({
	1: reading.temperature,
	2: reading.humidity,
	3: reading.light,
});

export const toDevice = (d) => ({
	id: d.deviceId,
	name: d.name,
	status: d.status,
	online: d.online,
	pending: Boolean(d.pending),
});

export const toAction = (a) => ({
	id: a.id,
	device_id: a.deviceId,
	user_id: a.userId,
	action: a.action,
	status: a.status,
	time: a.timestamp,
});

export const fetchSensorHistory = (limit) => request(`/sensors/history?limit=${limit}&order=asc`);

export const fetchDevices = () => request('/device/status');

export const fetchActions = (limit) => request(`/device/actions?limit=${limit}`);

export const controlDevice = (deviceId, state) =>
	request('/device/control', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ deviceId, state }),
	});

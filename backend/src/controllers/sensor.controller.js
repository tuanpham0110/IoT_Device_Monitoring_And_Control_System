import { getHistory, getLatestReading } from '../services/sensor.service.js';
import { ApiError } from '../utils/ApiError.js';
import { parseDate, parsePagination } from '../utils/query.js';
import { ok } from '../utils/response.js';

// GET /api/sensors/latest?sensorKey=ESP32-01
export async function latest(req, res) {
	const reading = await getLatestReading(req.query.sensorKey);
	return ok(res, reading, reading ? 'OK' : 'Chưa có dữ liệu cảm biến');
}

// GET /api/sensors/history?limit=20&page=1&from=&to=&sensorKey=&order=desc|asc
export async function history(req, res) {
	const { page, limit } = parsePagination(req.query);
	const from = parseDate(req.query.from, 'from');
	const to = parseDate(req.query.to, 'to');
	if (from && to && from > to) {
		throw new ApiError(400, 'from phải nhỏ hơn hoặc bằng to');
	}

	const order = req.query.order ?? 'desc';
	if (order !== 'asc' && order !== 'desc') {
		throw new ApiError(400, 'order chỉ nhận asc hoặc desc');
	}

	const { items, pagination } = await getHistory({
		page,
		limit,
		from,
		to,
		sensorKey: req.query.sensorKey,
		order,
	});
	return ok(res, items, 'OK', { pagination });
}

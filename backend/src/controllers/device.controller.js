import { controlDevice, getActionHistory, getDeviceStatus } from '../services/device.service.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/query.js';
import { fail, ok } from '../utils/response.js';

// POST /api/device/control  body: { deviceId: 0|1|2|3, state: boolean }
export async function control(req, res) {
	const { deviceId, state } = req.body ?? {};
	if (!Number.isInteger(deviceId) || deviceId < 0 || deviceId > 3) {
		throw new ApiError(400, 'deviceId phải là số nguyên 0, 1, 2 hoặc 3 (0 = tất cả đèn)');
	}
	if (typeof state !== 'boolean') {
		throw new ApiError(400, 'state phải là boolean (true = bật, false = tắt)');
	}

	const result = await controlDevice({ deviceId, state });
	if (!result.success) {
		// ESP32 có phản hồi nhưng phần cứng không đạt trạng thái yêu cầu
		return fail(res, 502, result.message || 'ESP32 không thực hiện được lệnh', result);
	}
	return ok(res, result, result.message || 'Thực hiện lệnh thành công');
}

// GET /api/device/status
export async function status(_req, res) {
	return ok(res, await getDeviceStatus());
}

// GET /api/device/actions?page=1&limit=20
export async function actions(req, res) {
	const { items, pagination } = await getActionHistory(parsePagination(req.query));
	return ok(res, items, 'OK', { pagination });
}

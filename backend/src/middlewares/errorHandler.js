import { ApiError } from '../utils/ApiError.js';
import { fail } from '../utils/response.js';

export function notFound(req, _res, next) {
	next(new ApiError(404, `Không tìm thấy endpoint ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
	if (err instanceof ApiError) {
		return fail(res, err.status, err.message, err.data);
	}
	// Body JSON sai cú pháp (express.json)
	if (err.type === 'entity.parse.failed') {
		return fail(res, 400, 'Body không phải JSON hợp lệ');
	}
	if (err.name === 'ValidationError' || err.name === 'CastError') {
		return fail(res, 400, err.message);
	}

	console.error('[HTTP] Lỗi không xác định:', err);
	return fail(res, 500, 'Lỗi máy chủ nội bộ');
}

import { ApiError } from './ApiError.js';

export function parsePagination(query, { defaultLimit = 20, maxLimit = 500 } = {}) {
	const page = query.page === undefined ? 1 : Number(query.page);
	const limit = query.limit === undefined ? defaultLimit : Number(query.limit);

	if (!Number.isInteger(page) || page < 1) {
		throw new ApiError(400, 'page phải là số nguyên >= 1');
	}
	if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
		throw new ApiError(400, `limit phải là số nguyên từ 1 đến ${maxLimit}`);
	}
	return { page, limit };
}

export function parseDate(value, name) {
	if (value === undefined || value === '') return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new ApiError(
			400,
			`${name} không phải thời gian hợp lệ (YYYY-MM-DD HH:mm:ss hoặc ISO 8601)`,
		);
	}
	// Đổi về chuỗi giờ địa phương để so sánh với cột DATETIME trong MySQL
	const p = (n) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

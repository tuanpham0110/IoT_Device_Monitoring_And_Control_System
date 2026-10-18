// Tìm kiếm theo thời gian theo độ chi tiết, định dạng duy nhất YYYY-MM-DD HH:mm:ss.
// Nhập tới đơn vị nào thì lọc theo đơn vị đó:
//   2026-10-14 16:56:30 -> đúng giây      2026-10-14 16:56 -> cả phút
//   2026-10-14 16       -> cả giờ         2026-10-14       -> cả ngày
//   2026-10             -> cả tháng       2026             -> cả năm

const FIELDS = ['year', 'month', 'day', 'hour', 'minute', 'second'];
const RANGES = { month: [1, 12], day: [1, 31], hour: [0, 23], minute: [0, 59], second: [0, 59] };

export const UNIT_LABEL = {
	year: 'năm',
	month: 'tháng',
	day: 'ngày',
	hour: 'giờ',
	minute: 'phút',
	second: 'giây',
};

// Năm 4 chữ số, các phần sau 1-2 chữ số; cho phép dấu phân cách thừa ở cuối khi đang gõ dở
const PATTERN =
	/^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2})(?:\s+(\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?)?)?[-:\s]*$/;

/**
 * Phân tích chuỗi tìm kiếm.
 * @returns {null | { error: true } | { parts: object, unit: string }}
 *   null khi ô trống; error khi sai định dạng.
 */
export function parseTimeQuery(input) {
	const text = input.trim();
	if (!text) return null;

	const match = PATTERN.exec(text);
	if (!match) return { error: true };

	const parts = {};
	FIELDS.forEach((field, i) => {
		if (match[i + 1] !== undefined) parts[field] = Number(match[i + 1]);
	});
	for (const [key, [min, max]] of Object.entries(RANGES)) {
		if (parts[key] !== undefined && (parts[key] < min || parts[key] > max)) {
			return { error: true };
		}
	}

	const unit = [...FIELDS].reverse().find((f) => parts[f] !== undefined);
	return { parts, unit };
}

const cache = new Map();

// "YYYY-MM-DD HH:mm:ss" -> { year, month, ... }
function splitTime(text) {
	let fields = cache.get(text);
	if (!fields) {
		const nums = text.match(/\d+/g)?.map(Number) ?? [];
		fields = Object.fromEntries(FIELDS.map((f, i) => [f, nums[i]]));
		if (cache.size > 5000) cache.clear();
		cache.set(text, fields);
	}
	return fields;
}

export function matchesTime(text, query) {
	if (!query || query.error) return !query;
	const fields = splitTime(text);
	return Object.entries(query.parts).every(([key, value]) => fields[key] === value);
}

export function ok(res, data, message = 'OK', extra = {}) {
	return res.status(200).json({ success: true, message, data, ...extra });
}

export function fail(res, status, message, data) {
	const body = { success: false, message };
	if (data !== undefined) body.data = data;
	return res.status(status).json(body);
}

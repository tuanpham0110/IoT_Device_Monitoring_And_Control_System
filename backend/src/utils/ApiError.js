export class ApiError extends Error {
	constructor(status, message, data) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.data = data;
	}
}

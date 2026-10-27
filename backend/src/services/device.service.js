import { randomUUID } from 'node:crypto';
import { config } from '../config/index.js';
import * as ActionLog from '../models/actionLog.model.js';
import * as Device from '../models/device.model.js';
import { isMqttConnected, publishJson } from '../mqtt/client.js';
import { emit, SOCKET_EVENTS } from '../socket/index.js';
import { ApiError } from '../utils/ApiError.js';

const { ACTION_STATUS } = ActionLog;
const ALL_DEVICE_IDS = config.deviceIds;
// message ESP32 gửi kèm requestId "INIT" khi vừa kết nối MQTT
const INITIAL_STATE_MESSAGE = 'INITIAL_STATE';

// requestId -> { deviceIds, timer, resolve } của các lệnh đang chờ ESP32 phản hồi
const pending = new Map();

const targetsOf = (deviceId) => (deviceId === 0 ? ALL_DEVICE_IDS : [deviceId]);

function busyDeviceIds() {
	const busy = new Set();
	for (const { deviceIds } of pending.values()) deviceIds.forEach((id) => busy.add(id));
	return busy;
}

export async function getDeviceStatus() {
	const devices = await Device.findAll(ALL_DEVICE_IDS);
	const busy = busyDeviceIds();
	return devices.map((d) => ({ ...d, pending: busy.has(d.deviceId) }));
}

async function broadcastStatus() {
	const devices = await getDeviceStatus();
	emit(SOCKET_EVENTS.DEVICE_STATUS, devices);
	return devices;
}

// ===== Theo dõi online/offline: dựa vào lần cuối nhận message từ ESP32 =====

let lastSeen = 0;
let online = false;
let watchdog = null;

export async function markEsp32Seen() {
	lastSeen = Date.now();
	if (online) return;
	online = true;
	await Device.setOnline(ALL_DEVICE_IDS, true);
	await broadcastStatus();
}

export async function startOnlineWatchdog() {
	await Device.setOnline(ALL_DEVICE_IDS, false);
	watchdog = setInterval(async () => {
		if (!online || Date.now() - lastSeen < config.offlineAfterMs) return;
		online = false;
		try {
			await Device.setOnline(ALL_DEVICE_IDS, false);
			await broadcastStatus();
			console.warn('[ESP32] Không nhận được dữ liệu, đánh dấu offline');
		} catch (err) {
			console.error('[ESP32] Cập nhật offline thất bại:', err.message);
		}
	}, 5000);
}

export function stopOnlineWatchdog() {
	clearInterval(watchdog);
}

// ===== Điều khiển =====

/**
 * Publish lệnh tới ESP32 và chờ phản hồi trên device/response.
 * Trả về kết quả khi ESP32 phản hồi; ném ApiError khi lỗi hoặc timeout.
 */
export async function controlDevice({ deviceId, state }) {
	if (!isMqttConnected()) {
		throw new ApiError(503, 'Mất kết nối MQTT Broker, không thể gửi lệnh');
	}

	const targets = targetsOf(deviceId);
	const busy = busyDeviceIds();
	if (targets.some((id) => busy.has(id))) {
		throw new ApiError(409, 'Thiết bị đang chờ phản hồi từ lệnh trước, vui lòng thử lại sau');
	}

	const requestId = randomUUID();
	// Đăng ký pending trước mọi await để 2 request đồng thời không lọt qua kiểm tra ở trên
	const outcome = new Promise((resolve) => {
		const timer = setTimeout(() => {
			// Xoá ngay trong callback để phản hồi đến muộn được xử lý như "late response"
			pending.delete(requestId);
			resolve({ timedOut: true });
		}, config.controlTimeoutMs);
		pending.set(requestId, { deviceIds: targets, timer, resolve });
	});

	try {
		const actions = await ActionLog.insertForRequest({
			requestId,
			deviceIds: targets,
			action: state ? 'ON' : 'OFF',
			status: ACTION_STATUS.LOADING,
		});
		emit(SOCKET_EVENTS.DEVICE_ACTION, actions);
		await broadcastStatus();
		await publishJson(config.mqtt.topics.control, { requestId, deviceId, state });
		console.log(`[Control] Đã gửi lệnh ${requestId}: device ${deviceId} -> ${state}`);
	} catch (err) {
		clearTimeout(pending.get(requestId)?.timer);
		pending.delete(requestId);
		const actions = await ActionLog.updateStatusByRequest(
			requestId,
			ACTION_STATUS.FAILED,
		).catch(() => []);
		if (actions.length) emit(SOCKET_EVENTS.DEVICE_ACTION, actions);
		await broadcastStatus().catch(() => {});
		throw new ApiError(502, `Không gửi được lệnh: ${err.message}`, { requestId });
	}

	const result = await outcome;
	if (!result.timedOut) return result.data;

	const actions = await ActionLog.updateStatusByRequest(requestId, ACTION_STATUS.FAILED, {
		onlyIf: ACTION_STATUS.LOADING,
	});
	emit(SOCKET_EVENTS.DEVICE_ACTION, actions);
	const devices = await broadcastStatus();

	throw new ApiError(504, `ESP32 không phản hồi sau ${config.controlTimeoutMs}ms`, {
		requestId,
		deviceId,
		requestedState: state,
		actions,
		devices,
	});
}

function parseResponsePayload(payload) {
	const { esp32Id, requestId, deviceId, requestedState, actualState, success, message } =
		payload ?? {};
	if (typeof requestId !== 'string' || !requestId) throw new Error('requestId không hợp lệ');
	if (!Number.isInteger(deviceId) || deviceId < 0 || deviceId > ALL_DEVICE_IDS.length) {
		throw new Error('deviceId không hợp lệ');
	}
	if (typeof actualState !== 'boolean') throw new Error('actualState phải là boolean');
	if (typeof success !== 'boolean') throw new Error('success phải là boolean');
	return {
		esp32Id: typeof esp32Id === 'string' ? esp32Id : null,
		requestId,
		deviceId,
		requestedState: typeof requestedState === 'boolean' ? requestedState : null,
		actualState,
		success,
		message: typeof message === 'string' ? message : '',
	};
}

// ESP32 gửi trạng thái từng đèn mỗi khi (re)connect MQTT: chỉ đồng bộ DB, không phải lệnh điều khiển
async function syncInitialState(res) {
	lastSeen = Date.now();
	online = true;
	await Device.updateStatus(targetsOf(res.deviceId), res.actualState);
	console.log(`[ESP32] Trạng thái ban đầu device ${res.deviceId}: ${res.actualState}`);
	await broadcastStatus();
}

// Gọi khi nhận message trên topic device/response
export async function handleDeviceResponse(payload) {
	const res = parseResponsePayload(payload);
	if (res.message === INITIAL_STATE_MESSAGE) return syncInitialState(res);

	const entry = pending.get(res.requestId);
	if (entry) {
		clearTimeout(entry.timer);
		pending.delete(res.requestId);
	}
	lastSeen = Date.now();
	online = true;

	// Luôn đồng bộ DB theo trạng thái phần cứng thực tế mà ESP32 báo về
	const targets = targetsOf(res.deviceId);
	await Device.updateStatus(targets, res.actualState);

	const requestedState = res.requestedState ?? res.actualState;
	const verified = res.success && res.actualState === requestedState;
	const status = verified ? ACTION_STATUS.SUCCESS : ACTION_STATUS.FAILED;

	let actions = await ActionLog.findByRequest(res.requestId);
	actions = actions.length
		? await ActionLog.updateStatusByRequest(res.requestId, status)
		: // Lệnh không do backend gửi (ví dụ thử bằng MQTT client) vẫn được ghi lại
			await ActionLog.insertForRequest({
				requestId: res.requestId,
				deviceIds: targets,
				action: requestedState ? 'ON' : 'OFF',
				status,
			});

	console.log(
		`[Control] Phản hồi ${res.requestId}: ${status} (actualState=${res.actualState})${entry ? '' : ' [đến muộn]'}`,
	);

	const devices = await broadcastStatus();
	emit(SOCKET_EVENTS.DEVICE_ACTION, actions);
	entry?.resolve({
		timedOut: false,
		data: {
			requestId: res.requestId,
			deviceId: res.deviceId,
			requestedState,
			actualState: res.actualState,
			success: verified,
			message: res.message,
			esp32Id: res.esp32Id,
			actions,
			devices,
		},
	});
}

export async function getActionHistory({ page, limit }) {
	const { items, total } = await ActionLog.findPage({ page, limit });
	return {
		items,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
}

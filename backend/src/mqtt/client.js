import { randomUUID } from 'node:crypto';
import mqtt from 'mqtt';
import { config } from '../config/index.js';
import { emit, SOCKET_EVENTS } from '../socket/index.js';

let client = null;
let lastConnected = false;
const handlers = new Map();

function setConnected(connected) {
	if (connected === lastConnected) return;
	lastConnected = connected;
	emit(SOCKET_EVENTS.MQTT_STATUS, { connected });
}

/**
 * Kết nối tới broker và đăng ký handler cho từng topic.
 * @param {Record<string, (payload: object) => Promise<void> | void>} topicHandlers
 */
export function connectMqtt(topicHandlers) {
	for (const [topic, handler] of Object.entries(topicHandlers)) {
		handlers.set(topic, handler);
	}

	const { host, port, username, password, clientId } = config.mqtt;
	const url = `mqtt://${host}:${port}`;

	client = mqtt.connect(url, {
		username,
		password,
		// Thêm hậu tố ngẫu nhiên để 2 instance backend không đá nhau khỏi broker
		clientId: `${clientId}-${randomUUID().slice(0, 8)}`,
		clean: true,
		reconnectPeriod: 3000,
		connectTimeout: 10_000,
	});

	client.on('connect', () => {
		console.log(`[MQTT] Đã kết nối ${url}`);
		setConnected(true);
		const topics = [...handlers.keys()];
		client.subscribe(topics, { qos: 1 }, (err) => {
			if (err) console.error('[MQTT] Subscribe thất bại:', err.message);
			else console.log(`[MQTT] Đã subscribe: ${topics.join(', ')}`);
		});
	});

	client.on('reconnect', () => console.log('[MQTT] Đang kết nối lại...'));
	client.on('offline', () => console.warn('[MQTT] Offline'));
	client.on('close', () => setConnected(false));
	client.on('error', (err) => console.error('[MQTT] Lỗi:', err.message));

	client.on('message', async (topic, buffer) => {
		const handler = handlers.get(topic);
		if (!handler) return;

		let payload;
		try {
			payload = JSON.parse(buffer.toString());
		} catch {
			console.warn(`[MQTT] Bỏ qua payload không phải JSON trên ${topic}: ${buffer}`);
			return;
		}

		try {
			await handler(payload);
		} catch (err) {
			console.error(`[MQTT] Xử lý message ${topic} thất bại:`, err.message);
		}
	});

	return client;
}

export function isMqttConnected() {
	return Boolean(client?.connected);
}

export function publishJson(topic, payload) {
	return new Promise((resolve, reject) => {
		if (!isMqttConnected()) {
			reject(new Error('MQTT chưa kết nối'));
			return;
		}
		client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) =>
			err ? reject(err) : resolve(),
		);
	});
}

export function closeMqtt() {
	return new Promise((resolve) => (client ? client.end(false, {}, () => resolve()) : resolve()));
}

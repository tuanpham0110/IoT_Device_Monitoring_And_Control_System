import { config } from '../config/index.js';
import * as DataSensor from '../models/dataSensor.model.js';
import { findOrCreateSensorId } from '../models/sensor.model.js';
import { emit, SOCKET_EVENTS } from '../socket/index.js';
import { markEsp32Seen } from './device.service.js';

const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

function classify(value, { low, high }) {
	if (value < low) return 'LOW';
	if (value > high) return 'HIGH';
	return 'NORMAL';
}

function parseSensorPayload(payload) {
	const { deviceId, temperature, humidity, light } = payload ?? {};
	if (typeof deviceId !== 'string' || !deviceId.trim()) {
		throw new Error('deviceId phải là chuỗi');
	}
	if (!isNumber(temperature) || !isNumber(humidity) || !isNumber(light)) {
		throw new Error('temperature, humidity, light phải là số');
	}
	return { sensorKey: deviceId.trim(), temperature, humidity, light: Math.round(light) };
}

// Gọi khi nhận message trên topic data/sensor
export async function saveSensorReading(payload) {
	const { sensorKey, temperature, humidity, light } = parseSensorPayload(payload);
	const { thresholds } = config;

	const reading = await DataSensor.insertReading({
		sensorId: await findOrCreateSensorId(sensorKey),
		temperature,
		humidity,
		light,
		tempStatus: classify(temperature, thresholds.temperature),
		humidStatus: classify(humidity, thresholds.humidity),
		lightStatus: classify(light, thresholds.light),
	});
	emit(SOCKET_EVENTS.SENSOR_DATA, reading);
	await markEsp32Seen();
	return reading;
}

export function getLatestReading(sensorKey) {
	return DataSensor.findLatest(sensorKey);
}

export async function getHistory({ page, limit, from, to, sensorKey, order }) {
	const { items, total } = await DataSensor.findPage({ page, limit, from, to, sensorKey });
	// Phân trang theo thứ tự mới nhất trước, rồi đảo lại nếu cần tăng dần để vẽ biểu đồ
	if (order === 'asc') items.reverse();
	return {
		items,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
}

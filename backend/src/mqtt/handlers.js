import { config } from '../config/index.js';
import { handleDeviceResponse } from '../services/device.service.js';
import { saveSensorReading } from '../services/sensor.service.js';

// Ánh xạ topic MQTT -> hàm xử lý
export function buildTopicHandlers() {
	const { topics } = config.mqtt;
	return {
		[topics.sensor]: saveSensorReading,
		[topics.response]: handleDeviceResponse,
	};
}

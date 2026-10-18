import http from 'node:http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { config } from './config/index.js';
import { closeMqtt, connectMqtt, isMqttConnected } from './mqtt/client.js';
import { buildTopicHandlers } from './mqtt/handlers.js';
import {
	getDeviceStatus,
	startOnlineWatchdog,
	stopOnlineWatchdog,
} from './services/device.service.js';
import { getLatestReading } from './services/sensor.service.js';
import { closeSocket, initSocket, SOCKET_EVENTS } from './socket/index.js';

// Gửi trạng thái hiện tại cho client vừa kết nối để Frontend hiển thị ngay
async function sendSnapshot(socket) {
	try {
		socket.emit(SOCKET_EVENTS.MQTT_STATUS, { connected: isMqttConnected() });
		socket.emit(SOCKET_EVENTS.DEVICE_STATUS, await getDeviceStatus());
		const reading = await getLatestReading();
		if (reading) socket.emit(SOCKET_EVENTS.SENSOR_DATA, reading);
	} catch (err) {
		console.error('[Socket.IO] Gửi snapshot thất bại:', err.message);
	}
}

async function start() {
	await connectDatabase();
	await startOnlineWatchdog();

	const server = http.createServer(createApp());
	initSocket(server, { corsOrigin: config.corsOrigin, onConnection: sendSnapshot });
	connectMqtt(buildTopicHandlers());

	server.on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			console.error(
				`[HTTP] Cổng ${config.port} đang bị chiếm, có thể backend đã chạy ở terminal khác`,
			);
		} else {
			console.error('[HTTP] Lỗi server:', err.message);
		}
		process.exit(1);
	});
	server.listen(config.port, () => {
		console.log(`[HTTP] Backend chạy tại http://localhost:${config.port}/api`);
	});

	let shuttingDown = false;
	const shutdown = async (signal) => {
		if (shuttingDown) return;
		shuttingDown = true;
		console.log(`\n[Server] Nhận ${signal}, đang tắt...`);
		stopOnlineWatchdog();
		await closeSocket();
		await closeMqtt();
		await new Promise((resolve) => server.close(resolve));
		await disconnectDatabase();
		process.exit(0);
	};
	process.on('SIGINT', () => shutdown('SIGINT'));
	process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
	console.error('[Server] Khởi động thất bại:', err.message);
	process.exit(1);
});

import { Server } from 'socket.io';

// Các sự kiện realtime gửi tới Frontend
export const SOCKET_EVENTS = Object.freeze({
	SENSOR_DATA: 'sensor:data',
	DEVICE_STATUS: 'device:status',
	DEVICE_ACTION: 'device:action',
	MQTT_STATUS: 'mqtt:status',
});

let io = null;

export function initSocket(httpServer, { corsOrigin, onConnection }) {
	io = new Server(httpServer, {
		cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
	});

	io.on('connection', (socket) => {
		console.log(`[Socket.IO] Client kết nối: ${socket.id}`);
		socket.on('disconnect', (reason) => {
			console.log(`[Socket.IO] Client ngắt kết nối: ${socket.id} (${reason})`);
		});
		onConnection?.(socket);
	});

	return io;
}

export function emit(event, payload) {
	io?.emit(event, payload);
}

export function closeSocket() {
	return new Promise((resolve) => (io ? io.close(() => resolve()) : resolve()));
}

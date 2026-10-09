// Dữ liệu giả lập (mock). Khi có backend, thay các hàm trong AppContext bằng gọi API / MQTT.

export const SENSORS = {
	1: {
		name: 'Cảm biến nhiệt độ',
		short: 'Nhiệt độ',
		type: 'DHT22',
		unit: '°C',
		min: 24,
		max: 34,
		scale: 50,
		color: '#ef4444',
	},
	2: {
		name: 'Cảm biến độ ẩm',
		short: 'Độ ẩm',
		type: 'DHT22',
		unit: '%',
		min: 60,
		max: 80,
		scale: 100,
		color: '#0ea5e9',
	},
	3: {
		name: 'Cảm biến ánh sáng',
		short: 'Ánh sáng',
		type: 'LDR',
		unit: 'lux',
		min: 180,
		max: 320,
		scale: 1000,
		color: '#f59e0b',
	},
};

export const INITIAL_DEVICES = [
	{ id: 1, name: 'LED 1', status: 'OFF', pending: false },
	{ id: 2, name: 'LED 2', status: 'ON', pending: false },
	{ id: 3, name: 'LED 3', status: 'OFF', pending: false },
];

// Sửa thông tin cá nhân của bạn ở đây.
// Ảnh đại diện: đặt file ảnh vào thư mục public/ với tên avatar.jpg
// (nếu không có ảnh, trang Profile sẽ hiện chữ cái đầu của họ tên).
export const USER = {
	id: 1,
	username: 'tuan_admin',
	password: '123456',
	fullname: 'Phạm Đức Tuấn',
	student_id: 'B23DCCN892',
	date_of_birth: '2005-10-01',
	avatar: 'avatar.jpg',
	github: 'https://github.com/tuanpham0110/IoT_Device_Monitoring_And_Control_System',
	figma: 'https://www.figma.com/proto/4hSDTsu3et40rxpsdr3eMX/BaiTapIoT?node-id=12-186&t=lk2y9XnxFyMajJEe-1',
	postman: 'https://www.postman.com/tuanpham0110-9126390/baitpiot',
	report: 'https://docs.google.com/document/d/1vy5W5nzxrIxGzW-Eu80vGilGijdTTIeu_VvsyH1UhRc/edit?usp=sharing',
};

export function formatTime(d) {
	const p = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function nextValue(sensorId, prev) {
	const s = SENSORS[sensorId];
	const span = s.max - s.min;
	const base = prev ?? s.min + span / 2;
	const next = base + (Math.random() - 0.5) * span * 0.12;
	return Math.round(Math.min(s.max, Math.max(s.min, next)) * 10) / 10;
}

// Sinh lịch sử ban đầu: mỗi 3 giây một lượt đọc cả 3 cảm biến
export function seedSensorData(rounds = 200) {
	const rows = [];
	const last = {};
	const start = Date.now() - rounds * 3000;
	let id = 1;
	for (let r = 0; r < rounds; r++) {
		for (const sid of [1, 2, 3]) {
			last[sid] = nextValue(sid, last[sid]);
			rows.push({
				id: id++,
				sensor_id: sid,
				value: last[sid],
				create_at: formatTime(new Date(start + r * 3000)),
			});
		}
	}
	return { rows, last };
}

export function seedActions() {
	const plan = [
		[2, 'ON', 'success'],
		[1, 'ON', 'success'],
		[1, 'OFF', 'success'],
		[3, 'ON', 'success'],
		[3, 'OFF', 'success'],
		[2, 'OFF', 'failed'],
		[1, 'ON', 'success'],
		[1, 'OFF', 'success'],
	];
	const start = Date.now() - 60 * 60 * 1000;
	return plan.map(([device_id, action, status], i) => ({
		id: i + 1,
		device_id,
		user_id: 1,
		action,
		status,
		time: formatTime(new Date(start + i * 5 * 60 * 1000)),
	}));
}

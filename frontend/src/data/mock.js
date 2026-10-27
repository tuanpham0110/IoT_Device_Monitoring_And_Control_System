// Cấu hình hiển thị cảm biến và thông tin người dùng. Dữ liệu thật lấy từ backend (src/data/api.js).

export const SENSORS = {
	1: {
		name: 'Cảm biến nhiệt độ',
		short: 'Nhiệt độ',
		type: 'DHT11',
		unit: '°C',
		scale: 50,
		color: '#ef4444',
	},
	2: {
		name: 'Cảm biến độ ẩm',
		short: 'Độ ẩm',
		type: 'DHT11',
		unit: '%',
		scale: 100,
		color: '#0ea5e9',
	},
	3: {
		name: 'Cảm biến ánh sáng',
		short: 'Ánh sáng',
		type: 'LDR',
		// ESP32 gửi giá trị ADC thô 12 bit (0-4095) đọc từ LDR
		unit: 'ADC',
		scale: 4095,
		color: '#f59e0b',
	},
};

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

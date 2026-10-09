# IoT Phòng thông minh (React + Vite)

## Chạy project

```bash
npm install
npm run dev      # mở http://localhost:5173
npm run build    # build ra thư mục dist/
```

Tài khoản demo: `tuan_admin` / `123456`

## Cấu trúc

```
src/
  main.jsx, App.jsx          # điểm vào + định tuyến (HashRouter, chặn trang khi chưa đăng nhập)
  styles.css                 # toàn bộ giao diện
  context/AppContext.jsx     # state chung: đăng nhập, dữ liệu cảm biến, thiết bị, log
  data/mock.js               # dữ liệu giả lập (cảm biến, LED 1-3, user)
  data/chart.js              # gom data_sensor theo thời điểm để vẽ biểu đồ
  components/                # Layout (sidebar + header), DataTable, Pagination, Toggle, Icons
  pages/                     # Login, Dashboard, DataSensor, DeviceAction, Profile
```

## Nối với backend thật

Mọi dữ liệu đều đi qua `src/context/AppContext.jsx`, nên chỉ cần sửa file này:

- `setInterval` giả lập ESP32 -> thay bằng MQTT qua WebSocket (`mqtt.js`) hoặc Socket.IO từ backend.
- `toggleDevice` -> gọi API `POST /api/devices/:id/toggle`, chờ phản hồi rồi cập nhật trạng thái.
- `login` -> gọi API `POST /api/auth/login`.
- Dữ liệu bảng `data_sensor`, `device_action` -> lấy bằng `fetch` từ API.

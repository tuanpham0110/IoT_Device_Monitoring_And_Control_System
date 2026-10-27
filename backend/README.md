# IoT Backend

Backend Node.js (Express 5) kết nối ESP32 qua MQTT, lưu dữ liệu vào MySQL, cung cấp REST API và Socket.IO cho Frontend.

```
ESP32 ──MQTT──► Broker ◄──MQTT── Backend ──REST / Socket.IO──► Frontend
                                    │
                                  MySQL
```

## Cấu trúc thư mục

```
backend/
├── .env.example                 # Mẫu biến môi trường
├── database/
│   └── schema.sql               # Tạo bảng users, sensor, devices, datasensor, action_log
├── postman/
│   └── IoT-Backend.postman_collection.json
└── src/
    ├── server.js                # Khởi động: DB -> HTTP -> Socket.IO -> MQTT, graceful shutdown
    ├── app.js                   # Express app: CORS, JSON, routes, xử lý lỗi
    ├── config/
    │   ├── index.js             # Đọc .env
    │   └── db.js                # Tạo database, chạy schema.sql, connection pool MySQL
    ├── mqtt/
    │   ├── client.js            # Kết nối broker, subscribe, publish, tự reconnect
    │   └── handlers.js          # Ánh xạ topic -> service
    ├── socket/index.js          # Socket.IO + tên sự kiện realtime
    ├── models/                  # Truy vấn SQL cho từng bảng (mysql2)
    ├── services/                # Nghiệp vụ: lưu cảm biến, điều khiển và chờ phản hồi ESP32
    ├── controllers/             # Validate request, gọi service, trả JSON
    ├── routes/                  # Định nghĩa endpoint
    ├── middlewares/errorHandler.js
    └── utils/                   # ApiError, response chuẩn, parse query
```

## Chạy

Yêu cầu Node.js >= 18.17 và MySQL 8. Backend tự tạo database `DB_NAME` và các bảng khi khởi động, không cần chạy SQL bằng tay.

```bash
cd backend
npm install
cp .env.example .env      # rồi điền DB_PASSWORD, MQTT_PASSWORD...
npm run dev               # hoặc: npm start
```

Máy chạy backend phải truy cập được broker MQTT (`MQTT_HOST:MQTT_PORT`). Nếu broker chạy cùng máy với backend thì để `MQTT_HOST=127.0.0.1`; ESP32 vẫn dùng IP LAN của máy đó.

Sau khi build Frontend (`cd frontend && npm run build`), backend phục vụ luôn giao diện tại `http://localhost:5000`.

## REST API

Base URL: `http://localhost:5000/api`. Mọi response có dạng:

```json
{ "success": true, "message": "OK", "data": {}, "pagination": {} }
```

| Method | Endpoint                                                           | Mô tả                                                                       |
| ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| GET    | `/health`                                                          | Trạng thái kết nối MQTT, MySQL                                              |
| POST   | `/device/control`                                                  | Body `{ "deviceId": 0-3, "state": true/false }`. `deviceId = 0` là cả 3 đèn |
| GET    | `/device/status`                                                   | Trạng thái LED1-LED3                                                        |
| GET    | `/device/actions?page=1&limit=20`                                  | Lịch sử lệnh điều khiển                                                     |
| GET    | `/sensors/latest?sensorKey=`                                       | Bản ghi cảm biến mới nhất                                                   |
| GET    | `/sensors/history?limit=20&page=1&from=&to=&order=desc&sensorKey=` | Lịch sử cảm biến có phân trang, lọc theo thời gian                          |

### Luồng `POST /device/control`

1. Validate body, kiểm tra MQTT còn kết nối và thiết bị không có lệnh khác đang chờ.
2. Sinh `requestId` (UUID), ghi `action_log` trạng thái `loading` (lệnh `deviceId = 0` ghi 3 dòng, mỗi đèn 1 dòng), publish lên `device/control`.
3. Chờ `device/response` có cùng `requestId` trong `CONTROL_TIMEOUT_MS` (mặc định 3000ms).
4. Khi có phản hồi, cập nhật `devices.status` theo `actualState` (trạng thái phần cứng thật). `action_log.status` thành `success` khi `success = true` và `actualState === requestedState`, ngược lại là `failed`. Hết thời gian chờ cũng là `failed`.

| HTTP | Ý nghĩa                                     |
| ---- | ------------------------------------------- |
| 200  | ESP32 xác nhận thành công                   |
| 400  | Body không hợp lệ                           |
| 409  | Thiết bị đang chờ phản hồi của lệnh trước   |
| 502  | ESP32 báo thất bại, hoặc không publish được |
| 503  | Mất kết nối MQTT Broker                     |
| 504  | Hết thời gian chờ ESP32                     |

Nếu ESP32 phản hồi sau khi đã timeout, backend vẫn cập nhật trạng thái đèn và đổi `action_log` theo kết quả thật.

`devices.online` bật khi nhận được message từ ESP32 và tắt khi im lặng quá `OFFLINE_AFTER_MS` (mặc định 15 giây).

## Database

Theo mục 4.2 của báo cáo. Thời gian lưu dạng `DATETIME` giờ máy và API trả về chuỗi `YYYY-MM-DD HH:mm:ss`, đúng định dạng Frontend tìm kiếm.

| Bảng         | Ghi bởi backend                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `users`      | Chưa dùng (chưa có API đăng nhập)                                                               |
| `sensor`     | Tự thêm 1 dòng cho mỗi node ESP32 lần đầu gửi dữ liệu (`sensor_key` = `deviceId` trong payload) |
| `devices`    | Tạo sẵn LED 1-3 với `id` 1-3, cập nhật `status`, `online`, `last_changed`                       |
| `datasensor` | Mỗi message `data/sensor` một dòng, kèm `temp_status`, `humid_status`, `light_status`           |
| `action_log` | Mỗi lệnh điều khiển, thêm cột `request_id` để khớp phản hồi ESP32                               |

`*_status` nhận `LOW`, `NORMAL`, `HIGH` theo ngưỡng trong `src/config/index.js`: nhiệt độ 18-35°C, độ ẩm 30-80%, ánh sáng 100-800.

## Socket.IO

Kết nối tới `http://localhost:5000`. Ngay khi kết nối, server gửi snapshot gồm `mqtt:status`, `device:status` và `sensor:data` mới nhất.

| Sự kiện         | Payload                                                         |
| --------------- | --------------------------------------------------------------- |
| `sensor:data`   | Bản ghi cảm biến vừa lưu                                        |
| `device:status` | Mảng trạng thái 3 đèn (có `online`, `pending`)                  |
| `device:action` | Các dòng `action_log` của một lệnh (loading / success / failed) |
| `mqtt:status`   | `{ connected: boolean }`                                        |

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000');
socket.on('sensor:data', (reading) => console.log(reading));
socket.on('device:status', (devices) => console.log(devices));
```

## Postman

Import file `postman/IoT-Backend.postman_collection.json`. Đổi biến `baseUrl` của collection nếu backend chạy ở máy hoặc cổng khác.

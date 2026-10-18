# IoT Device Monitoring And Control System

Hệ thống giám sát cảm biến và điều khiển đèn qua ESP32.

```
ESP32 ──MQTT──► Broker ◄──MQTT── backend ──REST / Socket.IO──► frontend
```

| Thư mục                | Nội dung                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| [frontend/](frontend/) | Giao diện React + Vite, xem [frontend/README.md](frontend/README.md)       |
| [backend/](backend/)   | Node.js Express + MQTT + MySQL, xem [backend/README.md](backend/README.md) |

## Chạy

Ở thư mục gốc có thể chạy nhanh `npm run dev` (frontend) và `npm run backend` (backend). Hoặc vào từng thư mục:

```bash
# Terminal 1
cd backend
npm install
npm run dev     # http://localhost:5000/api

# Terminal 2
cd frontend
npm install
npm run dev     # http://localhost:5173
```

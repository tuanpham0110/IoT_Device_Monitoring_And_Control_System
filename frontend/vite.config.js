import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Backend chạy ở cổng 5000. Khi `npm run dev`, Vite chuyển tiếp /api và /socket.io sang đó
// nên Frontend luôn gọi đường dẫn tương đối, build xong vẫn chạy được khi backend phục vụ dist/.
const BACKEND_URL = 'http://localhost:5000';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			'/api': BACKEND_URL,
			'/socket.io': { target: BACKEND_URL, ws: true },
		},
	},
});

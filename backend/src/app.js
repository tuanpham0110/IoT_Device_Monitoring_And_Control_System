import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

const FRONTEND_DIST = fileURLToPath(new URL('../../frontend/dist', import.meta.url));

// Express 5 tự chuyển lỗi từ async handler sang errorHandler, không cần try/catch trong controller
export function createApp() {
	const app = express();

	app.use(cors({ origin: config.corsOrigin }));
	app.use(express.json({ limit: '100kb' }));

	app.use('/api', apiRoutes);
	// Bản build của Frontend (cd frontend && npm run build) => mở http://localhost:5000
	app.use(express.static(FRONTEND_DIST));

	app.use(notFound);
	app.use(errorHandler);
	return app;
}

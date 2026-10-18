import cors from 'cors';
import express from 'express';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

// Express 5 tự chuyển lỗi từ async handler sang errorHandler, không cần try/catch trong controller
export function createApp() {
	const app = express();

	app.use(cors({ origin: config.corsOrigin }));
	app.use(express.json({ limit: '100kb' }));

	app.use('/api', apiRoutes);

	app.use(notFound);
	app.use(errorHandler);
	return app;
}

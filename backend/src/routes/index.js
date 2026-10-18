import { Router } from 'express';
import { isDatabaseConnected } from '../config/db.js';
import { isMqttConnected } from '../mqtt/client.js';
import { ok } from '../utils/response.js';
import deviceRoutes from './device.routes.js';
import sensorRoutes from './sensor.routes.js';

const router = Router();

router.get('/health', async (_req, res) =>
	ok(res, {
		uptime: Math.round(process.uptime()),
		mqtt: isMqttConnected(),
		database: await isDatabaseConnected(),
	}),
);
router.use('/device', deviceRoutes);
router.use('/sensors', sensorRoutes);

export default router;

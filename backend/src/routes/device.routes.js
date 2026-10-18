import { Router } from 'express';
import { actions, control, status } from '../controllers/device.controller.js';

const router = Router();

router.post('/control', control);
router.get('/status', status);
router.get('/actions', actions);

export default router;

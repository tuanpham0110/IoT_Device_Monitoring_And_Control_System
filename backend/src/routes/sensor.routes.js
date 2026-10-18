import { Router } from 'express';
import { history, latest } from '../controllers/sensor.controller.js';

const router = Router();

router.get('/latest', latest);
router.get('/history', history);

export default router;

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listLamps, getLamp, toggleLamp, setMode, shutdownLamp } from '../controllers/lampController.js';

const r = Router();
r.use(requireAuth);
r.get('/', listLamps);
r.get('/:id', getLamp);
r.patch('/:id/toggle', toggleLamp);
r.patch('/:id/mode', setMode);
r.patch('/:id/shutdown', requireAdmin, shutdownLamp);
export default r;

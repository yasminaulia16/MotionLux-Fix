import { Router } from 'express'; import { requireDevice } from '../middleware/iotAuth.js'; import { heartbeat,deviceState,deviceLampState,deviceMotion } from '../controllers/iotController.js';
const r=Router(); r.use(requireDevice); r.post('/heartbeat',heartbeat); r.get('/state',deviceState); r.post('/lamp-state',deviceLampState); r.post('/motion',deviceMotion); export default r;

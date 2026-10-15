import { Router } from 'express'; import { requireAuth } from '../middleware/auth.js'; import { getMotion,updateMotion,testMotion } from '../controllers/motionController.js';
const r=Router(); r.use(requireAuth); r.get('/',getMotion); r.put('/',updateMotion); r.post('/test',testMotion); export default r;

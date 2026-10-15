import { Router } from 'express'; import { requireAuth } from '../middleware/auth.js'; import { getSun,updateSun } from '../controllers/sunController.js';
const r=Router(); r.use(requireAuth); r.get('/',getSun); r.put('/',updateSun); export default r;

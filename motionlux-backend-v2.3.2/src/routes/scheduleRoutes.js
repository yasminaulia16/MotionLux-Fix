import { Router } from 'express'; import { requireAuth } from '../middleware/auth.js'; import { listSchedules,createSchedule,updateSchedule,deleteSchedule } from '../controllers/scheduleController.js';
const r=Router(); r.use(requireAuth); r.get('/',listSchedules); r.post('/',createSchedule); r.put('/:id',updateSchedule); r.delete('/:id',deleteSchedule); export default r;

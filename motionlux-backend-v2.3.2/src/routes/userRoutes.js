import { Router } from 'express'; import { requireAuth,requireAdmin } from '../middleware/auth.js'; import { listUsers,createUser,updateUser,deleteUser } from '../controllers/userController.js';
const r=Router(); r.use(requireAuth,requireAdmin); r.get('/',listUsers); r.post('/',createUser); r.put('/:id',updateUser); r.delete('/:id',deleteUser); export default r;

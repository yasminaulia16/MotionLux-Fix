import { Router } from 'express'; import { requireAuth } from '../middleware/auth.js'; import { getProfile,updateProfile } from '../controllers/settingsController.js';
const r=Router(); r.use(requireAuth); r.get('/profile',getProfile); r.put('/profile',updateProfile); export default r;

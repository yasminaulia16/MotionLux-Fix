import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ok } from './utils/response.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import lampRoutes from './routes/lampRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import sunRoutes from './routes/sunRoutes.js';
import motionRoutes from './routes/motionRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import iotRoutes from './routes/iotRoutes.js';
import { dashboard } from './controllers/dashboardController.js';
import { supabase } from './config/supabase.js';
import { applyAutomationToLamps } from './services/automationService.js';

const app=express();
const port=Number(process.env.PORT||3000);
app.use(cors({origin:process.env.FRONTEND_URL||'http://localhost:5173'}));
app.use(express.json());
app.use(morgan('dev'));
app.get('/api/health',(req,res)=>ok(res,{status:'ok',service:'motionlux-backend',version:'2.3.2'}));
app.use('/api/auth',authRoutes);
app.use('/api/users',userRoutes);
app.use('/api/dashboard',requireAuth,dashboard);
app.use('/api/lamps',lampRoutes);
app.use('/api/schedules',scheduleRoutes);
app.use('/api/sun',sunRoutes);
app.use('/api/motion',motionRoutes);
app.use('/api/settings',settingsRoutes);
app.use('/api/iot',iotRoutes);
app.use(notFound);
app.use(errorHandler);

async function automationTick() {
  try {
    await applyAutomationToLamps(supabase);
  } catch (error) {
    console.error('Automation tick failed:', error.message);
  }
}

app.listen(port, async () => {
  console.log(`MotionLux API running at http://localhost:${port}`);
  await automationTick();
  setInterval(automationTick, 5000);
});

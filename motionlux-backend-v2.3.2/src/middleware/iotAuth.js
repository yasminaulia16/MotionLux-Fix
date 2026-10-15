import { fail } from '../utils/response.js';
export function requireDevice(req, res, next) {
  const key = req.headers['x-device-key'];
  if (!key || key !== process.env.IOT_DEVICE_KEY) return fail(res, 'Invalid device key.', 401);
  next();
}

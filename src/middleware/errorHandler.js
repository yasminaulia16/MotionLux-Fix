export function notFound(req, res) { res.status(404).json({ ok:false, message:`Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(err, req, res, next) { console.error(err); res.status(500).json({ ok:false, message:err.message || 'Internal server error' }); }

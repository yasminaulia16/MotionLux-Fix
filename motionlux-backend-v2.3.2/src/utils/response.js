export const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });
export const fail = (res, message, status = 400, details = undefined) => res.status(status).json({ ok: false, message, ...(details ? { details } : {}) });

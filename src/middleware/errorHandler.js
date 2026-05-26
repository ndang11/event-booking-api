
export const errorHandler = (err, req, res, _next) => {
   if (process.env.NODE_ENV !== 'test') {
     console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
   }

   if (err.code === '23505') {
     return res.status(409).json({
       success: false,
       error: 'A record with this value already exists',
     });
   }

   const status  = err.status ?? err.statusCode ?? 500;
   const message = status < 500 ? err.message : 'Internal server error';

   return res.status(status).json({ success: false, error: message });
 };
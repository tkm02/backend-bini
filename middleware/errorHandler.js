// src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  const status = err.status || 500;
  const message = err.message || 'Erreur serveur interne';

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
};

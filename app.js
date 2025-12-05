// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
// Import des routes et middlewares avec require
// ATTENTION: Assurez-vous que ces fichiers utilisent aussi module.exports !
const routes = require('./routes/index.js'); 
const { errorHandler } = require('./middleware/errorHandler.js');
const { requestLogger } = require('./middleware/logging.js');

dotenv.config();

const app = express();

// ✅ Middleware de sécurité
app.use(helmet());
app.use(cors({ 
 origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
// ✅ Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ Middleware de logs
app.use(requestLogger);

// ✅ Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Gestionnaire d'erreurs global
app.use(errorHandler);

module.exports = app;

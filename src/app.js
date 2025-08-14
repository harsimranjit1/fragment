// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./logger');
const pino = require('pino-http')({ logger });
const { createErrorResponse } = require('./response');

const app = express();

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    exposedHeaders: ['Location', 'Content-Type', 'ETag'],
  })
);
app.use((_, res, next) => {
  res.set('Access-Control-Expose-Headers', 'Location, Content-Type, ETag');
  next();
});

// Parsers
app.use(express.json());
app.use(express.text({ type: ['text/*'] }));

// Logging / security / utils
app.use(pino);
app.use(helmet());
app.use(compression());

// Root routes (health, etc.)
app.use('/', require('./routes'));

// Mount fragments router WITHOUT Passport
const fragmentsRouter = require('./routes/api/v1/fragments');
app.use('/v1/fragments', fragmentsRouter);

// 404
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Error handler (must have 4 args)
app.use((err, req, res, next) => {
  if (req.log && typeof req.log.error === 'function') {
    req.log.error({ err }, 'Unhandled error');
  }
  const pickNumeric = (...vals) => {
    for (const v of vals) {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 100 && n <= 599) return n;
    }
    return 500;
  };
  const code = pickNumeric(err?.statusCode, err?.error?.code, err?.status, 500);
  const message =
    (typeof err?.message === 'string' && err.message) ||
    (typeof err?.error?.message === 'string' && err.error.message) ||
    'Internal Server Error';
  if (res.headersSent) return next(err);
  res.status(code).json(createErrorResponse(code, message));
});

module.exports = app;

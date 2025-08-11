// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const passport = require('passport');
const logger = require('./logger');
const pino = require('pino-http')({ logger });
const { createErrorResponse } = require('./response');

const app = express();

// Parsers
app.use(express.json()); // JSON API payloads
app.use(express.text({ type: ['text/*'] })); // raw text fragments only

// Logging / security / utils
app.use(pino);
app.use(helmet());
app.use(cors());
app.use(compression());

// Passport (strategy set in auth-middleware at request time)
app.use(passport.initialize());

// Routes
app.use('/', require('./routes'));

// 404 (numeric code only)
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Error handler (MUST be last and have 4 params)
app.use((err, req, res) => {
  // Prefer numeric fields; ignore strings like 'error'
  const pickNumeric = (...vals) => {
    for (const v of vals) {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 100 && n <= 599) return n;
    }
    return 500;
  };

  const code = pickNumeric(err?.statusCode, err?.error?.code, err?.status, 500);
  const message = err?.message ?? err?.error?.message ?? 'Internal Server Error';

  res.status(code).json(createErrorResponse(code, message));
});

module.exports = app;

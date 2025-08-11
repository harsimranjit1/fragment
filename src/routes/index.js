// src/routes/index.js
const express = require('express');
const { version, author } = require('../../package.json');
const authenticate = require('../auth/auth-middleware');
const { createSuccessResponse } = require('../response');

const router = express.Router();

// 👇 protect everything under /v1
router.use('/v1', authenticate(), require('./api/v1'));

// health check
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      author,
      githubUrl: 'https://github.com/harsimranjit1/fragment',
      version,
    })
  );
});

module.exports = router;

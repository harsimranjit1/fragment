const express = require('express');
const authenticate = require('../auth/auth-middleware');
const { createSuccessResponse } = require('../response');
const { hostname } = require('os');

const router = express.Router();

// Protect everything under /v1 and mount ONE router
router.use('/v1', authenticate(), require('./api'));

// Health check
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      // TODO: make sure these are changed for your name and repo
      author: 'HARSIMRANJIT KAUR',
      githubUrl: 'https://github.com/harsimranjit1/fragment',

      // Include the hostname in the response
      hostname: hostname(),
    })
  );
});

module.exports = router;

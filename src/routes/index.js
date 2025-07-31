// src/routes/index.js

const express = require('express');
const { version, author } = require('../../package.json');

// Our authentication middleware
const { authenticate } = require('../auth');

const router = express.Router();

/**
 * Expose all of our API routes on /v1/* to include an API version.
 * Protect them all with middleware so you have to be authenticated
 * in order to access things.
 */
router.use('/v1', authenticate(), require('./api'));

/**
 * Define a simple health check route. If the server is running
 * we'll respond with a 200 OK.  If not, the server isn't healthy.
 */
router.get('/', (req, res) => {
  // Clients shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');
  // Send a 200 'OK' response
  res.status(200).json({
    status: 'ok',
    author,
    // Use your GitHub URL
    githubUrl: 'https://github.com/harsimranjit1/fragment',
    version,
  });
});

module.exports = router;

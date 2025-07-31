const express = require('express');
const { version, author } = require('../../package.json');
const { authenticate } = require('../auth');

const router = express.Router();

/**
 * Expose all of our API routes on /v1/* to include an API version.
 * Protect them all so you have to be authenticated in order to access.
 */
router.use('/v1', authenticate(), require('./api'));

// Health check endpoint
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: 'https://github.com/harsimranjit1/fragment',
    version,
  });
});

module.exports = router;

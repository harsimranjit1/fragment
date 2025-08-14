// src/routes/index.js
const express = require('express');
const router = express.Router();
const { createSuccessResponse } = require('../response');

// Load once per process (safe + fast)
const pkg = require('../../package.json');

// Normalize a GitHub URL from package.json
// function getGithubUrl() {
//   // Support either string or { url } forms
//   if (typeof pkg.repository === 'string') return pkg.repository;
//   if (pkg.repository && pkg.repository.url) return pkg.repository.url;
//   // fallback to homepage if that’s your GitHub URL
//   return pkg.homepage || '';
// }

// Health check
router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      author: pkg.author, // e.g., "harsimranjit1"
      githubUrl: 'https://github.com/harsimranjit1/fragment',
      version: pkg.version, // e.g., "0.9.1"
    })
  );
});

// Mount your API routes (keep your existing structure)
router.use('/v1', require('./api/v1'));

module.exports = router;

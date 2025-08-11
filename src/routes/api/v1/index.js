const express = require('express');
const router = express.Router();

// ✅ Mount fragments routes
router.use('/fragments', require('./fragments'));

module.exports = router;

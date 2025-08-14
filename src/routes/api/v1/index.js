const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../../model/fragment');

const router = express.Router();

// Route-specific raw body parser that only allows supported content types
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const header = req.headers['content-type'];
        if (!header) return false;
        const { type } = contentType.parse(header); // strips charset
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

// List
router.get('/fragments', require('./get'));
// Create (raw body)
router.post('/fragments', rawBody(), require('./post'));

// router.put('/fragments/:id', require('./put'));

// // Metadata JSON
// router.get('/fragments/:id', require('./get-by-id'));

// // RAW bytes
// router.get('/fragments/:id/raw', require('./get-by-id-raw'));

// // Converted (stub OK for now)
// router.get('/fragments/:id.:ext', require('./get-converted'));

module.exports = router;

const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

const router = express.Router();

// Route-specific raw body parser that only allows supported content types
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const header = req.headers['content-type'];
        if (!header) {
          console.log('[rawBody] no content-type header');
          return false;
        }
        const { type } = contentType.parse(header); // strips charset
        const ok = Fragment.isSupportedType(type);
        console.log('[rawBody] header=', header, 'parsed=', type, 'gate ok=', ok);
        return ok;
      } catch (e) {
        console.log('[rawBody] parse error:', e.message);
        return false;
      }
    },
  });

// List
router.get('/fragments', require('./get'));

// Get raw by id
router.get('/fragments/:id', require('./get-by-id'));

// Converted (e.g., .html)
router.get('/fragments/:id.:ext', require('./get-converted'));

// Create (raw body)
router.post('/fragments', rawBody(), require('./post'));

module.exports = router;

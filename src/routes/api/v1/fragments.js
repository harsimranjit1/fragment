// src/routes/api/v1/fragments.js

const express = require('express');
const router = express.Router();
const { Fragment } = require('../../../model/fragment');
const authenticate = require('../../../auth/auth-middleware'); // no args!
const { createSuccessResponse, createErrorResponse } = require('../../../response');
const logger = require('../../../logger');

/**
 * POST /v1/fragments
 * Creates a new fragment for the authenticated user.
 */
router.post('/', authenticate(), async (req, res) => {
  try {
    const type = req.get('Content-Type');

    if (!Fragment.isSupportedType(type)) {
      return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
    }

    // req.user is now the hashed email
    const fragment = new Fragment({ ownerId: req.user, type, size: 0 });
    await fragment.save();

    const data = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '', 'utf-8');
    await fragment.setData(data);

    res
      .status(201)
      .location(`/v1/fragments/${fragment.id}`)
      .json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    res.status(500).json(createErrorResponse(500, 'Error creating fragment'));
  }
});

/**
 * GET /v1/fragments
 * Returns a list of fragment IDs (or full objects with ?expand=1).
 */
router.get('/', authenticate(), async (req, res) => {
  try {
    const expand = req.query.expand === '1';
    const fragments = await Fragment.byUser(req.user, expand);
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragments list');
    res.status(500).json(createErrorResponse(500, 'Error retrieving fragments list'));
  }
});

/**
 * GET /v1/fragments/:id
 * Returns an existing fragment's data.
 */
router.get('/:id', authenticate(), async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    if (!fragment) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    const data = await fragment.getData();
    res.setHeader('Content-Type', fragment.type);
    res.status(200).send(data);
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment by ID');
    res.status(404).json(createErrorResponse(404, err.message));
  }
});

module.exports = router;

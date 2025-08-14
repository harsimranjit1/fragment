// src/routes/api/v1/fragments.js
const express = require('express');
const router = express.Router();
const contentType = require('content-type');

const { Fragment } = require('../../../model/fragment');
const authenticate = require('../../../auth/auth-middleware');
const { createSuccessResponse, createErrorResponse } = require('../../../response');
const logger = require('../../../logger');
const data = require('../../../model/data');
const getConverted = require('./get-converted'); // ensure this file exists at v1/get-converted.js

// Raw body parser so POST receives a Buffer for supported types
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

/**
 * POST /v1/fragments
 * Creates a new fragment.
 */
router.post('/', rawBody(), authenticate(), async (req, res) => {
  try {
    const typeHeader = req.get('Content-Type');
    if (!Fragment.isSupportedType(typeHeader)) {
      return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
    }

    const baseType = String(typeHeader).split(';')[0].trim().toLowerCase();
    let buf;

    if (Buffer.isBuffer(req.body)) {
      buf = req.body;
    } else if (baseType === 'application/json') {
      buf = Buffer.from(
        typeof req.body === 'object' && req.body !== null
          ? JSON.stringify(req.body)
          : String(req.body ?? ''),
        'utf-8'
      );
    } else if (baseType.startsWith('text/')) {
      buf = Buffer.from(String(req.body ?? ''), 'utf-8');
    } else {
      return res.status(415).json(createErrorResponse(415, 'Unsupported Content-Type'));
    }

    const fragment = new Fragment({ ownerId: req.user, type: typeHeader, size: 0 });
    await fragment.save();
    await fragment.setData(buf);

    const base = `${req.protocol}://${req.get('host')}`;
    res.set('Location', `${base}/v1/fragments/${fragment.id}`);
    return res.status(201).json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    return res.status(500).json(createErrorResponse(500, 'Error creating fragment'));
  }
});

/**
 * GET /v1/fragments
 * List fragments (ids or expanded).
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
 * GET /v1/fragments/:id/info  (MUST be before '/:id')
 * Returns JSON metadata only.
 */
router.get('/:id/info', authenticate(), async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    if (!fragment) return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    const meta = fragment.toJSON ? fragment.toJSON() : fragment;
    res.status(200).json(createSuccessResponse({ fragment: meta }));
  } catch (err) {
    res.status(404).json(createErrorResponse(404, 'Fragment not found', err));
  }
});

/**
 * GET /v1/fragments/:id.:ext  (MUST be before '/:id')
 * Conversion handler (e.g., markdown -> html).
 */
router.get('/:id.:ext', authenticate(), getConverted);

/**
 * GET /v1/fragments/:id
 * Return the RAW bytes with the fragment's Content-Type header.
 */
router.get('/:id', authenticate(), async (req, res) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    if (!fragment) return res.status(404).json(createErrorResponse(404, 'Fragment not found'));

    const buf = await fragment.getData();
    res.set('Content-Type', fragment.type);
    return res.status(200).send(buf);
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment data');
    return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }
});

/**
 * DELETE /v1/fragments/:id
 * Delete S3 object and metadata.
 */
router.delete('/:id', authenticate(), async (req, res, next) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // delete data from S3 (best-effort)
    try {
      await data.deleteFragment(ownerId, id);
    } catch (e) {
      logger?.warn?.({ e, ownerId, id }, 'Non-fatal error deleting S3 object');
    }

    // delete metadata
    if (typeof fragment.delete === 'function') {
      await fragment.delete();
    } else if (typeof Fragment.delete === 'function') {
      await Fragment.delete(ownerId, id);
    }

    return res.status(200).json(createSuccessResponse({ fragmentId: id }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;

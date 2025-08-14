// src/routes/api/get.js
const { createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');

module.exports = async (req, res, next) => {
  try {
    // Support ?expand=1 or ?expand=true to return full metadata, otherwise just IDs
    const expand = req.query.expand === '1' || req.query.expand === 'true';
    const fragments = await Fragment.byUser(req.user, expand);
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (err) {
    next(err);
  }
};

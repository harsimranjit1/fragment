// src/routes/api/post.js
const { Fragment } = require('../../model/fragment');

module.exports = async (req, res, next) => {
  try {
    // Content-Type header is required and must be supported
    const type = req.headers['content-type'];
    if (!type || !Fragment.isSupportedType(type)) {
      return res.status(415).json({
        status: 'error',
        error: { code: 415, message: `Unsupported Content-Type: ${type || 'missing'}` },
      });
    }

    // Create metadata using the model (constructor hashes ownerId internally)
    const fragment = new Fragment({
      ownerId: req.user, // email in Basic Auth; model hashes it
      type, // normalized in model
      size: 0,
    });

    // Save raw bytes (Buffer or string). This writes data and updates size.
    await fragment.setData(req.body);

    // Persist metadata (updated timestamp, etc.)
    await fragment.save();

    // Location header with absolute URL to the new resource
    const location = `${process.env.API_URL || 'http://localhost:8080'}/v1/fragments/${fragment.id}`;
    res.set('Location', location);

    // 201 response with metadata JSON
    return res.status(201).json({
      status: 'ok',
      fragment: fragment.toJSON(),
    });
  } catch (err) {
    return next(err);
  }
};

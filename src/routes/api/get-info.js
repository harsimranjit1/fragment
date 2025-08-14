// src/routes/api/v1/get-info.js
const Fragment = require('../../model/fragment');

module.exports = async (req, res) => {
  const { id } = req.params;
  try {
    const fragment = await Fragment.byId(req.user, id);
    return res.status(200).json({ status: 'ok', fragment: fragment.toJSON() });
  } catch (err) {
    req.log?.warn?.({ err, id }, 'GET /v1/fragments/:id/info failed');
    return res.status(404).json({ status: 'error', error: { code: 404, message: 'not found' } });
  }
};

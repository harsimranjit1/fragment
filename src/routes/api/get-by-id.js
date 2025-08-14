const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const fragment = await Fragment.byId(req.user, id);
    return res.status(200).json({ status: 'ok', fragment: fragment.toJSON() });
  } catch {
    return res.status(404).json({ status: 'error', error: { code: 404, message: 'not found' } });
  }
};

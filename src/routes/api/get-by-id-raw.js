const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const fragment = await Fragment.byId(req.user, id);

    const data = await fragment.getData();
    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ status: 'error', error: { code: 404, message: 'fragment data not found' } });
    }

    const baseType = fragment.mimeType;
    res.setHeader('Content-Type', fragment.isText ? `${baseType}; charset=utf-8` : baseType);
    return res.status(200).send(data);
  } catch {
    return res.status(404).json({ status: 'error', error: { code: 404, message: 'not found' } });
  }
};

// src/routes/api/v1/get-converted.js
const MarkdownIt = require('markdown-it');
const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');

const md = new MarkdownIt();

module.exports = async (req, res) => {
  const { id, ext } = req.params;

  try {
    const fragment = await Fragment.byId(req.user, id);

    // Only requirement for A2: Markdown -> HTML
    if (fragment.type === 'text/markdown' && ext.toLowerCase() === 'html') {
      const buf = await fragment.getData();
      const markdown = buf.toString('utf-8');
      const html = md.render(markdown);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // (Optional tiny nicety) Allow .txt from text/plain
    if (fragment.type === 'text/plain' && ext.toLowerCase() === 'txt') {
      const buf = await fragment.getData();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(buf);
    }

    // Unsupported conversion
    return res
      .status(415)
      .json(createErrorResponse(415, 'Unsupported conversion for this fragment/type'));
  } catch (err) {
    return res.status(404).json(createErrorResponse(404, err));
  }
};

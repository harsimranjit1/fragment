module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fragments',
    version: process.env.npm_package_version || 'dev',
  });
};

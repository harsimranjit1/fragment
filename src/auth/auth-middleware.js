// src/auth/auth-middleware.js
const passport = require('passport');
const chooseStrategy = require('./index');
const { createErrorResponse } = require('../response');
const logger = require('../logger');

module.exports = () => {
  return (req, res, next) => {
    let strat;
    try {
      strat = chooseStrategy();
    } catch (err) {
      logger.error({ err }, 'Auth configuration error');
      return res.status(500).json(createErrorResponse(500, 'Authentication configuration error'));
    }

    function callback(err, user) {
      if (err) {
        logger.warn({ err }, 'Error during authentication');
        return res.status(500).json(createErrorResponse(500, 'Unable to authenticate user'));
      }
      if (!user) {
        return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
      }
      req.user = user;
      next();
    }

    passport.authenticate(strat, { session: false }, callback)(req, res, next);
  };
};

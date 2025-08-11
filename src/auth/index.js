// src/auth/index.js
const passport = require('passport');
const logger = require('../logger');

module.exports = () => {
  // 1) HTTP Basic if HTPASSWD_FILE is set
  if (process.env.HTPASSWD_FILE) {
    const basicAuth = require('./basic-auth');
    if (!passport._strategies.http) {
      passport.use('http', basicAuth.strategy());
    }
    logger.info('Using HTTP Basic Auth for authentication');
    return 'http';
  }

  // 2) Otherwise Cognito if fully configured
  if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
    const cognito = require('./cognito');
    const strat = cognito(); // registers bearer (once) and returns 'bearer'
    logger.info('Using AWS Cognito for authentication');
    return strat;
  }

  // 3) Nothing configured
  throw new Error('No valid authentication configuration found. Check your environment variables');
};

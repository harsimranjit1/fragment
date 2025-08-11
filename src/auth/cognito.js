// src/auth/cognito.js
const passport = require('passport');
const { Strategy: BearerStrategy } = require('passport-http-bearer');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const logger = require('../logger');

function ensureEnv() {
  if (!(process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID)) {
    throw new Error('missing expected env vars: AWS_COGNITO_POOL_ID, AWS_COGNITO_CLIENT_ID');
  }
}

function buildVerifier() {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_COGNITO_POOL_ID,
    clientId: process.env.AWS_COGNITO_CLIENT_ID,
    tokenUse: 'id', // the SPA sends an ID token as Bearer
  });

  verifier
    .hydrate()
    .then(() => logger.info('Cognito JWKS cached'))
    .catch((err) => logger.error({ err }, 'Unable to cache Cognito JWKS'));

  return verifier;
}

let registered = false;

/**
 * Registers the Cognito Bearer strategy (once) and returns the strategy name.
 * Usage elsewhere: const strat = require('./cognito')(); // -> 'bearer'
 */
module.exports = function cognito() {
  ensureEnv();
  logger.info('Using AWS Cognito for auth');

  if (!registered) {
    const jwtVerifier = buildVerifier();

    passport.use(
      'bearer',
      new BearerStrategy(async (token, done) => {
        try {
          const claims = await jwtVerifier.verify(token);
          logger.debug({ claims }, 'verified user token');
          // choose a stable user id for req.user
          const userId = claims.email || claims['cognito:username'] || claims.sub;
          return done(null, userId);
        } catch (err) {
          logger.warn({ err }, 'could not verify token');
          return done(null, false);
        }
      })
    );

    registered = true;
  }

  return 'bearer';
};

// Optional helper if some code does: require('./cognito').authenticate()
module.exports.authenticate = () => passport.authenticate('bearer', { session: false });

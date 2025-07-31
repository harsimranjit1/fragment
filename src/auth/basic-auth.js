// // src/auth/basic-auth.js
// const { BasicStrategy } = require('passport-http');
// const path = require('path');
// const fs = require('fs');
// const bcrypt = require('bcrypt');
// const logger = require('../logger');

// /**
//  * Load .htpasswd users into memory for testing
//  */
// function loadUsers() {
//   const htpasswdPath = path.join(__dirname, '../../tests/.htpasswd');
//   const lines = fs.readFileSync(htpasswdPath, 'utf-8').split('\n').filter(Boolean);
//   const users = {};
//   for (const line of lines) {
//     const [user, hash] = line.split(':');
//     users[user] = hash;
//   }
//   return users;
// }

// module.exports = () => {
//   const users = loadUsers();

//   logger.info('✅ Basic Auth strategy configured for test environment using passport-http');

//   return new BasicStrategy((username, password, done) => {
//     if (!users[username]) {
//       return done(null, false);
//     }
//     // Compare bcrypt hash from .htpasswd
//     bcrypt.compare(password, users[username], (err, res) => {
//       if (err) return done(err);
//       if (!res) return done(null, false);
//       return done(null, { email: username });
//     });
//   });
// };

// src/auth/basic-auth.js

// Configure HTTP Basic Auth strategy for Passport, see:
// https://github.com/http-auth/http-auth-passport

const auth = require('http-auth');
const passport = require('passport');
const authPassport = require('http-auth-passport');
const logger = require('../logger');

// We expect HTPASSWD_FILE to be defined.
if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

// Log that we're using Basic Auth
logger.info('Using HTTP Basic Auth for auth');

module.exports.strategy = () =>
  // For our Passport authentication strategy, we'll look for a
  // username/password pair in the Authorization header.
  authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );

module.exports.authenticate = () => passport.authenticate('http', { session: false });

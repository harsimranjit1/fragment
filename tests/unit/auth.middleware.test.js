// tests/unit/auth.middleware.test.js
const express = require('express');
const request = require('supertest');
const passport = require('passport');

// force BASIC for this test and provide creds
process.env.AUTH_STRATEGY = 'basic';
process.env.BASIC_USER_1_EMAIL = 'user1@email.com';
process.env.BASIC_USER_1_PASSWORD = 'password1';

// require the auth index so it REGISTERs the strategy on passport
require('../../src/auth');

const authorize = require('../../src/auth/auth-middleware');

const app = express();
// In app.js you do this; do the same here:
app.use(passport.initialize());

// Protected route using your custom middleware
app.get('/protected', authorize(), (req, res) => {
  res.json({ ok: true, user: req.user });
});

describe('auth-middleware', () => {
  test('no auth header -> 401', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  test('bad basic creds -> 401', async () => {
    const res = await request(app).get('/protected').auth('bad', 'creds');
    expect(res.status).toBe(401);
  });

  test('valid basic creds -> 200', async () => {
    const res = await request(app)
      .get('/protected')
      .auth(process.env.BASIC_USER_1_EMAIL, process.env.BASIC_USER_1_PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toBeDefined();
  });
});

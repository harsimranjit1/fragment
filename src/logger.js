// //lab1
// // src/logger.js

// // Use `info` as our standard log level if not specified
// const options = { level: process.env.LOG_LEVEL || 'info' };

// // If we're doing `debug` logging, make the logs easier to read
// if (options.level === 'debug') {
//   // https://github.com/pinojs/pino-pretty
//   options.transport = {
//     target: 'pino-pretty',
//     options: {
//       colorize: true,
//     },
//   };
// }

// // Create and export a Pino Logger instance:
// // https://getpino.io/#/docs/api?id=logger
// module.exports = require('pino')(options);

const pino = require('pino');

// Configure Pino with environment-based log level
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' } // Makes logs human-readable in dev
      : undefined,
});

module.exports = logger;
